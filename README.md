PhishX 🔐

AI-powered phishing URL detection web app.

PhishX is a full-stack machine learning project that analyzes URLs and predicts whether they are Safe or Phishing, along with a risk score percentage.

Built using:

FastAPI (Backend)

HTML/CSS/JS (Frontend)

Scikit-learn (Random Forest)

Python

💡 How It Works

When a user enters a URL:

The backend extracts key features (length, special characters, suspicious keywords, IP usage, etc.).

A trained ML model evaluates the URL.

The system returns:

✅ Safe

🚨 Phishing

Risk score (% probability)

The model is trained on a balanced phishing dataset with cleaned and normalized features.

📁 Project Structure
PhishX/
├── backend/
├── frontend/
├── model/
├── requirements.txt
└── README.md
▶️ Run Locally
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cd model
python train_model.py
uvicorn backend.main:app --reload
python -m http.server 5500

Open:

http://127.0.0.1:5500/frontend/index.html

Built by Udit Pandya
B.Tech CSE