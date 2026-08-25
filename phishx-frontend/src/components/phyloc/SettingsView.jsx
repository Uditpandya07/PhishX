import { motion } from 'framer-motion';
import { ExternalLink, Settings } from 'lucide-react';

export default function SettingsView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <Settings size={48} color="var(--accent)" style={{ marginBottom: '24px' }} />
        <h2 style={{ margin: '0 0 16px 0' }}>Account Settings</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '0 0 32px 0', lineHeight: 1.7 }}>
          Profile, password, and session management are handled by the main
          PhishX platform. Visit your account settings there to make changes.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px', borderRadius: '999px',
            background: 'var(--accent)', color: '#fff',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
          }}
        >
          Go to PhishX Settings <ExternalLink size={16} />
        </a>
      </div>
    </motion.div>
  );
}
