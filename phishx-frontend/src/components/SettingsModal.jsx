import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaKey, FaUserShield, FaCopy, FaUser, FaLock, FaTrashAlt, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose, user, onClearHistory }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [toggleAI, setToggleAI] = useState(user?.ai_training_enabled ?? true);

  if (!isOpen) return null;

  const handleToggleAI = async () => {
    setMessage(""); // Clear any old errors
    const newValue = !toggleAI;
    setToggleAI(newValue); // Optimistic update
    try {
      const token = sessionStorage.getItem("token");
      await axios.put("http://127.0.0.1:8000/api/v1/users/me", 
        { ai_training_enabled: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Settings updated successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setToggleAI(!newValue); // Revert on failure
      setMessage("❌ Failed to update privacy settings.");
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.put("http://127.0.0.1:8000/api/v1/users/me", 
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("✅ Password updated successfully!");
      setPassword("");
    } catch (err) {
      setMessage("❌ Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post("http://127.0.0.1:8000/api/v1/users/api-keys", {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApiKey(res.data.key_value);
      setMessage("✅ API Key generated!");
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.detail || "Failed to generate API key."}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearHistory = () => {
    if (!window.confirm("This will clear the history from your view. Proceed?")) return;
    
    onClearHistory();
    setMessage("✅ History cleared!");
  };

  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel settings-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        
        <h2 className="modal-title">Account Settings</h2>

        <div className="profile-summary glass-panel">
          <div className="user-avatar">
            {user?.name?.[0]?.toUpperCase() || <FaUser />}
          </div>
          <div className="user-info">
            <h3>{user?.name || "Member"}</h3>
            <p>{user?.email}</p>
            <span className={`tier-badge ${user?.subscription_tier}`}>
              {user?.subscription_tier?.toUpperCase() || "FREE"} TIER
            </span>
            <p className="member-since">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="settings-tabs">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <FaUserShield /> Security
          </button>
          <button className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
            <FaKey /> Developer API
          </button>
          <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <FaEyeSlash /> Privacy & Data
          </button>
        </div>

        <div className="settings-body">
          {message && <div className="settings-msg">{message}</div>}

          {activeTab === 'profile' && (
            <form onSubmit={handlePasswordUpdate} className="auth-form">
              <div className="input-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="primary-btn" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {activeTab === 'api' && (
            <div className="api-section">
              <p style={{color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem'}}>
                Generate a secret API key to integrate PhishX scanning into your own applications.
              </p>
              
              {apiKey ? (
                <div className="api-key-display">
                  <div className="api-key-box">{apiKey}</div>
                  <button className="copy-btn" onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setMessage("✅ Copied to clipboard!");
                  }}>
                    <FaCopy /> Copy
                  </button>
                  <p className="warning-text">Make sure to copy your API key now. You won't be able to see it again!</p>
                </div>
              ) : (
                <button className="primary-btn" onClick={generateApiKey} disabled={loading} style={{ width: "100%" }}>
                  {loading ? "Generating..." : "Generate New API Key"}
                </button>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="privacy-section">
              <div className="privacy-item glass-panel" style={{ padding: '15px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem' }}>AI Training Data</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Help improve PhishX by sharing anonymized scan patterns.</p>
                </div>
                <div 
                  className={`toggle-switch ${toggleAI ? 'active' : ''}`} 
                  onClick={handleToggleAI}
                  style={{ 
                    width: '44px', 
                    height: '22px', 
                    background: toggleAI ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '20px', 
                    position: 'relative', 
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: toggleAI ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    left: toggleAI ? '24px' : '3px', 
                    top: '3px', 
                    width: '16px', 
                    height: '16px', 
                    background: '#fff', 
                    borderRadius: '50%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}></div>
                </div>
              </div>

              <div className="settings-action-box">
                <button 
                  className="secondary-btn" 
                  onClick={handleClearHistory} 
                  disabled={loading}
                  style={{ width: '100%', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <FaTrashAlt /> Clear Scan History
                </button>
              </div>

              {!user?.is_superuser && (
                <div className="danger-zone" style={{ marginTop: '30px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '20px' }}>
                  <h4 style={{ color: '#ef4444', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '15px' }}>Danger Zone</h4>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '15px' }}>
                    Warning: Deleting your account is permanent and cannot be undone.
                  </p>
                  <button 
                    className="danger-btn" 
                    onClick={async () => {
                      if (window.confirm("Are you sure? This will send a permanent deletion request for your account and all associated data.")) {
                        setLoading(true);
                        try {
                          const token = sessionStorage.getItem("token");
                          await axios.post("http://127.0.0.1:8000/api/v1/users/delete-request", {}, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setMessage("✅ Deletion request sent. Our team will process it within 24 hours.");
                        } catch (err) {
                          setMessage("❌ Failed to send request. Please contact support@phishx.com");
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}
                  >
                    {loading ? "Processing..." : "Delete Account & All Data"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
