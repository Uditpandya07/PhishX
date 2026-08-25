import { motion } from 'framer-motion';

/**
 * PhylocLogo — The Obsidian Crystal Shield
 * Now featuring Exploded Assembly, Lens Flare Sweeps, and Envelope Lasers!
 */
export default function PhylocLogo({ size = 32, showText = true, className = '' }) {
  const s = size;

  return (
    <div className={`phyloc-logo-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4 }}>
      <svg
        width={s}
        height={s}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Top Facet Gradient - Bright Sky to Indigo */}
          <linearGradient id="facet-top" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.85" />
          </linearGradient>

          {/* Left Facet Gradient - Deep Indigo shadow */}
          <linearGradient id="facet-left" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.9" />
          </linearGradient>

          {/* Right Facet Gradient - Deep Blue shadow */}
          <linearGradient id="facet-right" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#082f49" stopOpacity="0.95" />
          </linearGradient>

          {/* Lens Flare Gradient */}
          <linearGradient id="lens-flare" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* High-end ambient drop shadow for the whole monolithic crystal */}
          <filter id="crystal-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="15" floodColor="#000000" floodOpacity="0.6" />
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#38bdf8" floodOpacity="0.2" />
          </filter>

          {/* Glowing core filter */}
          <filter id="core-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Envelope clip path for reflections */}
          <clipPath id="shield-clip">
            <polygon points="50,15 85,30 75,65 50,95 25,65 15,30" />
          </clipPath>
        </defs>

        <motion.g 
          filter="url(#crystal-shadow)"
          animate={{ y: [-2, 2, -2] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        >
          {/* LEFT FACET */}
          <motion.polygon
            points="15,30 50,45 50,95 25,65"
            fill="url(#facet-left)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            initial={{ opacity: 0, x: -30, y: 15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, ease: "backOut" }}
          />

          {/* RIGHT FACET */}
          <motion.polygon
            points="85,30 50,45 50,95 75,65"
            fill="url(#facet-right)"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            initial={{ opacity: 0, x: 30, y: 15 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 1.2, ease: "backOut", delay: 0.1 }}
          />

          {/* TOP FACET (The glass lid) */}
          <motion.polygon
            points="50,15 85,30 50,45 15,30"
            fill="url(#facet-top)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1"
            strokeLinejoin="round"
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: "backOut", delay: 0.2 }}
          />
          
          {/* Specular Light Sweep Reflection */}
          <motion.g clipPath="url(#shield-clip)">
            <motion.rect
              x="-50" y="-100" width="200" height="15"
              fill="url(#lens-flare)"
              transform="rotate(45)"
              initial={{ y: -100 }}
              animate={{ y: 250 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: 2, repeatDelay: 2 }}
            />
          </motion.g>

          {/* Inner Connecting Energy Lines */}
          <motion.path
            d="M 50 45 L 50 95"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          />
        </motion.g>

        {/* FLOATING INNER DATA CORE */}
        <motion.polygon
          points="50,23 65,30 50,37 35,30"
          fill="#ffffff"
          filter="url(#core-glow)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0.9, 1, 0.9], scale: [0.9, 1.1, 0.9], y: [-3, 3, -3] }}
          transition={{ 
            opacity: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
            default: { duration: 0.8, delay: 0.8, ease: "backOut" }
          }}
        />

        {/* ENVELOPE LASER SWEEP */}
        <motion.path
          d="M 50,15 L 85,30 L 75,65 L 50,95 L 25,65 L 15,30 Z"
          stroke="#06b6d4"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="40 280"
          strokeLinecap="round"
          initial={{ strokeDashoffset: 320, opacity: 0 }}
          animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: "linear", delay: 1.5 }}
          style={{ filter: 'drop-shadow(0 0 5px #06b6d4)' }}
        />
        
        {/* SECONDARY LASER (Counter-rotating) */}
        <motion.path
          d="M 50,15 L 15,30 L 25,65 L 50,95 L 75,65 L 85,30 Z"
          stroke="#818cf8"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="20 280"
          strokeLinecap="round"
          initial={{ strokeDashoffset: 320, opacity: 0 }}
          animate={{ strokeDashoffset: 0, opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: "linear", delay: 2.5 }}
          style={{ filter: 'drop-shadow(0 0 5px #818cf8)' }}
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: size * 0.6,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            fontFamily: "'Inter', 'Sora', sans-serif",
            color: '#ffffff',
            display: 'flex',
            alignItems: 'baseline',
            lineHeight: 1
          }}>
            Phyloc
            <motion.span 
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.2, type: "spring" }}
              style={{ 
                color: '#38bdf8', 
                fontWeight: 800, 
                marginLeft: '2px',
                fontSize: '1.2em',
              }}
            >
              .
            </motion.span>
          </span>
          <span style={{
            fontSize: size * 0.28,
            color: '#94a3b8',
            fontWeight: 500,
            textAlign: 'right',
            marginTop: '2px',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '0.2px'
          }}>
            by <span style={{color: '#ffffff', fontWeight: 700}}>Phish</span><span style={{color: '#4ade80', fontWeight: 700}}>X</span>
          </span>
        </div>
      )}
    </div>
  );
}
