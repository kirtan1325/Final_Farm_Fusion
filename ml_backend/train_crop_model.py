import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.metrics import accuracy_score

def get_crop_category(crop):
    c = crop.lower()
    if any(k in c for k in ["rice", "wheat", "maize", "jowar", "bajra", "ragi", "millet"]):
        return "Grains"
    elif any(k in c for k in ["gram", "arhar", "tur", "pulse", "pea"]):
        return "Pulses"
    elif any(k in c for k in ["mustard", "rapeseed", "groundnut", "sesamum", "linseed", "castor", "niger", "sunflower"]):
        return "Oilseeds"
    elif any(k in c for k in ["chilli", "turmeric", "ginger", "garlic", "coriander", "pepper", "cardamom"]):
        return "Spices"
    elif any(k in c for k in ["potato", "onion", "tapioca", "vegetable"]):
        return "Vegetables"
    elif any(k in c for k in ["cotton", "jute", "mesta"]):
        return "Fiber"
    else:
        return "Commercial"

def train_and_save_model():
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "crop_yield.csv"))
    if not os.path.exists(dataset_path):
        dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "crop_yield.csv"))
    
    print(f"Loading dataset from: {dataset_path}")
    df = pd.read_csv(dataset_path)

    # Clean string columns
    for col in ["Crop", "Season", "State"]:
        if col in df.columns:
            df[col] = df[col].astype(str).str.strip()

    df = df.dropna().reset_index(drop=True)
    print(f"Cleaned dataset shape: {df.shape}")

    # Feature Engineering
    df["Fertilizer_per_Area"] = df["Fertilizer"] / (df["Area"] + 1e-5)
    df["Pesticide_per_Area"] = df["Pesticide"] / (df["Area"] + 1e-5)
    df["Production_per_Area"] = df["Production"] / (df["Area"] + 1e-5)
    df["Yield_Ratio"] = df["Yield"]
    df["Log_Area"] = np.log1p(df["Area"])
    df["Log_Rainfall"] = np.log1p(df["Annual_Rainfall"])
    df["Log_Fertilizer"] = np.log1p(df["Fertilizer"])
    df["Log_Pesticide"] = np.log1p(df["Pesticide"])
    df["State_Season"] = df["State"] + "_" + df["Season"]
    df["Category"] = df["Crop"].apply(get_crop_category)

    state_freq = df["State"].value_counts(normalize=True).to_dict()
    df["State_Freq"] = df["State"].map(state_freq)

    season_freq = df["Season"].value_counts(normalize=True).to_dict()
    df["Season_Freq"] = df["Season"].map(season_freq)

    # Encoders
    state_encoder = LabelEncoder()
    season_encoder = LabelEncoder()
    state_season_encoder = LabelEncoder()
    category_encoder = LabelEncoder()
    crop_encoder = LabelEncoder()

    df["State_Enc"] = state_encoder.fit_transform(df["State"])
    df["Season_Enc"] = season_encoder.fit_transform(df["Season"])
    df["State_Season_Enc"] = state_season_encoder.fit_transform(df["State_Season"])
    df["Category_Enc"] = category_encoder.fit_transform(df["Category"])

    y = crop_encoder.fit_transform(df["Crop"])

    feature_cols = [
        "State_Enc", "Season_Enc", "State_Season_Enc", "Category_Enc",
        "Annual_Rainfall", "Fertilizer", "Pesticide", "Area", "Yield",
        "Fertilizer_per_Area", "Pesticide_per_Area", "Production_per_Area",
        "Log_Area", "Log_Rainfall", "Log_Fertilizer", "Log_Pesticide",
        "State_Freq", "Season_Freq"
    ]

    X = df[feature_cols]
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set size: {X_train.shape[0]}, Test set size: {X_test.shape[0]}")

    # Compact & High Accuracy HistGradientBoosting (file size ~3MB)
    model = HistGradientBoostingClassifier(
        max_iter=150,
        learning_rate=0.1,
        max_depth=15,
        random_state=42
    )
    model.fit(X_train, y_train)

    accuracy = accuracy_score(y_test, model.predict(X_test))
    print(f"High-Accuracy Compact Model Test Score: {accuracy * 100:.2f}%")

    crop_info_map = {
        "Rice": {"fert": "Urea (100 kg/ha), DAP (50 kg/ha), MOP (40 kg/ha)", "irrig": "Continuous shallow flooding (3-5 cm)"},
        "Wheat": {"fert": "NPK 120:60:40 kg/ha + Zinc Sulphate", "irrig": "4-6 irrigations at Critical Crown Root Stage"},
        "Maize": {"fert": "NPK 120:60:50 kg/ha + Neem coated Urea", "irrig": "Every 8-10 days during tasseling & silking"},
        "Cotton(lint)": {"fert": "NPK 100:50:50 kg/ha + Magnesium", "irrig": "Alternate furrow irrigation every 12-15 days"},
        "Sugarcane": {"fert": "NPK 250:115:115 kg/ha + Organic compost", "irrig": "Every 10-12 days (Drip irrigation recommended)"},
        "Potato": {"fert": "NPK 180:80:100 kg/ha + Farmyard Manure", "irrig": "Every 5-7 days depending on soil moisture"},
        "Onion": {"fert": "NPK 100:50:50 kg/ha + Sulphur 20 kg/ha", "irrig": "Light irrigation every 7 days"},
        "Arhar/Tur": {"fert": "NPK 20:50:20 kg/ha + Rhizobium inoculation", "irrig": "2 irrigations at flower initiation & pod filling"},
        "Gram": {"fert": "NPK 20:40:20 kg/ha + Phosphobakteria", "irrig": "1-2 light irrigations at pre-flowering stage"},
        "Groundnut": {"fert": "NPK 25:50:35 kg/ha + Gypsum 400 kg/ha", "irrig": "Critical watering at pegging & pod formation"},
        "Soybean": {"fert": "NPK 30:60:40 kg/ha + Sulphur", "irrig": "Irrigate at flowering & pod filling stage"},
        "Bajra": {"fert": "NPK 80:40:40 kg/ha", "irrig": "Rainfed / 1-2 supplemental irrigations"},
        "Jowar": {"fert": "NPK 80:40:40 kg/ha", "irrig": "Rainfed / Irrigation at boot & grain filling stage"},
        "Dry chillies": {"fert": "NPK 120:60:60 kg/ha", "irrig": "Frequent light watering every 5-6 days"},
        "Rapeseed &Mustard": {"fert": "NPK 80:40:40 kg/ha + Sulphur 40 kg/ha", "irrig": "2 irrigations at flowering & siliqua stage"},
    }

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "crop_recommendation_model.pkl")
    encoders_path = os.path.join(models_dir, "crop_encoders.pkl")

    artifacts = {
        "model": model,
        "scaler": scaler,
        "feature_cols": feature_cols,
        "accuracy": round(accuracy * 100, 2)
    }

    encoders = {
        "state_encoder": state_encoder,
        "season_encoder": season_encoder,
        "state_season_encoder": state_season_encoder,
        "category_encoder": category_encoder,
        "crop_encoder": crop_encoder,
        "state_freq": state_freq,
        "season_freq": season_freq,
        "crop_info_map": crop_info_map,
        "state_classes": list(state_encoder.classes_),
        "season_classes": list(season_encoder.classes_),
        "crop_classes": list(crop_encoder.classes_)
    }

    # Save lightweight compressed models
    with open(model_path, "wb") as f:
        pickle.dump(artifacts, f, protocol=pickle.HIGHEST_PROTOCOL)

    with open(encoders_path, "wb") as f:
        pickle.dump(encoders, f, protocol=pickle.HIGHEST_PROTOCOL)

    size_mb = os.path.getsize(model_path) / (1024 * 1024)
    print(f"Compact Model saved to: {model_path} (Size: {size_mb:.2f} MB)")
    print(f"Encoders saved to: {encoders_path}")

if __name__ == "__main__":
    train_and_save_model()
