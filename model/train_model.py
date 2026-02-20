import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import sys
import os

# Allow importing feature_extractor
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.feature_extractor import extract_features

# Load dataset
df = pd.read_csv("dataset.csv")

# Convert type column to numeric label
def convert_label(value):
    if value == "benign":
        return 0
    else:  # phishing or defacement
        return 1

df["label"] = df["type"].apply(convert_label)

X = []
y = df["label"]

for url in df["url"]:
    X.append(extract_features(url))

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save model
joblib.dump(model, "phishing_model.pkl")

print("Model trained and saved successfully.")