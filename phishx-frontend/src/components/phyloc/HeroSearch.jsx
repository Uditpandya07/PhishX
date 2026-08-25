import { Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import DepthText from './DepthText';

export default function HeroSearch({ lookupEmail, setLookupEmail, handleAnalyze, lookupLoading }) {
  return (
    <motion.section 
      className="hero-section"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div style={{ marginBottom: '25px', marginTop: '10px' }}>
        <DepthText
          text="Phyloc Intelligence"
          layers={20}
          depth={2}
          faceColor="#f4f2fa"
          depthColor="#2dd4bf"
          tilt={10}
          pointerTracking
          smoothing={0.14}
          perspective={1000}
          autoOrbit
          orbitSpeed={0.25}
          fontSize="clamp(2.5rem, 8vw, 4.5rem)"
          fontWeight={900}
          shadow
        />
      </div>
      <p>Analyze email syntax, domain controls, patterns, and global breach history with enterprise-grade clarity.</p>
      
      <form className="search-container" onSubmit={handleAnalyze}>
        <input
          type="email"
          className="search-input"
          placeholder="Enter an email to scan..."
          value={lookupEmail}
          onChange={(e) => setLookupEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn-analyze" disabled={lookupLoading || !lookupEmail}>
          {lookupLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          <span>{lookupLoading ? "Analyzing" : "Analyze"}</span>
        </button>
      </form>
    </motion.section>
  );
}
