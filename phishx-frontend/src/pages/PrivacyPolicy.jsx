import { motion } from "framer-motion";
import { FaShieldAlt, FaUserShield, FaCookieBite, FaLock } from "react-icons/fa";
import "./Legal.css";

export default function PrivacyPolicy() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Privacy Policy</h1>
        <p>Your security is our priority. Learn how we handle and protect your data.</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaShieldAlt /> Data Collection</h3>
          <p>
            PhishX is designed with a "Privacy First" philosophy. We only collect the URLs you explicitly submit for scanning. 
            Unlike traditional security tools, we do not track your browsing history or collect personally identifiable 
            information (PII) beyond what is required for your account (email and name).
          </p>
        </section>

        <section>
          <h3><FaUserShield /> Threat Intelligence</h3>
          <p>
            When you scan a URL, our AI analyzes lexical patterns. The results are stored in your private history to help you 
            track threats over time. We may use anonymized threat indicators (such as suspicious redirection patterns) 
            to improve our global detection model, but this data is never linked back to your identity.
          </p>
        </section>

        <section>
          <h3><FaCookieBite /> Cookies & Tracking</h3>
          <p>
            We use strictly necessary cookies for authentication purposes. We do not use third-party tracking pixels, 
            advertisement cookies, or data-mining scripts. Your session data is encrypted and stored securely.
          </p>
        </section>

        <section>
          <h3><FaLock /> Data Security</h3>
          <p>
            All communications between your browser and our servers are encrypted via TLS 1.3. Your scan history is 
            stored in an isolated database environment, and we implement strict access controls to ensure that only 
            you can view your logs.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Last Updated: April 23, 2026. For privacy concerns, contact security@phishx.io.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
