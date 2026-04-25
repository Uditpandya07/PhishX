# 🛡️ PhishX: Enterprise-Grade AI Phishing Protection

PhishX is a cutting-edge, full-stack cybersecurity platform designed to neutralize malicious URLs before they reach the user. By combining a **Pure Lexical Machine Learning Engine** with a **Real-Time Heuristic Override Layer**, PhishX provides sub-millisecond detection for advanced phishing threats, typosquatting, and social engineering attacks.

---

## 🏗️ The PhishX Ecosystem

*   **🛡️ Core Engine**: A FastAPI-based backend utilizing a **Random Forest Classifier** trained on 100k+ malicious/benign samples.
*   **💎 Visual Dashboard**: A high-performance React 19 interface featuring **Glassmorphic design**, Framer Motion animations, and real-time telemetry.
*   **☁️ Identity & Security**: Production-grade authentication powered by **Supabase Auth** and SendGrid SMTP.
*   **🛰️ Real-Time Extension**: A Chrome Manifest V3 extension that provides "Active Guard" protection directly in the browser.

---

## 🔬 Detection Capabilities

The PhishX V2 Engine extracts **15+ distinct mathematical features** from every URL to identify threats that traditional blocklists miss:

1.  **Lexical Structural Analysis**: Identifies abnormal entropy, hyphenation density, and malicious query parameters.
2.  **Subdomain Smuggling Detection**: Catching deceptive roots (e.g., `secure.login.paypal.com.auth-verify.net`).
3.  **TLD Reputation Scoring**: Real-time flagging of high-risk top-level domains favored by threat actors (`.xyz`, `.top`, `.tk`).
4.  **Zero-False-Positive Whitelisting**: A curated database of **500+ trusted global and Indian domains** (Google, IRCTC, HDFC) for instant, skip-scan verification.

---

## 🚀 Vision & Community
PhishX is built on the philosophy that **Security should be a Right, not a Privilege.** 
Instead of complex enterprise tools, PhishX is designed for the "Common Person"—providing a simple, beautiful, and powerful shield against the digital threats of 2026.

---

## 🛠️ Installation & Setup

### Prerequisites
*   Docker & Docker Compose
*   Node.js 20+
*   Python 3.10+
*   Supabase Account

### 1. Environment Configuration
Copy `.env.example` to `.env` and configure your keys:
```env
# Supabase Configuration
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your_sg_key
```

### 2. Launch with Docker
```bash
docker-compose up --build
```

### 3. Local Development
**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
**Frontend:**
```bash
cd phishx-frontend
npm install
npm run dev
```

---

## 📜 Developer Log
For a detailed look at the technical challenges overcome during the building of PhishX, see [JOURNEY.md](file:///c:/Users/KIIT/OneDrive/Documents/PhishX/JOURNEY.md).

**Developed with ❤️ by [Udit Pandya]** 🛡️⚡🔥