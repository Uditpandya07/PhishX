"""
PhishX Compact Model Trainer
Trains a smaller but accurate model that stays under 50MB so it can be
committed directly to GitHub without Git LFS, allowing Render to
download it during deployment.

Target: ~30-50MB with joblib compress=9
Accuracy target: >92% (vs 200-tree model's ~94%)
"""
import pandas as pd
import joblib
import sys
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

# Ensure the backend folder is accessible for feature extraction
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.app.services.feature_extractor import extract_features

print("PhishX Compact Model Training (v4 - Render-Compatible)")

print("1. Loading dataset...")
csv_path = os.path.join(os.path.dirname(__file__), "phishing_site_urls.csv")
df = pd.read_csv(csv_path)
df = df.dropna(subset=['URL', 'Label'])

df['target'] = df['Label'].apply(lambda x: 1 if str(x).strip().lower() == 'bad' else 0)

# Balance classes
df_phish = df[df['target'] == 1].drop_duplicates(subset=['URL'])
df_safe  = df[df['target'] == 0].drop_duplicates(subset=['URL'])

print(f"   - Unique Malicious: {len(df_phish)}")
print(f"   - Unique Safe: {len(df_safe)}")

# Use 60k samples each (enough for high accuracy, fewer than 100k for speed)
sample_size = min(len(df_phish), len(df_safe), 60000)
df_final = pd.concat([
    df_phish.sample(n=sample_size, random_state=42),
    df_safe.sample(n=sample_size, random_state=42)
], ignore_index=True)

print(f"2. Training on {len(df_final)} balanced samples")

print("3. Extracting features...")
X = df_final["URL"].apply(extract_features).tolist()
y = df_final["target"].tolist()

print("4. Training compact Random Forest (50 trees, depth 20)...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.1, random_state=42)

# 50 trees (vs 200) + depth 20 (vs 35) = ~8x smaller model, ~93%+ accuracy
model = RandomForestClassifier(
    n_estimators=50,
    max_depth=20,
    min_samples_leaf=5,   # prevents overfitting, helps compression
    n_jobs=-1,
    random_state=42
)
model.fit(X_train, y_train)

accuracy = model.score(X_test, y_test)
print(f"   Accuracy: {accuracy * 100:.2f}%")

out_path = os.path.join(os.path.dirname(__file__), "phishing_model.pkl")
# compress=9 = maximum compression (slower save, much smaller file)
joblib.dump(model, out_path, compress=9)

size_mb = os.path.getsize(out_path) / (1024 * 1024)
print(f"5. Saved to {out_path}")
print(f"   File size: {size_mb:.1f} MB")

if size_mb < 90:
    print("SUCCESS: Model is under 90MB - safe to commit without Git LFS!")
else:
    print(f"WARNING: Model is {size_mb:.1f}MB - may need further reduction")
