"use client";
import { motion } from "framer-motion";
import { FaShieldAlt, FaUserShield, FaCookieBite, FaLock, FaGlobe, FaBalanceScale } from "react-icons/fa";
import "./Legal.css";

export default function PrivacyPolicy() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Global Privacy Policy</h1>
        <p>Comprehensive Data Protection & Privacy Framework</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaShieldAlt /> 1. Data Collection & Processing</h3>
          <p>
            PhishX ("Platform", "we", "us") operates strictly on a "Privacy By Design" framework. We act as a 
            <strong> Data Fiduciary</strong> (under the India DPDP Act 2023) and a <strong>Data Controller</strong> 
            (under GDPR) only for the minimal account creation data (Name, Email). We only process the specific 
            URLs you submit for analysis. We do not track cross-site browsing history, IP addresses of non-registered 
            users, or collect any other Personally Identifiable Information (PII).
          </p>
        </section>

        <section>
          <h3><FaUserShield /> 2. Threat Intelligence & Anonymization</h3>
          <p>
            Submitted URLs are analyzed using our ML models. These logs are stored securely in your private history. 
            Anonymized threat indicators (e.g., domain names, obfuscation patterns) may be aggregated to improve 
            our global threat intelligence matrix. This aggregated data contains no PII and cannot be reverse-engineered 
            to identify you, complying with GDPR Recital 26 regarding anonymized data.
          </p>
        </section>

        <section>
          <h3><FaGlobe /> 3. International Data Subjects Rights (GDPR & CCPA)</h3>
          <p>
            <strong>For EU Residents (GDPR):</strong> You hold the right to Access, Rectification, Erasure ("Right to be Forgotten"), 
            Restriction of Processing, and Data Portability. You may revoke consent at any time via your account settings.
          </p>
          <p>
            <strong>For California Residents (CCPA):</strong> We do not sell your personal information. You have the right 
            to request disclosure of data collection practices and request deletion of your data.
          </p>
        </section>

        <section>
          <h3><FaBalanceScale /> 4. Compliance with Indian Law (DPDP Act & IT Act)</h3>
          <p>
            In accordance with the Digital Personal Data Protection Act, 2023 and the Information Technology 
            (Reasonable Security Practices and Procedures) Rules, 2011, we implement strict purpose limitation. 
            Data is retained only as long as necessary to provide the service. Should you delete your account, 
            all associated PII is permanently purged within 30 days.
          </p>
        </section>

        <section>
          <h3><FaCookieBite /> 5. Cookies & Tracking Technologies</h3>
          <p>
            We deploy strictly necessary, encrypted HTTP-only session cookies required for authentication. 
            We explicitly prohibit third-party marketing pixels, invasive trackers, and cross-origin data 
            mining scripts on our platform. 
          </p>
        </section>

        <section>
          <h3><FaLock /> 6. Data Security & Storage</h3>
          <p>
            Data transit is protected via TLS 1.3 encryption. At-rest data is safeguarded using industry-standard 
            AES-256 encryption. We employ strict Role-Based Access Controls (RBAC) ensuring your scan history 
            remains isolated and inaccessible to unauthorized parties.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px' }}>
          <h3 style={{ marginBottom: '15px' }}>Contact & Grievance Officer</h3>
          <p style={{ fontSize: '0.95rem' }}>
            To exercise your data rights or report a privacy violation, please contact our Grievance Officer by clicking the <strong>Contact Support</strong> button located in the dashboard footer.<br/>
            We aim to respond to all legally validated requests within 30 days.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '20px' }}>
            Effective Date: April 23, 2026. PhishX is operated by Udit Pandya.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
