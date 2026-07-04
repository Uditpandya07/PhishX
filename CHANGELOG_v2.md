# PhishX v2.0.0 - Next-Generation AI Security & Architecture Update

Welcome to the largest update in the history of PhishX! Version 2.0.0 transforms the platform from a standard web application into an enterprise-grade, real-time threat intelligence engine. 

This release includes a complete architectural overhaul to Next.js, asynchronous backend processing, advanced AI threat detection, and rigorous global legal compliance frameworks.

---

## 🚀 1. Complete Next.js & Architecture Migration
- **Framework Upgrade:** Fully migrated the frontend from Vite to **Next.js 15 (App Router)**, completely transforming routing, SEO, and SSR capabilities.
- **Component Restructure:** Re-organized all core views into the `src/app/` and `src/views/` directory patterns.
- **Infrastructure as Code (IaC):** Introduced a complete `terraform/` directory for automated cloud infrastructure provisioning.
- **CI/CD Pipelines:** Added GitHub Actions (`ci-pipeline.yml`, `cd-pipeline.yml`) for automated testing and continuous deployment.

## 🧠 2. Advanced AI & Real-Time Engine (Backend)
- **Asynchronous Workers:** Introduced Celery + Redis (`worker.py`) to handle intense URL scanning and ML inference in the background without blocking the main thread.
- **WebSocket Telemetry:** Integrated `ws.py` to stream live, real-time scanning progress directly to the frontend `ScanPanel.jsx`.
- **xAI Integration:** Built `xai.py` to introduce advanced, zero-day heuristic analysis using next-generation AI models.
- **Top 10k Whitelist:** Upgraded `top_10k.py` parsing capabilities to reduce false positives for highly trusted domains.

## ⚖️ 3. Global Legal & Compliance Standard
- **International Policy Revamp:** Completely overhauled the `PrivacyPolicy.jsx` and `TermsOfService.jsx` to adhere strictly to India's DPDP, European GDPR, and CCPA standards.
- **Cookie Consent Engine:** Built a new global `CookieBanner.jsx` with glassmorphic UI, allowing users to accept or decline telemetry tracking.
- **Mandatory Consent Flow:** The `AuthModal.jsx` now strictly prevents new account creation unless users explicitly check the Privacy Policy and Terms of Service agreement box.

## 🎫 4. In-App Support & Ticketing System
- **Secure Communications:** Removed external email dependencies. Added a fully secure, authenticated `ContactModal.jsx` for users to submit direct queries.
- **Database Expansion:** Ran an Alembic schema migration (`404a8f4c7fdc`) to introduce the new `ContactQuery` PostgreSQL model.
- **Admin Inbox:** Upgraded the `AdminPanel.jsx` to fetch and render all active user support tickets directly inside the dashboard.

## ⚡ 5. Admin Panel & Diagnostic Core
- **System Pulse Diagnostics:** Completely re-wired the diagnostic engine. Admins can now run a live ping against all microservices (API Gateway, Neural DB, Scanner, Auth Vault, Storage, CORS, Logic Core).
- **Live Terminal Output:** Added a dynamic, hacker-themed `Diagnostic Warning Logs` terminal that automatically intercepts and prints `try/catch` Axios error strings (e.g. 404s, timeouts) if a microservice fails.
- **Database Self-Healing:** Added a "Repair Database" override to re-synchronize missing tables via `Base.metadata.create_all`.
- **Admin Loop-Hole Prevention:** Implemented critical safety locks in `admin.py`. Admins can no longer approve their *own* deletion requests, nor can the final admin account be deleted, preventing permanent system lockouts.

## 📡 6. CyberPulse Intelligence Feed
- **AdBlocker Bypass Proxy:** Built a new backend router (`endpoints/news.py`) to proxy HackerNews data, preventing aggressive frontend AdBlockers from blocking the threat feed.
- **Dynamic Tagging:** The frontend `NewsPage.jsx` now uses smart keyword extraction to dynamically tag articles (e.g., `[CYBERSECURITY]`, `[ARTIFICIAL INTELLIGENCE]`, `[CRYPTO]`).
- **Domain Extraction:** News cards now explicitly parse and highlight the root domain source (e.g., `techcrunch.com`) to establish trust before clicking.
- **Threat Ticker:** Added a scrolling `ThreatTicker.jsx` component for high-urgency notifications.

## 🎨 7. UI/UX Polish & Bug Fixes
- **Footer Refactor:** Fixed a massive visual bug in `Dashboard.jsx` where CSS Flexbox wrapping caused the footer links to overflow and leave dead space.
- **Social Links:** Updated social links to safely use `target="_blank" rel="noopener noreferrer"`, including the newly added LinkedIn profile.
- **Authentication Bug Fix:** Patched a severe bug where `ContactModal` sent corrupted `Authorization: Bearer null` headers. The entire frontend now correctly relies on secure `HttpOnly` cookies via global `axios.defaults.withCredentials`.
- **Visual Micro-Interactions:** Upgraded animations in `SpotlightCard.jsx` and added exact SVG icon alignments.

---
*Ready to merge into `main` and deploy to production.*
