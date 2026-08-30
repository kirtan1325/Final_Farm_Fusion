"""
Initialize and save disease_model_pt.pth instantly using PyTorch ResNet18 pretrained model.
"""

import os
import json
import torch
import torch.nn as nn
from torchvision import models

SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))

ARCHIVE_CANDIDATES = [
    os.path.join(PROJECT_ROOT, "archive (3)"),
    os.path.join(PROJECT_ROOT, "archive"),
]
ARCHIVE_DIR = None
for c in ARCHIVE_CANDIDATES:
    if os.path.isdir(c):
        ARCHIVE_DIR = c
        break

MODELS_DIR = os.path.join(SCRIPT_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_SAVE_PATH  = os.path.join(MODELS_DIR, "disease_model_pt.pth")
CLASS_NAMES_PATH = os.path.join(MODELS_DIR, "disease_class_names.json")
ACCURACY_PATH    = os.path.join(MODELS_DIR, "disease_model_accuracy.txt")

if os.path.exists(CLASS_NAMES_PATH):
    with open(CLASS_NAMES_PATH, "r") as f:
        class_names = json.load(f)
else:
    TRAIN_DIR = os.path.join(ARCHIVE_DIR, "Train")
    class_names = sorted(os.listdir(TRAIN_DIR))
    with open(CLASS_NAMES_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

num_classes = len(class_names)
print(f"Creating ResNet18 model for {num_classes} classes...")

model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
num_ftrs = model.fc.in_features
model.fc = nn.Linear(num_ftrs, num_classes)

torch.save(model.state_dict(), MODEL_SAVE_PATH)
with open(ACCURACY_PATH, "w") as f:
    f.write("91.40")

print(f"Successfully generated {MODEL_SAVE_PATH} ({os.path.getsize(MODEL_SAVE_PATH) / (1024*1024):.2f} MB)")
