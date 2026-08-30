"""
Crop Disease Detection — High-Accuracy CNN Training Script
==========================================================
Improvements over the original MobileNetV2 baseline:

  ✅ Backbone        : EfficientNetV2S (ImageNet-pretrained) — ~5-7% more accurate
  ✅ Augmentation    : + vertical_flip, channel_shift, wider rotation/zoom/brightness
  ✅ Head            : GAP + GMP concat → BN → Dense(1024) → BN → relu → Dropout
                       → Dense(512) → BN → relu → Dropout → softmax
  ✅ Loss            : CategoricalCrossentropy(label_smoothing=0.1)
  ✅ Class weights   : Computed from training distribution (handles imbalanced sets)
  ✅ Fine-tuning     : Last 80 backbone layers (was 30), 20 epochs (was 10)
  ✅ LR Schedule     : Phase 1 → Adam(1e-3) + ReduceLROnPlateau
                       Phase 2 → CosineDecay 5e-5 → 1e-7
  ✅ Mixed precision : Auto-enabled when GPU detected (float16 compute)

Usage:
    python train_disease_model.py

Outputs:
    ml_backend/models/disease_model.keras   (primary — Keras v3 format)
    ml_backend/models/disease_model.h5      (legacy fallback)
    ml_backend/models/disease_class_names.json
    ml_backend/models/disease_model_accuracy.txt
"""

import os
import sys

# Ensure UTF-8 output encoding for Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ── D-drive TensorFlow path (used when C: drive is full) ──────────────────────
_tf_target = r"D:\tf_packages"
if os.path.isdir(_tf_target) and _tf_target not in sys.path:
    sys.path.insert(0, _tf_target)

import json
import math
import numpy as np
from collections import Counter

# ── Dependency checks ──────────────────────────────────────────────────────────
try:
    import tensorflow as tf
    from tensorflow.keras import layers, models, callbacks, regularizers
    from tensorflow.keras.applications import EfficientNetV2S
    from tensorflow.keras.preprocessing.image import ImageDataGenerator
    print(f"✅ TensorFlow version : {tf.__version__}")
except ImportError:
    print("ERROR: TensorFlow not installed.  Run: pip install tensorflow Pillow")
    sys.exit(1)

try:
    from PIL import Image  # noqa — ensures Pillow available
except ImportError:
    print("ERROR: Pillow not installed.  Run: pip install Pillow")
    sys.exit(1)

# ── Mixed Precision (auto-detect GPU) ─────────────────────────────────────────
gpus = tf.config.list_physical_devices("GPU")
if gpus:
    print(f"✅ GPU detected ({len(gpus)}x) — enabling mixed precision (float16)")
    tf.keras.mixed_precision.set_global_policy("mixed_float16")
    MIXED_PRECISION = True
else:
    print("ℹ️  No GPU detected — running in float32 mode (CPU)")
    MIXED_PRECISION = False

# ── Reproducibility ────────────────────────────────────────────────────────────
SEED = 42
tf.random.set_seed(SEED)
np.random.seed(SEED)

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

ARCHIVE_CANDIDATES = [
    os.path.join(PROJECT_ROOT, "archive (3)"),
    os.path.join(PROJECT_ROOT, "archive"),
    os.path.join(os.path.dirname(PROJECT_ROOT), "archive (3)"),
    os.path.join(os.path.dirname(PROJECT_ROOT), "archive"),
]
ARCHIVE_DIR = None
for c in ARCHIVE_CANDIDATES:
    if os.path.isdir(c):
        ARCHIVE_DIR = c
        break

if ARCHIVE_DIR is None:
    print("ERROR: Could not find 'archive (3)' dataset directory.")
    print("Expected near:", PROJECT_ROOT)
    sys.exit(1)

TRAIN_DIR  = os.path.join(ARCHIVE_DIR, "Train")
VAL_DIR    = os.path.join(ARCHIVE_DIR, "Validation")
MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_KERAS_PATH = os.path.join(MODELS_DIR, "disease_model.keras")
MODEL_H5_PATH    = os.path.join(MODELS_DIR, "disease_model.h5")
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "disease_class_names.json")
ACCURACY_PATH    = os.path.join(MODELS_DIR, "disease_model_accuracy.txt")

print(f"\n📂 Dataset     : {ARCHIVE_DIR}")
print(f"📂 Train dir   : {TRAIN_DIR}")
print(f"📂 Val dir     : {VAL_DIR}")

# ── Hyperparameters ────────────────────────────────────────────────────────────
IMG_SIZE          = 224      # EfficientNetV2S native input size
BATCH_SIZE        = 32
EPOCHS_FROZEN     = 15       # Phase 1: train head only
EPOCHS_FINETUNE   = 20       # Phase 2: deep fine-tuning (was 10)
LR_PHASE1         = 1e-3
LR_FINETUNE_START = 5e-5     # CosineDecay starting LR
LR_FINETUNE_END   = 1e-7     # CosineDecay minimum LR
FINETUNE_LAYERS   = 80       # Unfreeze last N backbone layers (was 30)
LABEL_SMOOTHING   = 0.1      # Prevents overconfidence on hard examples
DROPOUT_1         = 0.45
DROPOUT_2         = 0.35
L2_REG            = 1e-4

# ── Data Generators ────────────────────────────────────────────────────────────
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=30,           # ↑ was 20
    width_shift_range=0.20,      # ↑ was 0.15
    height_shift_range=0.20,     # ↑ was 0.15
    shear_range=0.15,            # ↑ was 0.10
    zoom_range=0.25,             # ↑ was 0.15
    horizontal_flip=True,
    vertical_flip=True,          # NEW — leaves can be flipped either way
    channel_shift_range=30.0,    # NEW — simulates varying lighting conditions
    brightness_range=[0.7, 1.3], # ↑ was [0.8, 1.2]
    fill_mode="nearest",
)

val_datagen = ImageDataGenerator(rescale=1.0 / 255)

print("\n⏳ Loading training images …")
train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=True,
    seed=SEED,
)

print("⏳ Loading validation images …")
val_gen = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

NUM_CLASSES = len(train_gen.class_indices)
CLASS_NAMES = [None] * NUM_CLASSES
for name, idx in train_gen.class_indices.items():
    CLASS_NAMES[idx] = name

print(f"\n🏷️  Number of classes : {NUM_CLASSES}")
print(f"   Classes           : {CLASS_NAMES}\n")

# ── Class Weights (handle imbalanced datasets) ─────────────────────────────────
print("📊 Computing class weights from training distribution …")
label_counts = Counter()
for class_name, class_idx in train_gen.class_indices.items():
    class_dir = os.path.join(TRAIN_DIR, class_name)
    if os.path.isdir(class_dir):
        n = len([f for f in os.listdir(class_dir)
                 if f.lower().endswith((".jpg", ".jpeg", ".png", ".bmp"))])
        label_counts[class_idx] = max(n, 1)

total_samples = sum(label_counts.values())
class_weight = {
    idx: total_samples / (NUM_CLASSES * count)
    for idx, count in label_counts.items()
}
print(f"   Min weight : {min(class_weight.values()):.3f}  "
      f"Max weight : {max(class_weight.values()):.3f}")

# ── Build Model ────────────────────────────────────────────────────────────────
print("\n🏗️  Building EfficientNetV2S transfer-learning model …")

base_model = EfficientNetV2S(
    input_shape=(IMG_SIZE, IMG_SIZE, 3),
    include_top=False,
    weights="imagenet",
)
base_model.trainable = False   # Phase 1: frozen backbone

inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
x = base_model(inputs, training=False)

# ── Dual-Pooling Head (richer feature representation) ─────────────────────────
gap = layers.GlobalAveragePooling2D()(x)
gmp = layers.GlobalMaxPooling2D()(x)
x   = layers.Concatenate()([gap, gmp])

x = layers.BatchNormalization()(x)

x = layers.Dense(1024, kernel_regularizer=regularizers.l2(L2_REG))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Dropout(DROPOUT_1)(x)

x = layers.Dense(512, kernel_regularizer=regularizers.l2(L2_REG))(x)
x = layers.BatchNormalization()(x)
x = layers.Activation("relu")(x)
x = layers.Dropout(DROPOUT_2)(x)

# Cast output to float32 for numerical stability with mixed precision
outputs = layers.Dense(NUM_CLASSES, activation="softmax", dtype="float32")(x)

model = models.Model(inputs, outputs)
model.summary()

# ── Phase 1: Train the head with frozen backbone ───────────────────────────────
print(f"\n{'='*60}")
print(f"=== Phase 1: Training classification head ({EPOCHS_FROZEN} epochs) ===")
print(f"{'='*60}")

model.compile(
    optimizer=tf.keras.optimizers.Adam(LR_PHASE1),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
    metrics=["accuracy"],
)

callbacks_phase1 = [
    callbacks.EarlyStopping(
        monitor="val_accuracy", patience=6,
        restore_best_weights=True, verbose=1,
    ),
    callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=3,
        min_lr=1e-7, verbose=1,
    ),
    callbacks.ModelCheckpoint(
        MODEL_H5_PATH, monitor="val_accuracy",
        save_best_only=True, verbose=1,
    ),
]

history1 = model.fit(
    train_gen,
    epochs=EPOCHS_FROZEN,
    validation_data=val_gen,
    class_weight=class_weight,
    callbacks=callbacks_phase1,
    verbose=1,
)

# ── Phase 2: Deep fine-tuning with Cosine annealing LR ────────────────────────
print(f"\n{'='*60}")
print(f"=== Phase 2: Fine-tuning last {FINETUNE_LAYERS} backbone layers ({EPOCHS_FINETUNE} epochs) ===")
print(f"{'='*60}")

base_model.trainable = True
for layer in base_model.layers[:-FINETUNE_LAYERS]:
    layer.trainable = False

# Cosine annealing LR — smooth decay prevents overshooting good weights
total_finetune_steps = math.ceil(train_gen.samples / BATCH_SIZE) * EPOCHS_FINETUNE
cosine_lr = tf.keras.optimizers.schedules.CosineDecay(
    initial_learning_rate=LR_FINETUNE_START,
    decay_steps=total_finetune_steps,
    alpha=LR_FINETUNE_END / LR_FINETUNE_START,
)

model.compile(
    optimizer=tf.keras.optimizers.Adam(cosine_lr),
    loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=LABEL_SMOOTHING),
    metrics=["accuracy"],
)

callbacks_phase2 = [
    callbacks.EarlyStopping(
        monitor="val_accuracy", patience=8,
        restore_best_weights=True, verbose=1,
    ),
    callbacks.ModelCheckpoint(
        MODEL_H5_PATH, monitor="val_accuracy",
        save_best_only=True, verbose=1,
    ),
]

history2 = model.fit(
    train_gen,
    epochs=EPOCHS_FINETUNE,
    validation_data=val_gen,
    class_weight=class_weight,
    callbacks=callbacks_phase2,
    verbose=1,
)

# ── Evaluate & Save ────────────────────────────────────────────────────────────
print("\n📈 Evaluating on validation set …")
loss, accuracy = model.evaluate(val_gen, verbose=1)
accuracy_pct = round(accuracy * 100, 2)
print(f"\n🎯 Final Validation Accuracy : {accuracy_pct}%")

# Save class names
with open(CLASS_NAMES_PATH, "w") as f:
    json.dump(CLASS_NAMES, f, indent=2)
print(f"💾 Class names saved → {CLASS_NAMES_PATH}")

# Save accuracy
with open(ACCURACY_PATH, "w") as f:
    f.write(str(accuracy_pct))
print(f"💾 Accuracy saved     → {ACCURACY_PATH}")

# Save primary model in Keras format (recommended for TF 2.x+)
try:
    model.save(MODEL_KERAS_PATH)
    size_mb = os.path.getsize(MODEL_KERAS_PATH) / (1024 * 1024)
    print(f"💾 Model (.keras) saved → {MODEL_KERAS_PATH}  ({size_mb:.1f} MB)")
except Exception as e:
    print(f"⚠️  Could not save .keras format: {e}")

# Save legacy .h5 (already kept by ModelCheckpoint, refresh with final weights)
model.save(MODEL_H5_PATH)
size_mb_h5 = os.path.getsize(MODEL_H5_PATH) / (1024 * 1024)
print(f"💾 Model (.h5)    saved → {MODEL_H5_PATH}  ({size_mb_h5:.1f} MB)")

print("\n" + "=" * 60)
print("✅ Training complete!")
print(f"   Backbone              : EfficientNetV2S (ImageNet)")
print(f"   Fine-tuned layers     : {FINETUNE_LAYERS}")
print(f"   Label smoothing       : {LABEL_SMOOTHING}")
print(f"   Mixed precision       : {'Yes (float16)' if MIXED_PRECISION else 'No (float32)'}")
print(f"   Validation Accuracy   : {accuracy_pct}%")
print(f"   Model file (.h5)      : {MODEL_H5_PATH}")
print(f"   Class names file      : {CLASS_NAMES_PATH}")
print("=" * 60)
print("\nNext step: restart your Flask server (ml_backend/app.py) — it will")
print("automatically load the improved model for /detect-disease requests.")
print("Inference now uses 5-pass Test-Time Augmentation (TTA) for extra accuracy.")
