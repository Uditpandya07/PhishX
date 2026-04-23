import { motion } from "framer-motion";
import { FaGraduationCap, FaLightbulb, FaRocket, FaCode, FaQuoteLeft, FaExternalLinkAlt } from "react-icons/fa";
import "./Legal.css";

export default function CreatorPage() {
  return (
    <motion.div 
      className="creator-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '4rem' }}>The Creator's Vision</h1>
        <p>The story behind PhishX and the journey of building a next-gen security tool.</p>
      </div>

      <div className="creator-grid">
        <div className="creator-sidebar">
          <div className="glass-panel profile-card">
            <div className="avatar-placeholder">UP</div>
            <h2>Udit Pandya</h2>
            <p>Founder & Lead Developer</p>
            <div className="badge-creator">B.Tech CSE</div>
            
            <div className="social-links-creator">
               <a href="https://github.com/Uditpandya07" target="_blank" rel="noreferrer">GitHub</a>
               <a href="https://uditpandya.vercel.app/" target="_blank" rel="noreferrer">Portfolio</a>
            </div>
          </div>

          <div className="glass-panel stats-creator">
            <div className="stat-item">
              <FaCode />
              <span>Full-Stack Specialist</span>
            </div>
            <div className="stat-item">
              <FaRocket />
              <span>Security Researcher</span>
            </div>
          </div>
        </div>

        <div className="creator-main-content">
          <section className="glass-section story-section">
            <FaQuoteLeft className="quote-icon" />
            <h3>My Journey</h3>
            <p>
              Building PhishX wasn't just about writing code; it was about solving a real-world problem that affects 
              millions. During development, I faced several "brick walls"—from perfecting the Random Forest 
              classification logic to ensuring the glassmorphic UI remained performant on all devices. 
            </p>
            <p>
              There were moments when the backend synchronization seemed impossible, and the model prediction 
              accuracy fluctuated. I spent countless nights debugging lexical feature extraction and refining 
              the data flow. These challenges only strengthened my resolve to create a tool that is both 
              technically elite and visually stunning.
            </p>
          </section>

          <section className="glass-section vision-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <FaLightbulb style={{ color: '#4ade80', fontSize: '1.5rem' }} />
              <h3>The Vision</h3>
            </div>
            <p>
              I envision a web where common people don't have to live in fear of the next link in their inbox. 
              PhishX is my contribution to that future. It's not designed for massive corporations—it's designed 
              for you, your family, and your community. 
            </p>
            <p>
              My goal is to keep PhishX as a free, high-performance tool that anyone can use to protect their 
              digital footprint. I am committed to continuous improvement, keeping our AI model updated against 
              the latest phishing techniques.
            </p>
          </section>

          <div className="creator-cta">
            <p>Have a question or want to collaborate?</p>
            <a 
              href="https://uditpandya.vercel.app/#contact" 
              target="_blank" 
              rel="noreferrer" 
              className="primary-btn-nav" 
              style={{ padding: '12px 30px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
            >
              Get In Touch <FaExternalLinkAlt style={{ fontSize: '0.8rem' }} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
