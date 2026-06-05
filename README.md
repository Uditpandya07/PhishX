<div align="center">

  <a href="https://phishx-app.vercel.app/" target="_blank">
    <img src="https://raw.githubusercontent.com/Uditpandya07/PhishX/main/phishx-frontend/public/logo.png" alt="PhishX Logo" width="280" />
  </a>
  
  <br />
  <br />

  <!-- 3D Animated Shield/Cybersecurity Element -->
  <img src="https://cdn.dribbble.com/users/1162077/screenshots/4382009/media/32185c7cb13715e714659b6dcc2fbfdf.gif" alt="3D Cybersecurity Shield" width="200" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 230, 118, 0.4);" />

  <br />
  <br />

  <!-- High-grade typing animation matching the UI theme -->
  <a href="https://phishx-app.vercel.app/">
    <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=700&size=28&pause=1000&color=00E676&center=true&vCenter=true&width=800&lines=Next-Gen+Cybersecurity+SaaS;AI-Powered+Phishing+Neutralization;Real-Time+URL+Scanning+Engine" alt="Typing SVG" />
  </a>

  <p align="center">
    <b>Defending the web with cutting-edge Machine Learning and zero-latency architecture.</b>
  </p>

  <br/>

  <!-- Custom styled badges -->
  <a href="https://phishx-app.vercel.app/"><img src="https://img.shields.io/badge/Live_App-00E676?style=for-the-badge&logo=vercel&logoColor=black" alt="Live App" /></a>
  <a href="https://phishx-vqib.onrender.com/docs"><img src="https://img.shields.io/badge/API_Docs-1A1A1A?style=for-the-badge&logo=fastapi&logoColor=00E676" alt="API Docs" /></a>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Security-A%2B-00E676?style=for-the-badge&logo=springsecurity&logoColor=black" alt="Security" />

</div>

---

<br />

## 🌌 The Ecosystem

PhishX is a sophisticated, full-stack cybersecurity platform designed to neutralize phishing threats in real-time. By combining advanced Machine Learning feature extraction with an ultra-fast API and a sleek browser extension, PhishX delivers enterprise-grade URL analysis wrapped in a stunning, modern interface.

<table>
  <tr>
    <td align="center" width="33%">
      <img src="https://cdn-icons-png.flaticon.com/512/2103/2103130.png" width="60" alt="AI Icon"/>
      <br/>
      <b>AI-Driven Analysis</b>
      <br/>
      Custom ML models trained to identify zero-day phishing attempts with high precision.
    </td>
    <td align="center" width="33%">
      <img src="https://cdn-icons-png.flaticon.com/512/3254/3254054.png" width="60" alt="Lightning Icon"/>
      <br/>
      <b>Zero Latency</b>
      <br/>
      FastAPI backend guaranteeing asynchronous, lightning-fast response times.
    </td>
    <td align="center" width="33%">
      <img src="https://cdn-icons-png.flaticon.com/512/2889/2889312.png" width="60" alt="Shield Icon"/>
      <br/>
      <b>Enterprise Security</b>
      <br/>
      Strict JWT auth, Bcrypt hashing, and rate limiting with no third-party dependencies.
    </td>
  </tr>
</table>

---

## 🛠️ Technological Architecture

Our ecosystem is fully containerized and decoupled for horizontal scaling.

<details open>
<summary><b>📂 Expand to View Directory Structure</b></summary>
<br>

```text
PhishX/
├── backend/                  # FastAPI Core Engine
│   ├── alembic/              # Async Database Migrations
│   ├── app/                  
│   │   ├── api/v1/           # Endpoints: Scans, Admin, Payments, Auth
│   │   ├── core/             # JWT Security, Rate Limiting, Config
│   │   └── services/         # ML Feature Extractor Logic
│   └── Dockerfile            # Microservice Container
├── browser-extension/        # On-the-fly URL scanning extension
├── model/                    # ML Datasets (phishing_site_urls.csv)
├── phishx-frontend/          # React + Vite Interactive Dashboard
└── docker-compose.prod.yml   # Production Orchestration
```
</details>

---

## 🚀 Deployment & Quickstart

PhishX is engineered for immediate deployment using Docker.

### 1. Repository Setup
```bash
git clone https://github.com/Uditpandya07/PhishX.git
cd PhishX
cp .env.example .env
```

### 2. Ignite the Containers
```bash
# Spins up the PostgreSQL database and FastAPI backend
docker-compose up -d --build
```
> **Note**: The API runs locally at `http://localhost:8000`. Full OpenAPI interactive documentation is instantly available at `http://localhost:8000/docs`.

### 3. Database Migrations
```bash
# Initialize schemas inside the container
docker-compose exec backend alembic upgrade head
```

---

## 🌐 Live Infrastructure

- **Interactive UI Dashboard**: [phishx-app.vercel.app](https://phishx-app.vercel.app/)
- **API Engine**: [phishx-vqib.onrender.com](https://phishx-vqib.onrender.com/)

### 📖 System Documentation
- [**Deployment Guide**](DEPLOYMENT.md) — Scaling to production environments.
- [**Rule Authoring**](RULE_AUTHORING.md) — Extending the threat detection engine.
- [**Development Journey**](JOURNEY.md) — The architectural decisions behind PhishX.

<br />

<div align="center">
  <a href="https://phishx-app.vercel.app/">
    <img src="https://raw.githubusercontent.com/Uditpandya07/PhishX/main/phishx-frontend/public/brand-text.png" alt="PhishX" width="200" />
  </a>
  <p><i>Building a safer internet, one scan at a time.</i></p>
</div>
