import { motion } from 'framer-motion';
import { Users, FileText } from 'lucide-react';

export default function AdminView({ dashboard }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} /> Team Members
          </h3>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.team || []).map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{user.role}</td>
                    <td style={{ color: 'var(--safe)' }}>Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
              <Users size={48} color="var(--accent)" />
            </div>
            <h3 style={{ margin: 0 }}>Invite Team Members</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Enterprise plans include unlimited team seats. Contact your account manager to provision SSO.
            </p>
            <button className="btn-primary" disabled style={{ opacity: 0.5 }}>SSO Setup Required</button>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} /> Audit Trail
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Immutable logs of all administrative and analytical actions performed in this workspace.
          </p>
          <div className="history-table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.auditLogs || []).map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{log.action}</td>
                    <td>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
