import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaLock, FaBell, FaSlack, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import { showErrorPopup } from '../utils/errorHandler';

export default function AlertSettings({ user, triggerNotification }) {
  const isPremium = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';
  const [emailAlerts, setEmailAlerts] = useState(user?.alert_preferences?.email || false);
  const [webhookUrl, setWebhookUrl] = useState(user?.alert_preferences?.webhook_url || '');

  const handleSave = async () => {
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${API_URL}/api/v1/users/alerts`, {
        email: emailAlerts,
        webhook_url: webhookUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerNotification("Alert preferences saved!");
    } catch (err) {
      showErrorPopup("Failed to save alerts.");
    }
  };

  if (!isPremium) {
    return (
      <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', marginTop: '20px' }}>
        <FaLock style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '10px' }} />
        <h3 style={{ margin: '0 0 10px' }}>Automated Alerts (Pro Feature)</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Upgrade to Pro to receive instant email or Slack webhook notifications when malicious URLs are detected.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel" 
      style={{ padding: '20px', marginTop: '20px', borderLeft: '4px solid #4ade80' }}
    >
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
        <FaBell style={{ color: '#4ade80' }} /> Alert Settings
      </h3>
      
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={emailAlerts} 
            onChange={(e) => setEmailAlerts(e.target.checked)} 
            style={{ width: '18px', height: '18px' }}
          />
          <span><FaEnvelope /> Email Notifications</span>
        </label>
        
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <FaSlack /> Slack Webhook URL
          </label>
          <input 
            type="text" 
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
        </div>

        <button 
          onClick={handleSave}
          style={{ background: '#4ade80', color: '#0f172a', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
        >
          Save Preferences
        </button>
      </div>
    </motion.div>
  );
}
