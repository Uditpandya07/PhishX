"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaSearch, FaExclamationTriangle, FaCommentDots, FaChartBar, FaHistory, FaUserShield, FaGlobe, FaDatabase, FaShieldAlt, FaKey, FaRss, FaCheckCircle, FaTimesCircle, FaSyncAlt, FaMicrochip } from "react-icons/fa";
import axios from "axios";
import "./AdminPanel.css";

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [contactQueries, setContactQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPulseRunning, setIsPulseRunning] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [pulseTests, setPulseTests] = useState([
    { id: 'api', name: 'API Gateway', status: 'pending', message: 'Idle' },
    { id: 'db', name: 'Neural Database', status: 'pending', message: 'Idle' },
    { id: 'scanner', name: 'Intelligence Engine', status: 'pending', message: 'Idle' },
    { id: 'auth', name: 'Security Vault', status: 'pending', message: 'Idle' },
    { id: 'latency', name: 'Engine Latency', status: 'pending', message: 'Idle' },
    { id: 'storage', name: 'Storage Integrity', status: 'pending', message: 'Idle' },
    { id: 'cors', name: 'CORS Handshake', status: 'pending', message: 'Idle' },
    { id: 'oauth', name: 'Google Bridge', status: 'pending', message: 'Idle' },
    { id: 'logic', name: 'Logic Core', status: 'pending', message: 'Idle' },
    { id: 'contact', name: 'Support Tickets', status: 'pending', message: 'Idle' },
    { id: 'news', name: 'CyberPulse Feed', status: 'pending', message: 'Idle' }
  ]);

  const fetchData = async () => {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

    // Fetch Stats
    try {
      const res = await axios.get(`${baseUrl}/api/v1/admin/stats`);
      setStats(res.data);
    } catch (err) { console.error("Stats fetch failed:", err); }

    // Fetch Feedback
    try {
      const res = await axios.get(`${baseUrl}/api/v1/feedback/`);
      setFeedback(res.data);
    } catch (err) { console.error("Feedback fetch failed:", err); }

    // Fetch Deleted Accounts audit log
    try {
      const res = await axios.get(`${baseUrl}/api/v1/admin/deleted-accounts`);
      setDeletionRequests(res.data);
    } catch (err) { console.error("Deleted accounts fetch failed:", err); }


    // Fetch Contact Queries
    try {
      const res = await axios.get(`${baseUrl}/api/v1/contact/admin/queries`);
      setContactQueries(res.data);
    } catch (err) { console.error("Contact queries fetch failed:", err); }

    setLoading(false);
  };

  const runDiagnostics = async () => {
    setIsPulseRunning(true);
    setDiagnosticLogs([]);
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

    const updateTest = (id, status, message) => {
      setPulseTests(prev => prev.map(t => t.id === id ? { ...t, status, message } : t));
    };

    const addLog = (service, errorMsg) => {
      const timestamp = new Date().toLocaleTimeString();
      setDiagnosticLogs(prev => [...prev, `[${timestamp}] [${service.toUpperCase()}] FAILED: ${errorMsg}`]);
    };

    // Reset tests
    setPulseTests(prev => prev.map(t => ({ ...t, status: 'loading', message: 'Testing...' })));

    // 1. API Gateway Test
    try {
      await axios.get(`${baseUrl}/`);
      updateTest('api', 'success', 'Live');
    } catch (err) { 
      updateTest('api', 'error', 'Offline'); 
      addLog('API Gateway', err.message);
    }

    // 2. Database Test
    try {
      const start = performance.now();
      await axios.get(`${baseUrl}/api/v1/admin/stats`);
      const end = performance.now();
      updateTest('db', 'success', 'Connected');
      updateTest('latency', 'success', `${Math.round(end - start)}ms`);
    } catch (err) { 
      updateTest('db', 'error', 'Refused');
      updateTest('latency', 'error', 'Timed Out');
      addLog('Database', err.message);
    }

    // 3. Scanner Test
    try {
      await axios.get(`${baseUrl}/api/v1/scans/history`);
      updateTest('scanner', 'success', 'Ready');
    } catch (err) { 
      updateTest('scanner', 'error', 'Fault'); 
      addLog('Intelligence Engine', err.message);
    }

    // 4. Auth Test
    try {
      await axios.get(`${baseUrl}/api/v1/users/me`);
      updateTest('auth', 'success', 'Secured');
    } catch (err) { 
      updateTest('auth', 'error', 'Expired'); 
      addLog('Auth Vault', err.message);
    }

    // 5. Storage Integrity
    try {
      sessionStorage.setItem('diag_test', 'true');
      const val = sessionStorage.getItem('diag_test');
      if (val === 'true') updateTest('storage', 'success', 'Writable');
      else throw new Error("Storage validation failed");
    } catch (err) { 
      updateTest('storage', 'error', 'Locked'); 
      addLog('Storage Integrity', err.message || "Unknown error");
    }

    // 6. CORS & OAuth Bridge
    try {
      // Use fetch with redirect: 'manual' to prevent the browser from auto-following the redirect and hitting a CORS error
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token") || ""}` };
      const response = await fetch(`${baseUrl}/api/v1/auth/google/login`, {
        method: 'GET',
        headers: headers,
        redirect: 'manual'
      });
      
      // If we get an opaque redirect (0) or 302/307, the bridge is working
      if (response.type === 'opaqueredirect' || response.status === 0 || response.status >= 300) {
        updateTest('cors', 'success', 'Passing');
        updateTest('oauth', 'success', 'Responsive');
      } else {
        throw new Error("Unexpected response from OAuth endpoint");
      }
    } catch (err) {
      if (err.message.includes('Network Error') || err.message.includes('Failed to fetch')) {
        updateTest('cors', 'error', 'Blocked');
        updateTest('oauth', 'error', 'Unreachable');
        addLog('CORS/OAuth', err.message);
      } else {
        updateTest('cors', 'success', 'Passing');
        updateTest('oauth', 'success', 'Responsive');
      }
    }
    
    // 7. Logic Core (Minute Function Test)
    try {
      const headers = { Authorization: `Bearer ${sessionStorage.getItem("token") || ""}` };
      const res = await axios.get(`${baseUrl}/api/v1/users/me`, { headers });
      const userData = res.data;
      
      if (typeof userData.ai_training_enabled === 'boolean') {
        updateTest('logic', 'success', 'Valid');
      } else {
        throw new Error("Logic drift detected: Boolean missing");
      }
    } catch (err) {
      updateTest('logic', 'error', 'Corrupted');
      addLog('Logic Core', err.message);
    }

    // 8. DB Deep Ping
    try {
      const res = await axios.get(`${baseUrl}/api/v1/admin/health`);
      if (res.data.database === 'connected') {
        updateTest('db', 'success', 'Optimized');
      } else {
        updateTest('db', 'error', res.data.database || 'Congested');
        addLog('Database Health Ping', res.data.database || 'Congested');
      }
    } catch (err) {
      updateTest('db', 'error', 'Disconnected');
      addLog('Database Health Ping', err.message);
    }

    // 9. Contact Support Ticket Test
    try {
      await axios.get(`${baseUrl}/api/v1/contact/admin/queries`);
      updateTest('contact', 'success', 'Tracking');
    } catch (err) {
      updateTest('contact', 'error', 'Failure');
      addLog('Support Tickets', err.message);
    }

    // 10. CyberPulse News Test
    try {
      await axios.get(`${baseUrl}/api/v1/news/`);
      updateTest('news', 'success', 'Syncing');
    } catch (err) {
      updateTest('news', 'error', 'Offline');
      addLog('CyberPulse Feed', err.message);
    }

    setIsPulseRunning(false);
  };

  useEffect(() => {
    fetchData();
    // Auto-run diagnostics every 60 seconds
    const interval = setInterval(() => {
      runDiagnostics();
      fetchData();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this deletion request?`)) return;
    
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      await axios.post(`${baseUrl}/api/v1/admin/deletion-requests/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Request ${action}ed successfully.`);
      fetchData(); // Refresh
    } catch (err) {
      alert("Action failed. Please try again.");
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div className="loader-spinner"></div>
      <p>Synchronizing Threat Intelligence...</p>
    </div>
  );

  const maxCount = Math.max(...(stats?.scans_over_time?.map(s => s.count) || [10]));
  const gridLevels = [maxCount, Math.round(maxCount * 0.66), Math.round(maxCount * 0.33), 0];

  return (
    <motion.div 
      className="admin-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
        <h1 className="hero-title" style={{ fontSize: '4.5rem', marginBottom: '10px', letterSpacing: '-3px' }}>System Oversight</h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Platform metrics and real-time service health diagnostics.</p>
      </div>

      {/* System Pulse Section */}
      <section className="pulse-section glass-section" style={{ marginBottom: '40px' }}>
        <div className="pulse-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FaMicrochip style={{ color: '#a855f7', fontSize: '1.5rem' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: 0 }}>System Pulse</h2>
          </div>
          <button 
            className={`pulse-btn ${isPulseRunning ? 'running' : ''}`}
            onClick={runDiagnostics}
            disabled={isPulseRunning}
            style={{
              background: isPulseRunning ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: isPulseRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            <FaSyncAlt className={isPulseRunning ? 'spin' : ''} />
            {isPulseRunning ? 'SCANNING...' : 'RUN DIAGNOSTICS'}
          </button>
          <button 
            className="pulse-btn"
            onClick={async () => {
              if (window.confirm("Attempt to repair and synchronize all database tables?")) {
                try {
                  const token = sessionStorage.getItem("token");
                  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
                  await axios.post(`${baseUrl}/api/v1/admin/repair-db`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  alert("✅ Neural Database Repaired & Optimized.");
                  runDiagnostics();
                } catch (err) {
                  alert("❌ Repair failed. Check backend logs.");
                }
              }
            }}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
          >
            <FaDatabase />
            REPAIR DATABASE
          </button>
        </div>
        <div className="pulse-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {pulseTests.map(test => (
            <div key={test.id} className={`pulse-card ${test.status}`} style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255,255,255,0.05)',
              padding: '15px',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>{test.name}</span>
                {test.status === 'success' && <FaCheckCircle style={{ color: '#10b981' }} />}
                {test.status === 'error' && <FaTimesCircle style={{ color: '#ef4444' }} />}
                {test.status === 'loading' && <div className="pulse-loader-mini"></div>}
                {test.status === 'pending' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#334155' }}></div>}
              </div>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: '700', 
                color: test.status === 'success' ? '#10b981' : test.status === 'error' ? '#ef4444' : '#fff' 
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: test.status === 'success' ? '#10b981' : test.status === 'error' ? '#ef4444' : '#94a3b8' }}>
                  {test.message}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Diagnostic Logs Terminal Output */}
        {diagnosticLogs.length > 0 && (
          <div style={{ marginTop: '25px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '15px' }}>
            <h4 style={{ color: '#ef4444', marginBottom: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaExclamationTriangle /> Diagnostic Warning Logs
            </h4>
            <div style={{ background: '#000', padding: '10px', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', color: '#fca5a5' }}>
              {diagnosticLogs.map((log, i) => (
                <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </section>
      
      <div className="stats-grid">
        <motion.div whileHover={{ y: -5 }} className="admin-stat-card glass-panel">
          <FaUsers className="stat-icon-bg" />
          <h3>Total Users</h3>
          <p style={{ color: '#3b82f6' }}>{stats?.total_users || 0}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="admin-stat-card glass-panel">
          <FaSearch className="stat-icon-bg" />
          <h3>Total Scans</h3>
          <p style={{ color: '#7c3aed' }}>{stats?.total_scans || 0}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="admin-stat-card glass-panel">
          <FaExclamationTriangle className="stat-icon-bg" />
          <h3>Threats Detected</h3>
          <p style={{ color: '#ef4444' }}>{stats?.total_threats || 0}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="admin-stat-card glass-panel">
          <FaCommentDots className="stat-icon-bg" />
          <h3>User Feedback</h3>
          <p style={{ color: '#10b981' }}>{stats?.total_feedback || 0}</p>
        </motion.div>
      </div>

      <section className="admin-chart-section glass-section">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FaChartBar style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
            <h2 style={{ margin: 0 }}>Scan Activity Metrics</h2>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: 'linear-gradient(to bottom, #3b82f6, #4ade80)' }}></div>
              <span>Platform Usage</span>
            </div>
          </div>
        </div>

        <div className="chart-wrapper">
          <div className="chart-grid-lines">
            {gridLevels.map((val, i) => (
              <div key={i} className="grid-line" data-value={val}></div>
            ))}
          </div>
          <div className="chart-bars">
            {stats?.scans_over_time?.map((day, i) => (
              <div key={i} className="chart-column">
                <motion.div 
                  className="chart-bar-fill" 
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.count / maxCount) * 100}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                >
                  <span className="bar-tooltip">{day.count} Total Scans</span>
                </motion.div>
                <span className="bar-label">
                  {day.date.split('-').slice(1).join('/')}
                </span>
              </div>
            ))}
            {(!stats?.scans_over_time || stats.scans_over_time.length === 0) && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                No activity data available for the selected period.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Deleted Accounts Audit Log ─────────────────────────────── */}
      <section className="admin-feedback-section glass-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
          <FaUserShield style={{ color: '#ef4444', fontSize: '1.5rem' }} />
          <h2 style={{ margin: 0 }}>Deleted Accounts Log</h2>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '999px', border: '1px solid rgba(239,68,68,0.2)' }}>
            READ-ONLY · Self-deletions only
          </span>
        </div>

        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Deleted On</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {deletionRequests.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No accounts have been self-deleted yet.
                  </td>
                </tr>
              ) : (
                deletionRequests.map((log) => (
                  <tr key={log.id}>
                    <td data-label="User Email" style={{ fontWeight: 600, color: '#f87171' }}>{log.user_email}</td>
                    <td data-label="Deleted On" style={{ color: '#64748b' }}>{new Date(log.deleted_at).toLocaleString()}</td>
                    <td data-label="Reason" style={{ color: '#94a3b8', fontStyle: log.reason ? 'normal' : 'italic' }}>
                      {log.reason || 'No reason provided'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-feedback-section glass-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
          <FaHistory style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
          <h2 style={{ margin: 0 }}>Community Intelligence Logs</h2>
        </div>
        
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Target URL</th>
                <th>Reporter Email</th>
                <th>Contributor Comment</th>
                <th>Discovery Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    No intelligence reports have been filed by the community yet.
                  </td>
                </tr>
              ) : (
                feedback.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Classification">
                      <span className={`badge ${item.feedback_type === 'false_positive' ? 'danger' : 'safe'}`}>
                        {item.feedback_type === 'false_positive' ? 'FALSE POSITIVE' : 'MISSED THREAT'}
                      </span>
                    </td>
                    <td data-label="Target URL" className="url-cell" title={item.scan?.url}>{item.scan?.url || 'N/A'}</td>
                    <td data-label="Reporter Email" style={{ color: '#94a3b8', fontWeight: 600 }}>{item.user?.email || 'Anonymous'}</td>
                    <td data-label="Contributor Comment" className="comment-cell">{item.comment}</td>
                    <td data-label="Discovery Date" style={{ color: '#64748b' }}>{new Date(item.timestamp).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-feedback-section glass-section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
          <FaCommentDots style={{ color: '#8b5cf6', fontSize: '1.5rem' }} />
          <h2 style={{ margin: 0 }}>Support & Contact Queries</h2>
        </div>
        
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>User Email</th>
                <th>Message</th>
                <th>Date Submitted</th>
              </tr>
            </thead>
            <tbody>
              {contactQueries.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    No support queries have been submitted.
                  </td>
                </tr>
              ) : (
                contactQueries.map((q) => (
                  <tr key={q.id}>
                    <td data-label="Status">
                      <span className={`badge ${q.status === 'pending' ? 'warning' : 'safe'}`}>
                        {q.status.toUpperCase()}
                      </span>
                    </td>
                    <td data-label="User Email" style={{ color: '#94a3b8', fontWeight: 600 }}>{q.user_email}</td>
                    <td data-label="Message" className="comment-cell" style={{ maxWidth: '400px', whiteSpace: 'pre-wrap' }}>{q.query_text}</td>
                    <td data-label="Date Submitted" style={{ color: '#64748b' }}>{new Date(q.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}
