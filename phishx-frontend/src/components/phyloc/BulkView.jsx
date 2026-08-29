import { useState, Fragment, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, ListPlus } from 'lucide-react';

export default function BulkView({ dashboard, token, fetchJson, refreshDashboard }) {
  const [bulkInput, setBulkInput] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [expandedJobs, setExpandedJobs] = useState({});

  useEffect(() => {
    const hasActiveJobs = (dashboard?.bulkJobs || []).some(j => j.status === 'processing');
    if (!hasActiveJobs) return;
    
    // Poll at 5s, not 800ms — aggressive polling wastes server resources
    const interval = setInterval(() => {
      if (refreshDashboard) refreshDashboard();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [dashboard, refreshDashboard]);

  const toggleJob = (id) => {
    if (!id) return;
    setExpandedJobs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    const emails = bulkInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (emails.length === 0) return;

    setBulkLoading(true);

    try {
      await fetchJson(`/api/v1/phyloc/bulk-jobs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        data: { emails }
      });
      
      setBulkInput("");
      setToast(`Started bulk scan for ${emails.length} emails.`);
      if (refreshDashboard) {
        refreshDashboard();
      }
    } catch (error) {
      setToast(error.message);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} /> Submit Bulk Scan
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Paste up to 250 email addresses separated by commas or newlines.
          </p>
          <form onSubmit={handleBulkSubmit}>
            <textarea
              className="form-input"
              style={{ width: '100%', minHeight: '160px', marginBottom: '16px' }}
              placeholder="billing@example.com&#10;security@example.com..."
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={bulkLoading || !bulkInput.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
            >
              {bulkLoading ? <Loader2 className="animate-spin" size={18} /> : <ListPlus size={18} />}
              {bulkLoading ? "Processing..." : "Start Bulk Job"}
            </button>
          </form>

          {toast && <div style={{ marginTop: '16px', color: 'var(--safe)' }}>{toast}</div>}
        </div>
      </div>

      <div className="glass-panel">
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Name</th>
                <th>Emails Scanned</th>
                <th>Status</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.bulkJobs || []).length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px' }}>
                    No bulk jobs have been run yet.
                  </td>
                </tr>
              ) : (
                dashboard.bulkJobs.map((job, idx) => {
                  if (!job) return null;
                  return (
                    <Fragment key={job.id || idx}>
                      <tr onClick={() => job.id && toggleJob(job.id)} style={{ cursor: 'pointer' }}>
                        <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                          {job.id?.split('_')[1] || job.id || 'N/A'}
                        </td>
                        <td>{job.name}</td>
                        <td>{job.emails?.length || 0}</td>
                        <td style={{ width: '25%' }}>
                          {job.status === 'processing' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <Loader2 size={12} className="animate-spin" color="var(--accent)" />
                                  PROCESSING
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{job.progress || 0}%</span>
                              </div>
                              <div style={{ width: '100%', height: '4px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                <motion.div 
                                  animate={{ width: `${job.progress || 0}%` }}
                                  transition={{ ease: "linear", duration: 0.5 }}
                                  style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--cyan))', borderRadius: '4px', boxShadow: '0 0 8px rgba(6, 182, 212, 0.5)' }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: job.status === 'completed' ? 'var(--safe)' : job.status === 'failed' ? 'var(--danger)' : 'var(--warn)' }}>
                              {job.status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>{job.summary}</td>
                      </tr>
                      {job.id && expandedJobs[job.id] && job.results && (
                        <tr>
                          <td colSpan="5" style={{ padding: '0' }}>
                            <div style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                              <table style={{ width: '100%', fontSize: '0.9rem', margin: 0 }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Email</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Verdict</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', color: 'var(--text-secondary)' }}>Score</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {job.results.map((r, i) => {
                                    if (!r) return null;
                                    const score = r.trustScore ?? 0;
                                    return (
                                      <tr key={i} style={{ background: 'transparent' }}>
                                        <td style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>{r.email || 'Unknown'}</td>
                                        <td style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', color: score >= 80 ? 'var(--safe)' : score >= 50 ? 'var(--warn)' : 'var(--danger)' }}>
                                          {r.verdict || 'Unknown'}
                                        </td>
                                        <td style={{ padding: '12px 24px', borderTop: '1px solid var(--border)' }}>{r.trustScore !== undefined ? `${r.trustScore} / 100` : 'N/A'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
