import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaUsers, FaSearch, FaExclamationTriangle, FaCommentDots, FaChartBar, FaHistory } from "react-icons/fa";
import axios from "axios";
import "./AdminPanel.css";

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [statsRes, feedbackRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/v1/admin/stats", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("http://127.0.0.1:8000/api/v1/feedback/", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setStats(statsRes.data);
        setFeedback(feedbackRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

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
        <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Platform metrics and user-reported intelligence logs.</p>
      </div>
      
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
            <h2>Scan Activity Metrics</h2>
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

      <section className="admin-feedback-section glass-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '35px' }}>
          <FaHistory style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
          <h2>Community Intelligence Logs</h2>
        </div>
        
        <div className="table-responsive">
          <table className="history-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Target URL</th>
                <th>Contributor Comment</th>
                <th>Discovery Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    No intelligence reports have been filed by the community yet.
                  </td>
                </tr>
              ) : (
                feedback.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.feedback_type === 'false_positive' ? 'danger' : 'safe'}`}>
                        {item.feedback_type === 'false_positive' ? 'FALSE POSITIVE' : 'MISSED THREAT'}
                      </span>
                    </td>
                    <td className="url-cell" title={item.scan?.url}>{item.scan?.url || 'N/A'}</td>
                    <td className="comment-cell">{item.comment}</td>
                    <td style={{ color: '#64748b' }}>{new Date(item.timestamp).toLocaleDateString()}</td>
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
