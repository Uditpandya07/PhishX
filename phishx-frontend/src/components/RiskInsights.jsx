import React from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaChartBar, FaSearch } from 'react-icons/fa';

export default function RiskInsights({ user, scanData }) {
  const isPremium = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';

  if (!isPremium) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', marginTop: '20px' }}>
        <FaLock style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '10px' }} />
        <h3 style={{ margin: '0 0 10px' }}>Detailed Risk Insights (Pro Feature)</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Upgrade to Pro to see deep heuristics, exact feature matches, and WHOIS data breakdown for every scan.
        </p>
      </div>
    );
  }

  // Example placeholder for Premium View
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ padding: '20px', marginTop: '20px', borderLeft: '4px solid #3b82f6' }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
        <FaChartBar style={{ color: '#3b82f6' }} /> Advanced Risk Insights
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#cbd5e1' }}>Lexical Entropy</h4>
          <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{scanData?.features?.entropy?.toFixed(2) || '0.00'}</strong>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#cbd5e1' }}>Domain Age</h4>
          <strong style={{ fontSize: '1.2rem', color: '#fff' }}>{scanData?.whois_data?.age || 'Unknown'}</strong>
        </div>
        <div style={{ gridColumn: '1 / -1', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#cbd5e1' }}>Flags Triggered</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {scanData?.features?.triggered_flags?.map((flag, idx) => (
              <span key={idx} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                {flag}
              </span>
            )) || <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No specific heuristics triggered.</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
