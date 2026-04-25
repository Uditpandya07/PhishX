import hashlib
import os

model_path = os.path.join('model', 'phishing_model.pkl')
if os.path.exists(model_path):
    with open(model_path, 'rb') as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()
    with open('model_hash.txt', 'w') as f:
        f.write(file_hash)
    print(f"Hash generated: {file_hash}")
else:
    print("Model file not found!")
