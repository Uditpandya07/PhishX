import pandas as pd
import joblib
import sys
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Ensure the backend folder is accessible for feature extraction
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.app.services.feature_extractor import extract_features

print("Booting High-Accuracy PhishX Training...")

print("1. Loading dataset...")
# Load your Kaggle file
csv_path = os.path.join(os.path.dirname(__file__), "phishing_site_urls.csv")
df = pd.read_csv(csv_path)
df = df.dropna(subset=['URL', 'Label'])

# Standardize labels: 'bad' -> 1, 'good' -> 0
df['target'] = df['Label'].apply(lambda x: 1 if str(x).strip().lower() == 'bad' else 0)

# --- 🎯 THE BALANCE FIX ---
# Separate the classes
df_phish = df[df['target'] == 1].drop_duplicates(subset=['URL'])
df_safe = df[df['target'] == 0].drop_duplicates(subset=['URL'])

print(f"   - Unique Malicious URLs found: {len(df_phish)}")
print(f"   - Unique Safe URLs found: {len(df_safe)}")

# We will use ALL malicious URLs and match that number with Safe URLs for a 50/50 split
sample_size = min(len(df_phish), 50000) # Cap at 50k for speed, or remove cap for max accuracy
df_phish_final = df_phish.sample(n=sample_size, random_state=42)
df_safe_final = df_safe.sample(n=sample_size, random_state=42)

df_final = pd.concat([df_phish_final, df_safe_final], ignore_index=True)
print(f"2. Training on {len(df_final)} balanced samples (50% Phishing / 50% Safe)")

print("3. Extracting Features... (This may take a few minutes)")
X = df_final["URL"].apply(extract_features).tolist()
y = df_final["target"].tolist()

print("4. Training the Enhanced Random Forest...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# Using more estimators and deeper trees for better detection
model = RandomForestClassifier(n_estimators=150, max_depth=25, n_jobs=-1, random_state=42)
model.fit(X_train, y_train)

# Calculate Accuracy for your peace of mind
accuracy = model.score(X_test, y_test)
print(f"Training Accuracy: {accuracy * 100:.2f}%")

joblib.dump(model, os.path.join(os.path.dirname(__file__), "phishing_model.pkl"))
print("High-Accuracy Model saved successfully.")