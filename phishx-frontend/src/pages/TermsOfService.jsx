import { motion } from "framer-motion";
import { FaGavel, FaBan, FaHandshake, FaGlobe } from "react-icons/fa";
import "./Legal.css";

export default function TermsOfService() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Terms of Service</h1>
        <p>Agreement for using the PhishX platform and detection tools.</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaGavel /> Acceptance of Terms</h3>
          <p>
            By accessing or using PhishX, you agree to be bound by these Terms of Service. This platform is provided 
            as a community tool to help individuals identify potential phishing threats. You agree to use the 
            service only for lawful purposes and in accordance with these terms.
          </p>
        </section>

        <section>
          <h3><FaBan /> Prohibited Use</h3>
          <p>
            You may not use PhishX to: (a) test your own phishing infrastructure for evasion, (b) scrape our ML model 
            for competitive intelligence, or (c) attempt to reverse-engineer our detection logic. Any account 
            found engaging in automated scanning without an authorized API key will be permanently terminated.
          </p>
        </section>

        <section>
          <h3><FaHandshake /> Disclaimer of Warranty</h3>
          <p>
            While our AI model maintains high accuracy (99.4%), no detection system is perfect. PhishX is provided 
            "as is" without any warranties. We are not liable for any damages resulting from missed threats (false negatives) 
            or incorrectly flagged legitimate sites (false positives). Always exercise caution when clicking unknown links.
          </p>
        </section>

        <section>
          <h3><FaGlobe /> Community Contribution</h3>
          <p>
            By reporting false positives or missed threats through the community intelligence logs, you grant 
            PhishX the right to use this anonymized feedback to improve the global detection engine for the 
            benefit of all users.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Last Updated: April 23, 2026. PhishX is a non-commercial project dedicated to internet safety.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
