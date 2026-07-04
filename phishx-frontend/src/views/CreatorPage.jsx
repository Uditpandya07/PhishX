"use client";
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
              <span>Full-Stack Developer</span>
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
              Building PhishX was an opportunity to bridge the gap between machine learning and intuitive web design. 
              The project involved architecting a scalable backend, implementing a Random Forest classifier for URL 
              feature analysis, and designing a responsive, glassmorphic UI that delivers complex threat data in an accessible format.
            </p>
            <p>
              Overcoming challenges in backend synchronization, real-time feature extraction, and model optimization 
              has been a rewarding experience. PhishX represents my dedication to building secure, performant, and 
              user-centric applications from the ground up.
            </p>
          </section>

          <section className="glass-section vision-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <FaLightbulb style={{ color: '#4ade80', fontSize: '1.5rem' }} />
              <h3>The Vision</h3>
            </div>
            <p>
              Cybersecurity should be accessible, seamless, and proactive. My vision for PhishX is to provide a 
              reliable, high-performance tool that empowers users to navigate the web safely and confidently.
            </p>
            <p>
              I am committed to the continuous improvement of the platform, ensuring the AI model evolves alongside 
              modern web standards and emerging phishing techniques.
            </p>
          </section>

          <div className="creator-cta">
            <p>Have a question or want to explore my other products?</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '15px' }}>
              <a 
                href="https://uditpandya.vercel.app/#contact" 
                target="_blank" 
                rel="noreferrer" 
                className="primary-btn-nav" 
                style={{ padding: '12px 30px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '10px' }}
              >
                Get In Touch <FaExternalLinkAlt style={{ fontSize: '0.8rem' }} />
              </a>
              <a 
                href="https://uditpandya07.github.io/PHISHTRA-DEMO/" 
                target="_blank" 
                rel="noreferrer" 
                className="phishtra-btn"
                style={{ 
                  padding: '12px 30px', 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  color: '#4ade80',
                  borderRadius: '100px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.2)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(74, 222, 128, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Explore Phishtra <FaExternalLinkAlt style={{ fontSize: '0.8rem' }} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
