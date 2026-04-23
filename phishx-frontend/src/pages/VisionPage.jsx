import { motion } from "framer-motion";
import { FaEye, FaHandshake, FaGlobeAmericas, FaShieldAlt } from "react-icons/fa";
import "./Legal.css";

export default function VisionPage() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>The PhishX Vision</h1>
        <p>Democratizing high-tier security for the modern world.</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaEye /> Transparency & Trust</h3>
          <p>
            The internet has become a minefield of deceptive links. Our vision is to provide every individual 
            with a "digital magnifying glass"—a tool that reveals the hidden intentions of a URL before it's too late. 
            We believe that security should not be a luxury reserved for corporations, but a fundamental right for 
            every user.
          </p>
        </section>

        <section>
          <h3><FaHandshake /> Community First</h3>
          <p>
            PhishX thrives on community intelligence. When you report a missed threat, you aren't just helping yourself; 
            you're building a global shield that protects thousands of others. Our goal is to create a self-sustaining 
            ecosystem where collective data outpaces the evolution of phishing attacks.
          </p>
        </section>

        <section>
          <h3><FaGlobeAmericas /> A Safer Global Web</h3>
          <p>
            We aim to become the default standard for link verification. By providing free, high-performance tools 
            and a seamless browser extension, we are working towards a future where "phishing" is a relic of the past, 
            and users can navigate the web with total confidence.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px', textAlign: 'center' }}>
          <FaShieldAlt style={{ fontSize: '3rem', color: '#3b82f6', marginBottom: '15px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
            Securing the Next Billion Users.
          </p>
        </section>
      </div>
    </motion.div>
  );
}
