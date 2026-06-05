<div align="center">

  <a href="https://phishx.vercel.app" target="_blank">
    <img src="https://raw.githubusercontent.com/Uditpandya07/PhishX/main/phishx-frontend/public/logo.png" alt="PhishX Logo" width="200" style="margin-bottom: 20px;" />
  </a>
  
  # 🛡️ PhishX
  
  <!-- Animated Typing SVG -->
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00E676&center=true&vCenter=true&width=600&lines=Next-Generation+Threat+Detection;AI-Powered+Phishing+Analysis;Real-Time+URL+Scanning" alt="Typing SVG" />
  </a>

  <br/>

  [![Live Frontend](https://img.shields.io/badge/Live_App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://phishx.vercel.app)
  [![Live API](https://img.shields.io/badge/Live_API-00E676?style=for-the-badge&logo=fastapi&logoColor=black)](https://phishx-vqib.onrender.com/docs)
  [![Database](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

  PhishX is a sophisticated, full-stack cybersecurity SaaS designed to neutralize phishing threats in real-time. By combining advanced Machine Learning feature extraction with an ultra-fast API and a sleek browser extension, PhishX delivers enterprise-grade URL analysis wrapped in a stunning, modern interface.

  [**Live App**](https://phishx.vercel.app) • [**API Docs**](https://phishx-vqib.onrender.com/docs) • [**Deployment Guide**](DEPLOYMENT.md) • [**Development Journey**](JOURNEY.md)
  
</div>

---

## ✨ Core Features

*   🧠 **AI-Driven Threat Analysis:** Utilizes a custom ML model trained on extensive datasets (`model/phishing_site_urls.csv`) with advanced lexical feature extraction to identify zero-day phishing attempts.
*   ⚡ **High-Performance Backend:** Built on **FastAPI**, guaranteeing asynchronous, lightning-fast response times for core scanning, user authentication, and admin endpoints.
*   💳 **SaaS Ready:** Fully integrated payments and subscription management endpoints ready for enterprise scaling.
*   🎨 **Immersive UI/UX:** The frontend features a sleek, responsive design centered around a full-screen rectangular panel. For maximum user efficiency, the URL input field and scan button are perfectly parallel, ensuring a frictionless and focused scanning experience.
*   🌐 **Browser Extension:** Includes a custom browser extension for real-time, on-the-fly URL scanning directly from your browser toolbar.
*   🔐 **Secure Architecture:** Robust local JWT-based authentication, rate limiting, and Alembic-managed database migrations—ensuring no reliance on third-party auth providers.
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
├── phishx-frontend/          # React + Vite Frontend Application
├── .github/workflows/        # CI/CD Actions (ci.yml)
├── docker-compose.yml        # Development environment
└── docker-compose.prod.yml   # Production environment
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
   git clone https://github.com/Uditpandya07/PhishX.git
   cd PhishX
   ```

2. **Environment Setup:**
   Copy the example environment file and configure your credentials (DB, JWT secret, Email SMTP, etc.).
   ```bash
   cp .env.example .env
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

## 🔐 Security Standards

This repository adheres to industrial security standards:
- **No Hardcoded Secrets**: All keys, passwords, and sensitive information are excluded via `.gitignore` and handled through `.env` files.
- **Secure Authentication**: End-to-end local JWT authentication with secure HttpOnly cookies and bcrypt password hashing.
- **Rate Limiting**: Integrated API rate limiting to prevent abuse and brute-force attacks.
- **Automated Scanning**: Ready for integration with GitHub Advanced Security and CodeQL for continuous vulnerability scanning.

---

## 📖 Documentation

For detailed information on project systems, please refer to the specific markdown files included in the repository:
*   [**Deployment Guide**](DEPLOYMENT.md): Detailed instructions for pushing PhishX to production.
*   [**Rule Authoring**](RULE_AUTHORING.md) & [**Rule Precedence**](RULE_PRECEDENCE.md): Guidelines for the threat detection engine.
*   [**Development Journey**](JOURNEY.md): The history and architectural decisions behind PhishX.

---

<div align="center">
  <img src="https://raw.githubusercontent.com/Uditpandya07/PhishX/main/phishx-frontend/public/brand-text.png" alt="PhishX" width="150" />
  <p>Built with precision for maximum security. Defend the web with PhishX.</p>
</div>
