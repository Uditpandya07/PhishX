"use client";
import { motion } from "framer-motion";
import { FaCodeBranch, FaRocket, FaTerminal, FaCalendarAlt } from "react-icons/fa";
import devJourneyData from "../data/devJourney.json";
import "./Legal.css";

export default function DevJourney() {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}>Development Journey</h1>
        <p>The story of PhishX, from an idea to a production-grade defense system.</p>
      </div>

      <div className="glass-section" style={{ padding: '40px', position: 'relative' }}>
        {/* Vertical Timeline Line */}
        <div style={{
          position: 'absolute',
          left: '50px',
          top: '40px',
          bottom: '40px',
          width: '2px',
          background: 'linear-gradient(180deg, #3b82f6 0%, #4ade80 50%, #a855f7 100%)',
          opacity: 0.3
        }} className="timeline-line"></div>

        {[...devJourneyData].reverse().map((entry, index) => (
          <motion.div 
            key={entry.id}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
              position: 'relative',
              paddingLeft: '60px',
              marginBottom: index === devJourneyData.length - 1 ? '0' : '50px'
            }}
          >
            {/* Timeline Dot */}
            <div style={{
              position: 'absolute',
              left: '0',
              top: '5px',
              width: '24px',
              height: '24px',
              marginLeft: '2px', // Centers on the 50px line (50px + 1px center - 12px) => wait, left: 50px is line. so left: 39px is center.
              // Let's adjust positioning so it's perfectly centered on the line.
              transform: 'translateX(-3px)',
              background: '#0f172a',
              border: '3px solid #3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
            }}>
              <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
            </div>

            <div style={{
              display: 'inline-block',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '4px 12px',
              borderRadius: '100px',
              color: '#38bdf8',
              fontSize: '0.85rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              width: 'fit-content'
            }}>
              <FaCalendarAlt />
              {entry.dateString}
            </div>
            
            <h3 style={{ 
              fontSize: '1.8rem', 
              color: '#fff', 
              marginBottom: '15px',
              fontWeight: 800,
              letterSpacing: '-0.5px'
            }}>
              {entry.title}
            </h3>
            
            <p style={{ 
              color: '#94a3b8', 
              lineHeight: 1.8, 
              fontSize: '1.05rem' 
            }}>
              {entry.content}
            </p>
          </motion.div>
        ))}
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .timeline-line { left: 30px !important; }
          .glass-section > div > div:first-child { left: -19px !important; } /* Adjust dot for mobile */
          .glass-section > div { padding-left: 30px !important; }
        }
      `}</style>
    </motion.div>
  );
}
