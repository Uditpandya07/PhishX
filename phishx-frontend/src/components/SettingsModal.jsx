"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaKey, FaUserShield, FaCopy, FaUser, FaLock, FaTrashAlt, FaEye, FaEyeSlash, FaPlug, FaCreditCard, FaCrown, FaExternalLinkAlt, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import axios from "axios";
import Orb from "./Orb";
import AlertSettings from "./AlertSettings";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose, user, onClearHistory }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [slackWebhook, setSlackWebhook] = useState(user?.slack_webhook_url || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ text: "", isError: false });

  const [toggleAI, setToggleAI] = useState(user?.ai_training_enabled ?? true);
  const [subDetails, setSubDetails] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeTab === "subscription" && user?.subscription_tier && user.subscription_tier !== "free") {
      const fetchSubDetails = async () => {
        setLoading(true);
        try {
          const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
          const token = sessionStorage.getItem("token");
          const res = await axios.get(`${baseUrl}/api/v1/payments/subscription`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          setSubDetails(res.data);
        } catch (err) {
          console.error("Failed to fetch subscription details:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchSubDetails();
    }
  }, [activeTab, user]);

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

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? This action cannot be undone.")) return;
    
    setPortalLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      await axios.post(`${baseUrl}/api/v1/payments/cancel-subscription`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMessage("✅ Subscription cancelled successfully. Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
      setMessage("❌ Failed to cancel subscription.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      
      const updateData = { name, email };

      await axios.put(`${baseUrl}/api/v1/users/me`, 
        updateData,
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage("❌ Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    setPasswordMsg({ text: "", isError: false });
    
    if (!oldPassword) {
      const errText = "❌ Please enter your current password.";
      setMessage(errText);
      setPasswordMsg({ text: errText, isError: true });
      return;
    }
    if (newPassword.length < 8) {
      const errText = "❌ Password must be at least 8 characters long.";
      setMessage(errText);
      setPasswordMsg({ text: errText, isError: true });
      return;
    }
    if (!/\d/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      const errText = "❌ New password must meet all security requirements.";
      setMessage(errText);
      setPasswordMsg({ text: errText, isError: true });
      return;
    }
    if (newPassword !== confirmPassword) {
      const errText = "❌ New password and confirmation do not match.";
      setMessage(errText);
      setPasswordMsg({ text: errText, isError: true });
      return;
    }
    
    setPasswordLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      const token = sessionStorage.getItem("token");
      
      await axios.put(`${baseUrl}/api/v1/users/me`, 
        { old_password: oldPassword, password: newPassword },
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {} 
        }
      );
      const successText = "🔒 Password changed successfully! Your account is secure.";
      setMessage(successText);
      setPasswordMsg({ text: successText, isError: false });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setMessage("");
        setPasswordMsg({ text: "", isError: false });
      }, 6000);
    } catch (err) {
      const errText = "❌ " + (err.response?.data?.detail || "Failed to change password. Please verify your current password.");
      setMessage(errText);
      setPasswordMsg({ text: errText, isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = user?.email || email;
    if (!targetEmail) {
      setMessage("❌ Please enter an email address to send the reset link to.");
      return;
    }
    setForgotLoading(true);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
      await axios.post(`${baseUrl}/api/v1/auth/forgot-password`, { email: targetEmail });
      setMessage(`📧 Password reset instructions have been sent to ${targetEmail}!`);
      setTimeout(() => setMessage(""), 6000);
    } catch (err) {
      setMessage("❌ Failed to send reset email. Please try again later.");
    } finally {
      setForgotLoading(false);
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
            <button className={`tab-btn ${activeTab === 'subscription' ? 'active' : ''}`} onClick={() => setActiveTab('subscription')}>
              <FaCreditCard /> Subscription & Billing
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="settings-content-pane">
          {message && <div className="settings-msg">{message}</div>}

          {activeTab === 'profile' && (
            <div className="pane-inner">
              <h3>Profile & Security</h3>
              <p className="pane-subtitle">Manage your personal information and account authentication.</p>
              
              {/* Profile Information Card */}
              <div className="settings-card glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.4)', marginBottom: '30px' }}>
                <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUser style={{ color: '#95fb40', fontSize: '1rem' }} /> Profile Information
                </h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
                  Update your account's profile identity and primary email address.
                </p>
                <form onSubmit={handleProfileUpdate} className="auth-form" style={{ maxWidth: '100%' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button type="submit" className="primary-btn" disabled={loading} style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                      {loading ? "Saving..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password & Authentication Card */}
              <div className="settings-card glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.4)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <h4 style={{ color: '#fff', margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaLock style={{ color: '#95fb40', fontSize: '1rem' }} /> Change Password
                  </h4>
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={forgotLoading}
                    style={{ background: 'transparent', border: 'none', color: '#95fb40', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', padding: '4px 8px', borderRadius: '6px', transition: 'all 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(149, 251, 64, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FaEnvelope style={{ fontSize: '0.8rem' }} /> {forgotLoading ? "Sending Reset Link..." : "Forgot Current Password?"}
                  </button>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 24px 0' }}>
                  Ensure your account uses a long, random password to stay secure across all sessions.
                </p>
                
                <form onSubmit={handlePasswordUpdate} className="auth-form" style={{ maxWidth: '100%', gap: '20px' }}>
                  <div className="input-group">
                    <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Current Password</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showOldPassword ? "text" : "password"} 
                        placeholder="Enter current password" 
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        disabled={passwordLoading}
                        style={{ paddingRight: '44px' }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="input-group">
                      <label>New Password</label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="Enter new password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={passwordLoading}
                          style={{ paddingRight: '44px' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Confirm New Password</span>
                        {confirmPassword && (
                          <span style={{ fontSize: '0.75rem', color: newPassword === confirmPassword ? '#4ade80' : '#ef4444', fontWeight: '600' }}>
                            {newPassword === confirmPassword ? '✓ Passwords match' : '⚠️ Do not match'}
                          </span>
                        )}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Re-enter new password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={passwordLoading}
                          style={{ paddingRight: '44px', borderColor: confirmPassword ? (newPassword === confirmPassword ? '#22c55e' : '#ef4444') : undefined }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements Indicator */}
                  {newPassword.length > 0 && (
                    <div style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 16px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Password Requirements:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: newPassword.length >= 8 ? '#4ade80' : '#64748b' }}>
                          <FaCheckCircle style={{ opacity: newPassword.length >= 8 ? 1 : 0.3 }} /> 8+ Characters
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: /\d/.test(newPassword) ? '#4ade80' : '#64748b' }}>
                          <FaCheckCircle style={{ opacity: /\d/.test(newPassword) ? 1 : 0.3 }} /> At least 1 Number (0-9)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: /[A-Z]/.test(newPassword) ? '#4ade80' : '#64748b' }}>
                          <FaCheckCircle style={{ opacity: /[A-Z]/.test(newPassword) ? 1 : 0.3 }} /> 1 Uppercase Letter (A-Z)
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? '#4ade80' : '#64748b' }}>
                          <FaCheckCircle style={{ opacity: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) ? 1 : 0.3 }} /> 1 Special Symbol (!@#$%)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Immediate Password Feedback Notification */}
                  {passwordMsg.text && (
                    <div style={{ 
                      padding: '12px 16px', 
                      borderRadius: '12px', 
                      fontSize: '0.9rem', 
                      fontWeight: '600',
                      background: passwordMsg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)', 
                      border: `1px solid ${passwordMsg.isError ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.35)'}`, 
                      color: passwordMsg.isError ? '#f87171' : '#4ade80',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '6px'
                    }}>
                      {passwordMsg.text}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <button 
                      type="submit" 
                      className="primary-btn" 
                      disabled={passwordLoading || !newPassword || !oldPassword || newPassword !== confirmPassword} 
                      style={{ padding: '12px 24px', fontSize: '0.95rem', opacity: (!newPassword || !oldPassword || newPassword !== confirmPassword) ? 0.6 : 1 }}
                    >
                      {passwordLoading ? "Updating Password..." : "Update Security Password"}
                    </button>
                  </div>
                </form>
              </div>
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
              <AlertSettings user={user} triggerNotification={setMessage} />
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

          {activeTab === 'subscription' && (
            <div className="pane-inner">
              <h3>Subscription & Billing</h3>
              <p className="pane-subtitle">Manage your premium plan, billing cycle, and invoices.</p>
              
              <div className="subscription-card glass-panel" style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.3)', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h4 style={{ color: '#fff', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      PhishX {user?.subscription_tier?.toUpperCase() || "FREE"}
                      {user?.subscription_tier && user?.subscription_tier !== "free" && <FaCrown style={{ color: '#ffd700' }} />}
                    </h4>
                    <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                      Status: <span style={{ color: user?.subscription_tier && user.subscription_tier !== 'free' ? '#4ade80' : '#94a3b8', fontWeight: 'bold' }}>
                        {user?.subscription_tier && user.subscription_tier !== 'free' ? '● Active' : 'Free Tier'}
                      </span>
                    </p>
                  </div>
                  {user?.subscription_tier && user.subscription_tier !== "free" && subDetails?.has_subscription && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>
                        {subDetails?.currency === 'INR' ? '₹' : '$'}{(subDetails?.amount || 0) / 100}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}> / month</span>
                    </div>
                  )}
                  {user?.subscription_tier && user.subscription_tier !== "free" && !subDetails?.has_subscription && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#4ade80', fontSize: '1rem', fontWeight: 'bold' }}>Legacy Lifetime Plan</span>
                    </div>
                  )}
                </div>

                {user?.subscription_tier && user.subscription_tier !== "free" ? (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: '0.9rem', marginBottom: '25px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Next Renewal Date</span>
                        <strong style={{ color: '#e2e8f0' }}>{subDetails?.next_billing_date || "Loading..."}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Razorpay Customer ID</span>
                        <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{user?.razorpay_customer_id || "None"}</code>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Payment Frequency</span>
                        <strong style={{ color: '#e2e8f0' }}>{subDetails?.has_subscription ? 'Monthly' : 'One-time (Legacy)'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subscription ID</span>
                        <code style={{ color: '#e2e8f0', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{subDetails?.has_subscription ? (subDetails?.subscription_id || "Loading...") : "N/A"}</code>
                      </div>
                    </div>

                    {subDetails?.has_subscription ? (
                      <button 
                        className="primary-btn"
                        disabled={portalLoading || subDetails?.status === "cancelled"}
                        onClick={handleCancelSubscription}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                      >
                        {portalLoading ? "Cancelling..." : <>Cancel Subscription <FaTimes style={{ fontSize: '0.8rem' }} /></>}
                      </button>
                    ) : (
                      <button 
                        className="primary-btn"
                        disabled={true}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.2)', cursor: 'default' }}
                      >
                        <FaCheckCircle style={{ fontSize: '0.9rem' }} /> Legacy Plan Active
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '20px' }}>
                      Get access to advanced AI risk insights, automated Slack/email notifications, and unlimited API keys.
                    </p>
                    <button 
                      className="primary-btn" 
                      onClick={() => {
                        onClose();
                        window.location.hash = "pricing";
                      }}
                    >
                      Upgrade Protection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
