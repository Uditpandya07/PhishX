<div align="center">

  <!-- Animated Radar/Shield GIF - Gives a premium cybersecurity feel -->
  <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" alt="PhishX Shield" width="120" height="120" />
  
  # 🛡️ PhishX
  
  <!-- Animated Typing SVG -->
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=00E676&center=true&vCenter=true&width=600&lines=Next-Generation+Threat+Detection;AI-Powered+Phishing+Analysis;Real-Time+URL+Scanning" alt="Typing SVG" />
  </a>

  <br/>

  [![Live Demo](https://img.shields.io/badge/Website-Live-00E676?style=for-the-badge&logo=vercel&logoColor=white)](https://phishx-)
  [![Backend](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
  [![Database](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
  [![CI/CD](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](.github/workflows/ci.yml)

  PhishX is a sophisticated, full-stack cybersecurity SaaS designed to neutralize phishing threats in real-time. By combining advanced Machine Learning feature extraction with an ultra-fast API and a sleek browser extension, PhishX delivers enterprise-grade URL analysis wrapped in a stunning, modern interface.

  [**Live Demo**](https://phishx-) • [**Deployment Guide**](DEPLOYMENT.md) • [**Development Journey**](JOURNEY.md)
  
</div>

---

## ✨ Core Features

*   🧠 **AI-Driven Threat Analysis:** Utilizes a custom ML model trained on extensive datasets (`model/phishing_site_urls.csv`) with advanced lexical feature extraction to identify zero-day phishing attempts.
*   ⚡ **High-Performance Backend:** Built on **FastAPI**, guaranteeing asynchronous, lightning-fast response times for core scanning, user authentication, and admin endpoints.
*   💳 **SaaS Ready:** Fully integrated payments and subscription management endpoints ready for enterprise scaling.
*   🎨 **Immersive UI/UX:** The frontend features a sleek, responsive design centered around a full-screen rectangular panel. For maximum user efficiency, the URL input field and scan button are perfectly parallel, ensuring a frictionless and focused scanning experience.
*   🌐 **Browser Extension:** Includes a custom browser extension for real-time, on-the-fly URL scanning directly from your browser toolbar.
*   🔐 **Secure Architecture:** Robust JWT-based authentication, rate limiting, and Alembic-managed database migrations.
*   ☁️ **Production Ready:** Fully containerized with `docker-compose.prod.yml` and automated CI/CD pipelines via GitHub Actions.

---

## 📂 Project Architecture

A high-level overview of the PhishX ecosystem:

```text
PhishX/
├── backend/                  # FastAPI Application Core
│   ├── alembic/              # Database migration scripts
│   ├── app/
│   │   ├── api/v1/           # Endpoints: Auth, Scans, Admin, Payments, Users
│   │   ├── core/             # Security, Config, and Rate Limiting
│   │   ├── db/               # SQLAlchemy Models, Seeders, and Sessions
│   │   ├── schemas/          # Pydantic data validation schemas
│   │   └── services/         # Business logic: Feature Extractor, Whitelist
│   ├── tests/                # Pytest suite (API & Extractor tests)
│   └── Dockerfile            # Backend container configuration
├── browser-extension/        # Real-time Web Extension
│   ├── background.js         # Extension service worker
│   ├── popup.html / .js      # Extension UI
│   └── manifest.json         # Extension configuration
├── model/                    # ML Datasets
│   └── phishing_site_urls.csv
├── .github/workflows/        # CI/CD Actions (ci.yml)
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
└── RULE_AUTHORING.md         # Threat rule documentation
```

---

## 🚀 Getting Started

### Prerequisites
*   [Docker](https://www.docker.com/) & Docker Compose
*   Python 3.10+ (for local development)
*   Node.js (for frontend/extension work)

### 🐳 Quickstart (Docker)

The fastest way to run PhishX is via Docker Compose.

1. **Clone the repository:**
```bash
   git clone [https://github.com/YOUR_USERNAME/phishx.git](https://github.com/YOUR_USERNAME/phishx.git)
   cd phishx
   ```

2. **Environment Setup:**
   Copy the example environment file and configure your credentials (DB, JWT secret, Email SMTP, etc.).
```bash
   cp backend/.env.example backend/.env
   ```

3. **Spin up the environment:**
```bash
   docker-compose up -d --build
   ```
   *The API will be available at `http://localhost:8000`. Access the Swagger UI docs at `http://localhost:8000/docs`.*

### 🛠️ Local Development (Backend)

If you prefer to run the backend outside of Docker:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run Database Migrations
alembic upgrade head

# Seed the Database (Optional)
python app/db/seed.py

# Start the Server
uvicorn app.main:app --reload
```

### 🌐 Installing the Browser Extension

1. Open your Chromium-based browser and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked** and select the `browser-extension` folder from this repository.
4. The PhishX icon will appear in your toolbar, ready to analyze URLs!

---

## 📖 Documentation

For detailed information on project systems, please refer to the specific markdown files included in the repository:
*   [**Deployment Guide**](DEPLOYMENT.md): Detailed instructions for pushing PhishX to production.
*   [**Rule Authoring**](RULE_AUTHORING.md) & [**Rule Precedence**](RULE_PRECEDENCE.md): Guidelines for the threat detection engine.
*   [**Development Journey**](JOURNEY.md): The history and architectural decisions behind PhishX.

---

## 🧪 Testing

To run the automated test suite for the API and Machine Learning feature extractor:

```bash
cd backend
pytest tests/
```

---

<div align="center">
  <p>Built with precision for maximum security. Defend the web with PhishX.</p>
</div>
