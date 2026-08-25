import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Filter,
  Activity
} from 'lucide-react';

export default function ThreatFeedView({ dashboard }) {
  const [filter, setFilter] = useState('all');

  const lookups = dashboard?.lookups || [];
  
  const filteredFeed = useMemo(() => {
    if (filter === 'all') return lookups;
    if (filter === 'threats') return lookups.filter(l => l.trustScore < 50);
    if (filter === 'safe') return lookups.filter(l => l.trustScore >= 80);
    return lookups;
  }, [lookups, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div className="glass-panel threat-header">
        <div>
          <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity color="var(--accent)" /> Live Threat Feed
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Real-time stream of all intelligence queries across the platform.</p>
        </div>
        
        <div className="threat-filter-container">
          <Filter size={16} color="var(--text-tertiary)" />
          <div style={{ background: 'var(--bg-tertiary)', padding: '4px', borderRadius: 'var(--radius-full)', display: 'flex' }}>
            <button 
              className={`btn-secondary ${filter === 'all' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none', background: filter === 'all' ? 'var(--accent-subtle)' : 'transparent', color: filter === 'all' ? 'var(--accent)' : 'var(--text-secondary)' }}
              onClick={() => setFilter('all')}
            >
              All Events
            </button>
            <button 
              className={`btn-secondary ${filter === 'threats' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none', background: filter === 'threats' ? 'var(--danger-subtle)' : 'transparent', color: filter === 'threats' ? 'var(--danger)' : 'var(--text-secondary)' }}
              onClick={() => setFilter('threats')}
            >
              Threats Only
            </button>
            <button 
              className={`btn-secondary ${filter === 'safe' ? 'active' : ''}`}
              style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none', background: filter === 'safe' ? 'var(--safe-subtle)' : 'transparent', color: filter === 'safe' ? 'var(--safe)' : 'var(--text-secondary)' }}
              onClick={() => setFilter('safe')}
            >
              Safe Only
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0' }}>
        <div className="feed-timeline">
          <AnimatePresence>
            {filteredFeed.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={48} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                <h3>No events match filter</h3>
                <p>Try adjusting your filter criteria or waiting for new scans.</p>
              </div>
            ) : (
              filteredFeed.map((item, index) => {
                const isThreat = item.trustScore < 50;
                const isSafe = item.trustScore >= 80;
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="feed-item"
                  >
                    <div className={`feed-dot ${isThreat ? 'danger' : isSafe ? 'safe' : 'warn'}`}></div>
                    
                    <div className="feed-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="feed-email">{item.email}</div>
                          <div className="feed-meta">
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {new Date(item.createdAt).toLocaleTimeString()}
                            </span>
                            <span style={{ color: isThreat ? 'var(--danger)' : isSafe ? 'var(--safe)' : 'var(--warn)' }}>
                              {item.verdict} ({item.trustScore}/100)
                            </span>
                          </div>
                        </div>
                        <div className={`badge ${isThreat ? 'danger' : isSafe ? 'safe' : 'warn'}`}>
                          {isThreat ? <ShieldAlert size={12} /> : isSafe ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                          {(item.summary || '').split(':')[0] || 'Processed'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
