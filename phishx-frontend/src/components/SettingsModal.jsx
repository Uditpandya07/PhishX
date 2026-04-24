import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaKey, FaUserShield, FaCopy, FaUser, FaLock } from "react-icons/fa";
import axios from "axios";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose, user }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
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
      const token = localStorage.getItem("token");
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
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
