<div align="center">

```
                              ██████╗ ██╗  ██╗██╗███████╗██╗  ██╗██╗  ██╗
                              ██╔══██╗██║  ██║██║██╔════╝██║  ██║╚██╗██╔╝
                              ██████╔╝███████║██║███████╗███████║ ╚███╔╝ 
                              ██╔═══╝ ██╔══██║██║╚════██║██╔══██║ ██╔██╗  
                              ██║     ██║  ██║██║███████║██║  ██║██╔╝ ██╗
                              ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
```

### AI-Powered Phishing Detection — Because the internet should be safe.

<br/>

[![Python](https://img.shields.io/badge/Python-3.10+-3b82f6?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-4ade80?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-3b82f6?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-RandomForest-4ade80?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![Vite](https://img.shields.io/badge/Vite-7.x-3b82f6?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-4ade80?style=for-the-badge)](LICENSE)

<br/>

> **Drop a link. We dissect it. The AI decides. Instant verdict.**
> 
> PhishX is a full-stack cybersecurity platform that uses a trained Random Forest model to analyze the structural "DNA" of any URL — delivering a real-time phishing probability score wrapped in a stunning, glassmorphism UI.

<br/>

---

</div>

## ⚡ Table of Contents

- [Overview](#-overview)
- [Live Demo Walkthrough](#-live-demo-walkthrough)
- [Tech Stack](#-tech-stack)
- [Architecture](#️-architecture)
- [Feature Extraction Engine](#-feature-extraction-engine)
- [ML Model](#-ml-model--random-forest)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Frontend Components](#-frontend-components)
- [UI Design System](#-ui-design-system)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 🔍 Overview

PhishX is not another blocklist checker. It doesn't rely on a database of known bad URLs — it **understands** the anatomy of a URL using machine learning.

Every URL has tell-tale signals: how long is it? Does it hide behind an IP address? Does it use `@` symbols to obfuscate the real destination? Are there excessive hyphens suggesting a spoofed domain? PhishX's backend extracts all of these signals in milliseconds and passes them through a trained Random Forest classifier to produce a precise **Risk Score (0–100%)**.

```
Input URL ──▶ Feature Extraction ──▶ Random Forest Model ──▶ Risk Score + Verdict
               (7 signal vectors)      (Scikit-learn)         (JSON Response)
```

The result is displayed in a beautifully animated React dashboard with live risk bars, scan history, and threat statistics — all wrapped in a dark glassmorphism aesthetic powered by WebGL (OGL), Framer Motion, and GSAP.

---

## 🎬 Live Demo Walkthrough

```
1. ╔══════════════════════╗
   ║  LANDING PAGE        ║  → Click past the interactive WebGL Orb
   ╚══════════════════════╝

2. ╔══════════════════════╗
   ║  DASHBOARD           ║  → Live threat stats, animated background
   ╚══════════════════════╝

3. ╔══════════════════════╗
   ║  SCAN ENGINE         ║  → Paste URL → Hit "Scan Now"
   ╚══════════════════════╝

4. ╔══════════════════════╗
   ║  VERDICT             ║  → ✅ Safe  or  🚨 High Risk URL
   ║                      ║     with animated risk bar + score %
   ╚══════════════════════╝

5. ╔══════════════════════╗
   ║  HISTORY TABLE       ║  → All scans logged in-session
   ╚══════════════════════╝
```

---

## 🧠 Tech Stack

### Backend & Machine Learning

| Technology | Purpose | Why We Chose It |
|---|---|---|
| **Python 3.10+** | Core backend language | Performance + rich ML ecosystem |
| **FastAPI** | REST API framework | Async, blazing-fast, auto-docs |
| **Scikit-learn** | ML model (Random Forest) | Battle-tested, interpretable |
| **Joblib** | Model serialization | Efficient `.pkl` save/load |
| **Pandas** | Dataset manipulation | Clean CSV ingestion + labeling |
| **Uvicorn** | ASGI server | Production-grade async server |

### Frontend

| Technology | Purpose | Why We Chose It |
|---|---|---|
| **React 19** | Component-driven UI | Fastest modern UI framework |
| **Vite 7** | Build tool & dev server | Instant HMR, lightning builds |
| **Framer Motion** | Page transitions & animations | Declarative, fluid, production-ready |
| **GSAP + InertiaPlugin** | Dot grid physics | Unmatched animation control |
| **OGL (WebGL)** | 3D Orb on landing page | Lightweight WebGL abstraction |
| **Axios** | HTTP client | Promise-based API calls |
| **React Icons** | Icon library | Consistent, tree-shakeable icons |
| **React Router DOM** | Client-side routing | Modern v7 data routing |
| **Tailwind CSS** | Utility-first styling | Rapid, consistent design tokens |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHISHX SYSTEM                            │
│                                                                 │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │   FRONTEND   │         │            BACKEND               │  │
│  │  React + Vite│         │          FastAPI (Python)        │  │
│  │              │  HTTP   │                                  │  │
│  │  Landing  ───┼────────▶│  POST /predict                   │  │
│  │  Dashboard   │  POST   │    │                             │  │
│  │  ScanPanel   │◀────────┼────│  feature_extractor.py       │  │
│  │  AuthModal   │  JSON   │    │    └─▶ 7 feature vectors    │  │
│  │  Background  │         │    │                             │  │
│  │  ElectricBdr │         │    ▼                             │  │
│  │  DotGrid     │         │  phishing_model.pkl              │  │
│  └──────────────┘         │  (RandomForestClassifier)        │  │
│                           │    │                             │  │
│                           │    └─▶ { prediction, risk_score }│  │
│                           └──────────────────────────────────┘  │
│                                         ▲                       │
│                           ┌─────────────┴───────────┐          │
│                           │    ML TRAINING PIPELINE  │          │
│                           │   dataset.csv            │          │
│                           │   train_model.py         │          │
│                           │   → phishing_model.pkl   │          │
│                           └─────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
Browser                    FastAPI                    ML Model
  │                           │                           │
  │── POST /predict ─────────▶│                           │
  │   { url: "..." }          │── extract_features(url) ──│
  │                           │   [len, dots, hyphens,    │
  │                           │    @, digits, https, ip]  │
  │                           │                           │
  │                           │── model.predict() ───────▶│
  │                           │                           │── RandomForest
  │                           │◀─ [0 or 1, probability] ──│   (n_estimators
  │                           │                               decision trees)
  │◀── JSON response ─────────│
  │   {                       │
  │     url: "...",           │
  │     prediction: "Phishing"│
  │     risk_score: 94.2      │
  │   }                       │
```

---

## 🔬 Feature Extraction Engine

The heart of PhishX. Located in `backend/feature_extractor.py`, it transforms any raw URL string into a 7-dimensional numerical vector:

```python
def extract_features(url) -> list[int | float]:
    ...
```

| # | Feature | Type | Signal Explained |
|---|---|---|---|
| 1 | **URL Length** | `int` | Phishing URLs are often very long to hide the real domain |
| 2 | **Dot Count** | `int` | Excessive subdomain nesting (e.g., `a.b.c.d.evil.com`) |
| 3 | **Hyphen Count** | `int` | Spoofing via `secure-login-bank.com` patterns |
| 4 | **@ Symbol Count** | `int` | `user@evil.com` tricks — browser ignores everything before `@` |
| 5 | **Digit Count** | `int` | Random number sequences signal auto-generated phishing domains |
| 6 | **HTTPS Flag** | `0/1` | HTTP-only sites may lack proper certification |
| 7 | **IP Address Flag** | `0/1` | Direct IP routing (`http://192.168.x.x/`) bypasses DNS trust |

---

## 🤖 ML Model — Random Forest

**Algorithm:** `sklearn.ensemble.RandomForestClassifier`

The model is trained on a labeled CSV dataset (`dataset.csv`) where URLs are tagged as either `benign` or `phishing/defacement`.

```python
# Label encoding
"benign"              → 0  (Safe)
"phishing"            → 1  (Threat)
"defacement"          → 1  (Threat)
```

### Training Pipeline

```
dataset.csv
    │
    ├─▶ pd.read_csv()
    │
    ├─▶ Label encoding (benign=0, else=1)
    │
    ├─▶ Feature extraction for each URL → X matrix
    │
    ├─▶ train_test_split(test_size=0.2, random_state=42)
    │
    ├─▶ RandomForestClassifier().fit(X_train, y_train)
    │
    └─▶ joblib.dump(model, "phishing_model.pkl")
```

### Prediction Output

```json
{
  "url": "http://secure-paypal-update.xyz/login",
  "prediction": "Phishing",
  "risk_score": 91.40
}
```

`risk_score` is `predict_proba()[1] × 100` — the model's confidence that the URL is malicious.

---

## 📁 Project Structure

```
phishx/
│
├── backend/
│   ├── main.py                  # FastAPI app — CORS + /predict endpoint
│   └── feature_extractor.py     # 7-feature URL parser
│
├── model/
│   ├── train_model.py           # ML training script
│   └── phishing_model.pkl       # ⚠️ Generated after training (gitignored)
│
├── frontend/
│   └── index.html               # Standalone vanilla HTML version (v0)
│
├── phishx-frontend/             # Full React + Vite application
│   ├── public/
│   │   ├── logo.png             # PhishX full logo
│   │   ├── logo-icon.png        # Navbar icon
│   │   └── brand-text.png       # Navbar brand text
│   │
│   ├── src/
│   │   ├── App.jsx              # Root — Landing ↔ Dashboard state machine
│   │   ├── main.jsx             # React DOM entry point
│   │   ├── index.css            # Global resets & base styles
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # WebGL Orb entry screen
│   │   │   ├── Dashboard.jsx    # Main app shell + nav + sections
│   │   │   └── Dashboard.css
│   │   │
│   │   └── components/
│   │       ├── Background.jsx   # Mounts DotGrid as fixed BG layer
│   │       ├── DotGrid.jsx      # GSAP-powered canvas dot physics grid
│   │       ├── DotGrid.css
│   │       ├── Orb.jsx          # OGL/WebGL 3D animated shader orb
│   │       ├── Orb.css
│   │       ├── ElectricBorder.jsx  # Canvas-drawn animated border effect
│   │       ├── ElectricBorder.css
│   │       ├── ScanPanel.jsx    # URL input + scan logic + result display
│   │       ├── ScanPanel.css
│   │       ├── AuthModal.jsx    # React Portal login/signup modal
│   │       └── AuthModal.css
│   │
│   ├── vite.config.js
│   ├── package.json
│   └── eslint.config.js
│
├── dataset.csv                  # ⚠️ Training data (gitignored)
├── requirements.txt
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

```bash
node --version    # >= 20.19.0
python --version  # >= 3.10
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourusername/phishx.git
cd phishx
```

### Step 2 — Backend Setup & Model Training

```bash
# Create and activate a virtual environment
python -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Train the ML model (requires dataset.csv in project root)
cd model
python train_model.py
# Output: "Model trained and saved successfully."
cd ..

# Start the FastAPI backend server
uvicorn backend.main:app --reload
# Server running at: http://127.0.0.1:8000
```

> ✅ Backend is live. Visit `http://127.0.0.1:8000/docs` for the auto-generated Swagger UI.

### Step 3 — Frontend Setup

```bash
# Open a new terminal window
cd phishx-frontend

# Install Node dependencies
npm install

# Start the Vite dev server
npm run dev
# App running at: http://localhost:5173
```

### Step 4 — Open the App

Navigate to `http://localhost:5173`, click past the animated orb, and start scanning URLs.

---

## 📡 API Reference

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "message": "PhishX backend is running"
}
```

---

### `POST /predict`

Analyzes a URL and returns a phishing prediction with risk score.

**Request Body:**
```json
{
  "url": "https://example.com/login"
}
```

**Response:**
```json
{
  "url": "https://example.com/login",
  "prediction": "Safe",
  "risk_score": 8.45
}
```

| Field | Type | Description |
|---|---|---|
| `url` | `string` | The original URL that was submitted |
| `prediction` | `"Safe"` \| `"Phishing"` | Model classification output |
| `risk_score` | `float` | Probability of phishing (0.0 – 100.0) |

**Example — cURL:**
```bash
curl -X POST "http://127.0.0.1:8000/predict" \
     -H "Content-Type: application/json" \
     -d '{"url": "http://paypal-secure-login.xyz/verify"}'
```

**Example — JavaScript/Axios:**
```javascript
const response = await axios.post("http://127.0.0.1:8000/predict", {
  url: "https://github.com"
});
console.log(response.data.risk_score); // e.g., 3.12
```

---

## 🧩 Frontend Components

### `<Landing />` — Entry Screen

The cinematic first impression. Renders a fullscreen `<Orb />` WebGL shader with a pulsing "CLICK TO CONTINUE" prompt. Clicking transitions to the dashboard via Framer Motion's `AnimatePresence`.

---

### `<Orb />` — WebGL Shader Orb

Built with OGL (a lightweight WebGL library). Runs a custom GLSL fragment shader producing an organic, fluid animated sphere with green/blue color gradients that responds to mouse hover via inertia rotation.

```
Key GLSL features:
  • 3D Simplex Noise (snoise3) for organic fluid motion
  • Dynamic color mixing (green ↔ blue gradient)
  • Hover-triggered rotation via uniform interpolation
  • Anti-aliased ring generation with noise wobble
```

---

### `<DotGrid />` — Physics Dot Background

A `<canvas>` element filled with a grid of dots. Powered by GSAP's `InertiaPlugin` for realistic physics. Features:

- **Proximity color shift** — dots near the cursor blend from base to active color
- **Velocity-triggered displacement** — fast mouse movement physically flings nearby dots
- **Click shockwave** — clicking sends a radial shockwave through the grid
- **Elastic return** — displaced dots spring back with `elastic.out` easing

---

### `<ElectricBorder />` — Animated Canvas Border

A `<canvas>` element positioned around its child content. Uses layered Perlin noise (`octavedNoise`) to displace points along a rounded-rectangle path frame-by-frame, creating a living, electric lightning border effect. Color adapts to scan state (green = normal, red = invalid input).

---

### `<ScanPanel />` — Core Scan Interface

The main feature component. Handles:

- Input validation (regex + structure check for `.` or `:`)
- POST request to `/predict` via Axios
- Fallback simulation if backend is unreachable
- Animated result card with `<motion.div>` entrance
- Animated risk bar via `width: risk_score%` Framer Motion transition
- Scan history callback to parent `Dashboard`

---

### `<AuthModal />` — React Portal Login

Uses `ReactDOM.createPortal()` to render directly onto `document.body`, ensuring it layers above all other elements regardless of stacking context. Features real-time password strength validation with a 4-rule checklist (length, uppercase, number, symbol).

---

## 🎨 UI Design System

PhishX uses a custom dark glassmorphism design language.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-dark` | `#0f172a` | Page background base |
| `--card-dark` | `rgba(15,20,40,0.6)` | Glass panel background |
| `--brand-blue` | `#3b82f6` | Primary accent, gradients |
| `--brand-green` | `#4ade80` | Secondary accent, safe state |
| `--danger` | `#ef4444` | Phishing/error state |
| `--text-muted` | `#94a3b8` | Subdued labels and descriptions |
| `--border` | `rgba(255,255,255,0.1)` | Glass panel borders |

### Typography

```css
font-family: 'Segoe UI', system-ui, sans-serif;
```

Gradient headings use `-webkit-background-clip: text` with the blue → green gradient for the primary brand aesthetic.

### Glass Morphism Recipe

```css
.glass-panel {
  background: rgba(15, 20, 40, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 🗺️ Roadmap

| Status | Feature |
|---|---|
| ✅ | Random Forest ML backend |
| ✅ | FastAPI REST endpoint |
| ✅ | React 19 + Vite frontend |
| ✅ | WebGL Orb landing page |
| ✅ | GSAP dot grid background |
| ✅ | Electric border animation |
| ✅ | Animated risk score bar |
| ✅ | Auth modal with portal rendering |
| ✅ | In-session scan history |
| 🔄 | Persistent scan history (database) |
| 🔄 | User authentication (JWT/OAuth) |
| 🔄 | Extended feature set (WHOIS, SSL, entropy) |
| 🔄 | Chrome Extension for passive scanning |
| 🔄 | Bulk URL batch analysis |
| 🔄 | Threat dashboard analytics |
| 🔄 | REST API rate limiting |
| 🔄 | Docker containerization |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

```bash
# Fork the repo and create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Push and open a Pull Request
git push origin feature/your-feature-name
```

Please follow conventional commit messages:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation update
- `style:` — UI/CSS change
- `ml:` — model or feature extractor change

---

## 👨‍💻 Author

<div align="center">

**Udit Pandya**
B.Tech Computer Science Engineering

*"Built at the intersection of Machine Learning, web security, and modern frontend design."*

[![GitHub](https://img.shields.io/badge/GitHub-uditpandya07-3b82f6?style=for-the-badge&logo=github)](https://github.com/uditpandya07)

</div>

---

<div align="center">

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Built with ❤️ | Python · FastAPI · React       │
│   Random Forest · WebGL · GSAP · Framer Motion  │
│                                                 │
│         © 2025 PhishX · Udit Pandya             │
│                                                 │
└─────────────────────────────────────────────────┘
```

*Star ⭐ this repo if PhishX helped you understand ML-powered security tools!*

</div>