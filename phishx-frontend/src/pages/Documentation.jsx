import { motion } from "framer-motion";
import { FaBook, FaCodeBranch, FaCogs, FaProjectDiagram } from "react-icons/fa";
import "./Legal.css";

export default function Documentation() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Documentation</h1>
        <p>Technical specifications and usage guide for the PhishX detection engine.</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaCogs /> The Detection Engine</h3>
          <p>
            PhishX utilizes a dual-layered approach to URL analysis. First, the engine performs a **Lexical Feature Extraction** 
            process, analyzing over 15 distinct markers including entropy, suspicious TLDs, and redirection chains. 
            Second, these features are fed into a **Random Forest Classifier** trained on millions of verified phishing 
            and legitimate URLs.
          </p>
        </section>

        <section>
          <h3><FaProjectDiagram /> Lexical Features Analyzed</h3>
          <div className="tech-grid-small">
            <div className="tech-tag">URL Length</div>
            <div className="tech-tag">Entropy Score</div>
            <div className="tech-tag">Subdomain Count</div>
            <div className="tech-tag">Special Characters (@, -, .)</div>
            <div className="tech-tag">Suspicious Keywords</div>
            <div className="tech-tag">TLD Reputation</div>
          </div>
        </section>

        <section>
          <h3><FaBook /> How to Use the Scanner</h3>
          <p>
            Simply paste any suspicious URL into the centerpiece scanner. Our engine will return a **Risk Score (0-100%)** 
            and a clear verdict. You can view detailed breakdowns of the threat indicators in your scan history if 
            you are logged in.
          </p>
        </section>

        <section>
          <h3><FaCodeBranch /> Future Integrations</h3>
          <p>
            While the Developer API is currently in "Coming Soon" status, the documentation for endpoint integration 
            will be released shortly. This will allow for high-throughput scanning of millions of URLs via secure 
            JSON-REST endpoints.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px' }}>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            Version: 1.0.4-beta • Build: 2026.04.23
          </p>
        </section>
      </div>

      <style jsx>{`
        /* Note: I'll add these styles to Legal.css for compatibility */
      `}</style>
    </motion.div>
  );
}
