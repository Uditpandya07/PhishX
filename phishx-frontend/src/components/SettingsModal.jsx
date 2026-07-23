"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaKey, FaUserShield, FaCopy, FaUser, FaLock, FaTrashAlt, FaEyeSlash, FaPlug } from "react-icons/fa";
import axios from "axios";
import Orb from "./Orb";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose, user, onClearHistory }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [slackWebhook, setSlackWebhook] = useState(user?.slack_webhook_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [toggleAI, setToggleAI] = useState(user?.ai_training_enabled ?? true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  if (!isOpen) return null;

  const handleToggleAI = async () => {
    setMessage(""); // Clear any old errors
    const newValue = !toggleAI;
    setToggleAI(newValue); // Optimistic update
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      await axios.put(`${baseUrl}/api/v1/users/me`, 
        { ai_training_enabled: newValue },
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );
      setMessage("✅ Settings updated successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setToggleAI(!newValue); // Revert on failure
      setMessage("❌ Failed to update privacy settings.");
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (password && password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      
      const updateData = { name, email };
      if (password) updateData.password = password;

      await axios.put(`${baseUrl}/api/v1/users/me`, 
        updateData,
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );
      setMessage("✅ Profile updated successfully!");
      setPassword("");
    } catch (err) {
      setMessage("❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      await axios.put(`${baseUrl}/api/v1/users/me`, 
        { slack_webhook_url: slackWebhook },
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );
      setMessage("✅ Webhook updated successfully!");
    } catch (err) {
      setMessage("❌ Failed to update webhook.");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      const res = await axios.post(`${baseUrl}/api/v1/users/api-keys`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setApiKey(res.data.key_value);
      setMessage("✅ API Key generated!");
    } catch (err) {
      setMessage("❌ Failed to generate API Key. " + (err.response?.data?.detail || ""));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you ABSOLUTELY sure? This will permanently delete your account, history, and active subscriptions. This cannot be undone.")) {
      return;
    }
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      await axios.delete(`${baseUrl}/api/v1/users/me`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      alert("Your account has been deleted.");
      sessionStorage.removeItem("token");
      window.location.reload();
    } catch (err) {
      setMessage("❌ Failed to delete account. " + (err.response?.data?.detail || ""));
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
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: '#040712' }}>
        <Orb
          hue={0.25} 
          hoverIntensity={0.6}
          rotateOnHover={true}
          backgroundColor="#040712"
        />
      </div>
      
      <div className="modal-content glass-panel settings-panel sidebar-layout" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        
        {/* SIDEBAR */}
        <div className="settings-sidebar">
          <h2 className="modal-title">Settings</h2>
          
          <div className="profile-summary">
            <div className="user-avatar">
              {user?.name?.[0]?.toUpperCase() || <FaUser />}
            </div>
            <div className="user-info">
              <h3>{user?.name || "Member"}</h3>
              <span className={`tier-badge ${user?.subscription_tier}`}>
                {user?.subscription_tier?.toUpperCase() || "FREE"} TIER
              </span>
            </div>
          </div>
          
          <div className="settings-tabs">
            <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
              <FaUserShield /> Profile & Security
            </button>
            <button className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
              <FaKey /> Developer API
            </button>
            <button className={`tab-btn ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
              <FaPlug /> Integrations
            </button>
            <button className={`tab-btn ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
              <FaEyeSlash /> Privacy & Data
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="settings-content-pane">
          {message && <div className="settings-msg">{message}</div>}

          {activeTab === 'profile' && (
            <div className="pane-inner">
              <h3>Profile & Security</h3>
              <p className="pane-subtitle">Manage your personal information and account security.</p>
              
              <form onSubmit={handleProfileUpdate} className="auth-form">
                <div className="input-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    placeholder="name@company.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label>New Password (Optional)</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? "Updating..." : "Save Changes"}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="pane-inner">
              <h3>Developer API</h3>
              <p className="pane-subtitle">
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
                <button className="primary-btn" onClick={generateApiKey} disabled={loading}>
                  {loading ? "Generating..." : "Generate New API Key"}
                </button>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="pane-inner">
              <h3>Integrations</h3>
              <p className="pane-subtitle">
                Enter your Slack or Teams webhook URL to receive instant alerts when high-risk phishing URLs are detected.
              </p>
              
              <form onSubmit={handleWebhookUpdate} className="auth-form">
                <div className="input-group">
                  <label>Webhook URL</label>
                  <input 
                    type="url" 
                    placeholder="https://hooks.slack.com/services/..." 
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="primary-btn" disabled={loading}>
                  {loading ? "Saving..." : "Save Webhook"}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="pane-inner">
              <h3>Privacy & Data</h3>
              <p className="pane-subtitle">Manage how your data is used and stored on our servers.</p>
              
              <div className="privacy-item glass-panel" style={{ padding: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>AI Training Data</h4>
                  <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Help improve PhishX by sharing anonymized scan patterns.</p>
                </div>
                <div 
                  className={`toggle-switch ${toggleAI ? 'active' : ''}`} 
                  onClick={handleToggleAI}
                  style={{ 
                    width: '50px', 
                    height: '26px', 
                    background: toggleAI ? 'linear-gradient(135deg, #95fb40 0%, #22c55e 100%)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '20px', 
                    position: 'relative', 
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: toggleAI ? 'none' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    left: toggleAI ? '26px' : '3px', 
                    top: '3px', 
                    width: '20px', 
                    height: '20px', 
                    background: '#fff', 
                    borderRadius: '50%',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}></div>
                </div>
              </div>

              <div className="settings-action-box" style={{ marginBottom: '40px' }}>
                <button 
                  className="secondary-btn" 
                  onClick={handleClearHistory} 
                  disabled={loading}
                  style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  <FaTrashAlt /> Clear Scan History
                </button>
              </div>

              {!user?.is_superuser && (
                <div className="danger-zone" style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '25px' }}>
                  <h4 style={{ color: '#ef4444', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '700' }}>Danger Zone</h4>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' }}>
                    Warning: Deleting your account is permanent and cannot be undone. All your scan history and data will be erased immediately.
                  </p>
                  <button 
                    className="danger-btn" 
                    onClick={async () => {
                      if (window.confirm("Are you absolutely sure? This will IMMEDIATELY and PERMANENTLY delete your account and all associated data. This cannot be undone.")) {
                        setLoading(true);
                        try {
                          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
                          const token = sessionStorage.getItem("token");
                          await axios.delete(`${baseUrl}/api/v1/users/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          // Account is gone — clear session and redirect
                          sessionStorage.removeItem("token");
                          window.location.href = "/";
                        } catch (err) {
                          setMessage("❌ Failed to delete account. Please contact support@phishx.com");
                          setLoading(false);
                        }
                      }
                    }}
                    disabled={loading}
                    style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)' }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                  >
                    {loading ? "Deleting..." : "Delete Account & All Data"}
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
