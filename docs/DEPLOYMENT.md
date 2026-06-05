# 🚀 PhishX Deployment Guide

This document outlines the steps to deploy the PhishX platform in a production environment using Docker Compose.

## 🛠️ Prerequisites
- Docker & Docker Compose installed on the server.
- A domain name (optional but recommended for SSL).
- Environment variables configured in `.env`.

## 📦 Deployment Steps

### 1. Configure Environment Variables
Copy `.env.example` to `.env` and update the production values:
```env
# Database
POSTGRES_USER=phishx_admin
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=phishx_prod

# Security
SECRET_KEY=generate_a_random_long_string
EXPECTED_MODEL_HASH=your_model_hash_here

# Supabase & External Services
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
STRIPE_API_KEY=...
SENDGRID_API_KEY=...
```

### 2. Prepare the ML Model
Ensure the `phishing_model.pkl` is present in the `model/` directory.

### 3. Build and Launch
Run the production docker-compose file:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 4. Database Migrations
Run the migrations to set up the database schema:
```bash
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

### 5. Verify Deployment
- **Frontend**: Accessible at `http://your-server-ip`
- **Backend API**: Accessible at `http://your-server-ip/api/v1`
- **API Docs**: Accessible at `http://your-server-ip/docs`

## 🔒 Security Recommendations
- **SSL/TLS**: Use Certbot to generate SSL certificates and update the Nginx configuration to listen on port 443.
- **Firewall**: Ensure only ports 80 and 443 are open to the public.
- **Database Backups**: Set up a cron job to back up the `postgres_data` volume regularly.

---
**Developed with ❤️ by Udit Pandya**
