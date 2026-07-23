# Security Policy

## Supported Versions

Currently, only the latest release of PhishX is actively supported with security updates. 

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Security is a core priority for PhishX. We take all security vulnerabilities seriously. 

If you discover a security vulnerability within PhishX, please do **NOT** open a public issue. Instead, send an email to the repository owner directly.

We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress. If you report a vulnerability that significantly affects the safety of the platform or its users, we may issue a security advisory.

### Vulnerability Handling Process
1. **Report**: You report the vulnerability via private email.
2. **Triage**: We will determine the severity and validate the exploit.
3. **Patch**: We will patch the vulnerability in a private branch.
4. **Release**: We will release the fix in the next minor version and optionally publish a GitHub Security Advisory.

---

## Architectural Security Context

When auditing the PhishX codebase or hunting for bugs, please keep the following security baselines in mind:

### 1. JWT & Session Management (HttpOnly)
As of v2.1.0, PhishX completely removed local storage (`localStorage`, `sessionStorage`) dependencies for JWT storage. All authentication sessions are managed exclusively via **HttpOnly, Secure Cookies**. The Next.js frontend strictly utilizes `withCredentials: true` via Axios to proxy sessions to the FastAPI backend, nullifying XSS token theft vectors.

### 2. Webhook Payloads
The DevSecOps Slack Webhook integration is strictly constrained to transmit URL observables, ML risk scores, and AI reasoning. Absolutely **no Personally Identifiable Information (PII)** or user tracking strings are appended to outbound webhook `POST` requests, preventing accidental data leaks to external Slack/Teams environments.
