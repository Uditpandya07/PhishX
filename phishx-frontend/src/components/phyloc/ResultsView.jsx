import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Globe, 
  AlertTriangle,
  Mail,
  HelpCircle,
  Clock,
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function ResultsView({ result }) {
  if (!result) return null;

  const trustScore = result.trustScore;

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--safe)';
    if (score >= 55) return 'var(--safe)';
    if (score >= 35) return 'var(--warn)';
    if (score >= 15) return 'var(--danger)';
    return 'var(--danger)';
  };

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'Safe': return <ShieldCheck size={18} />;
      case 'Low Risk': return <AlertTriangle size={18} />;
      case 'Caution': return <AlertTriangle size={18} />;
      case 'High Risk': return <ShieldAlert size={18} />;
      case 'Critical Risk': return <ShieldAlert size={18} />;
      default: return <HelpCircle size={18} />;
    }
  };

  const getVerdictBadgeClass = (verdict) => {
    switch (verdict) {
      case 'Safe': return 'badge safe';
      case 'Low Risk': return 'badge warn';
      case 'Caution': return 'badge warn';
      case 'High Risk': return 'badge danger';
      case 'Critical Risk': return 'badge danger';
      default: return 'badge neutral';
    }
  };

  const scoreColor = getScoreColor(trustScore);
  
  // Recharts data for the radial gauge
  const gaugeData = [
    { name: 'Trust', value: trustScore, color: scoreColor },
    { name: 'Risk', value: 100 - trustScore, color: 'var(--bg-elevated)' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="glass-panel"
      style={{ padding: '40px', overflow: 'hidden' }}
    >
      <motion.div variants={itemVariants} className="results-header">
        <div className="risk-gauge-container">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="risk-score-display">
            <h2 style={{ color: scoreColor }}>{trustScore}</h2>
            <span>Trust Score</span>
          </div>
        </div>

        <div className="results-meta">
          <h3>{result.email}</h3>
          <div className={getVerdictBadgeClass(result.verdict)} style={{ padding: '8px 20px', fontSize: '1rem', marginBottom: '16px' }}>
            {getVerdictIcon(result.verdict)} {result.verdict}
          </div>
          <div className="meta-details">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Analyzed in {result.executionTimeMs}ms
            </span>
            <span>•</span>
            <span className="mono">{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </motion.div>

      <motion.h4 variants={itemVariants} className="section-title">Detection Signals</motion.h4>
      <motion.div variants={itemVariants} className="signal-grid">
        {(result.signals || []).length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', gridColumn: '1 / -1' }}>
            <CheckCircle2 size={40} color="var(--safe)" style={{ marginBottom: '16px' }} />
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No active threats detected</h4>
            <p style={{ margin: 0 }}>This email address passed all baseline security checks.</p>
          </div>
        ) : (
          (result.signals || []).map((signal, i) => (
            <div key={i} className="signal-card">
              <div className={`signal-icon ${
                ['DATA_BREACH_DETECTED', 'BREACH_CONFIRMED', 'PLAINTEXT_PASSWORD_EXPOSED', 'CREDENTIALS_LEAKED'].includes(signal) ? 'bad' :
                ['DISPOSABLE_EMAIL', 'SUSPICIOUS_TLD', 'HIGH_RISK_PATTERN', 'SMTP_UNVERIFIED'].includes(signal) ? 'warn' :
                'neutral'
              }`}>
                {['DATA_BREACH_DETECTED', 'BREACH_CONFIRMED', 'PLAINTEXT_PASSWORD_EXPOSED', 'CREDENTIALS_LEAKED'].includes(signal) ? <ShieldAlert size={20} /> :
                 ['DISPOSABLE_EMAIL', 'SUSPICIOUS_TLD', 'HIGH_RISK_PATTERN', 'SMTP_UNVERIFIED'].includes(signal) ? <AlertTriangle size={20} /> :
                 <CheckCircle2 size={20} />}
              </div>
              <div className="signal-content">
                <h4>{signal.replace(/_/g, ' ')}</h4>
                <p>Detected in final aggregate scoring.</p>
              </div>
            </div>
          ))
        )}
      </motion.div>

      <motion.h4 variants={itemVariants} className="section-title">Provider Intelligence Breakdown</motion.h4>
      <motion.div variants={itemVariants} className="signal-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* DNS */}
        <div className="signal-card">
          <div className="signal-icon neutral"><Globe size={20} /></div>
          <div className="signal-content" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4>Infrastructure & DNS</h4>
              <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score: {result.dns?.score || 0}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>MX Records</span>
                <span style={{ color: result.dns?.mx?.mxRecords?.length > 0 ? 'var(--safe)' : 'var(--danger)' }}>
                  {result.dns?.mx?.mxRecords?.length > 0 ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {result.dns?.mx?.mxRecords?.length || 0} Found
                </span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mail Server</span>
                <span className="mono" style={{ color: 'var(--text-primary)' }}>{result.dns?.mx?.mxRecords?.[0]?.exchange || 'None'}</span>
              </p>
              <p style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>SMTP Handshake</span>
                <span style={{ color: result.dns?.smtp?.valid ? 'var(--safe)' : 'var(--warn)' }}>
                  {result.dns?.smtp?.valid ? 'Verified' : 'Unverified / Timeout'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* EmailRep */}
        {result.scores?.emailrep && (
          <div className="signal-card">
            <div className="signal-icon neutral"><ShieldCheck size={20} /></div>
            <div className="signal-content" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4>EmailRep (Reputation)</h4>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Score: {result.scores.emailrep.score}</span>
              </div>
              <p style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Status</span>
                <span style={{ textTransform: 'capitalize', color: result.scores.emailrep.reputation === 'high' ? 'var(--safe)' : result.scores.emailrep.reputation === 'low' ? 'var(--danger)' : 'var(--warn)' }}>
                  {result.scores.emailrep.reputation || 'unknown'}
                </span>
              </p>
              {result.scores.emailrep.signals?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  {result.scores.emailrep.signals.map((s, idx) => (
                    <p key={idx} style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={10} /> {s}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>No negative signals reported.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {result.scores?.xposedornot?.breachCount > 0 && (
        <motion.div variants={itemVariants}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h4 className="section-title">Dark Web & Breach Intel</h4>
            <div className="badge danger" style={{ marginBottom: '20px' }}>
              <Database size={14} /> {result.scores.xposedornot.breachCount} Breaches Found
            </div>
          </div>
          <div className="breach-list">
            {(result.details || [])
              .filter(d => d.startsWith('  • '))
              .slice(0, 8)
              .map((b, idx) => {
                const parts = b.split('\n');
                const titleLine = parts[0].replace('  • ', '').trim();
                const domainLine = parts[1]?.trim() || '';
                const dataLine = parts[2]?.replace('Data: ', '').trim() || '';
                const isPlaintext = b.includes('PLAINTEXT');
                
                return (
                  <div key={idx} className="breach-item">
                    <div className="breach-header">
                      <h4>{titleLine}</h4>
                      {isPlaintext && (
                        <div className="badge danger" style={{ fontSize: '0.7rem' }}>
                          <Unlock size={12} /> Plaintext Passwords
                        </div>
                      )}
                    </div>
                    <div className="breach-records mono">{domainLine}</div>
                    <div className="breach-data" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <Lock size={14} style={{ color: 'var(--text-tertiary)', marginTop: '2px' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{dataLine}</span>
                    </div>
                  </div>
                );
              })}
            {result.scores.xposedornot.breachCount > 8 && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                + {result.scores.xposedornot.breachCount - 8} more historical breaches omitted for brevity.
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
