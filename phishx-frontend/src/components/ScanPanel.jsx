import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle, FaSearch, FaCode, FaBrain, FaShieldAlt, FaCheckCircle, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { API_URL, isConfigured } from "../config";
import ElectricBorder from "./ElectricBorder";
import "./ScanPanel.css";

export default function ScanPanel({ isLoggedIn, onAuthRequired, onScanComplete }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isError, setIsError] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [activeFeedbackType, setActiveFeedbackType] = useState(null);

  const getThreatIndicators = (features) => {
    if (!features || !features.extracted_features) return [];
    const f = features.extracted_features;
    const indicators = [];
    
    if (f[14] === 1) indicators.push("Suspicious Redirection (//)");
    if (f[6] === 1) indicators.push("Direct IP Access");
    if (f[3] > 0) indicators.push("@ Symbol Trick");
    if (f[10] === 1) indicators.push("Unreliable TLD (.xyz, .tk, etc.)");
    if (f[13] === 1) indicators.push("URL Shortener Detected");
    if (f[8] > 2) indicators.push("High Keyword Suspicion");
    if (f[0] > 100) indicators.push("Abnormally Long URL");
    if (f[5] === 0) indicators.push("Missing HTTPS");
    
    return indicators;
  };

  const scan = async () => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    // 🔥 THE 100% FREEZE-PROOF REGEX
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|localhost|\d{1,3}(\.\d{1,3}){3})(:\d+)?(\/.*)?$/;
    
    const isValid = urlPattern.test(url.trim());

    if (!url.trim() || !isValid) {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      return;
    }

    setLoading(true);
    setScanProgress(0);
    setResult(null);
    setFeedbackSent(false);
    setShowFeedbackInput(false);
    setFeedbackComment("");

    // Simulate progress while scanning
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return next;
      });
    }, 200);

    try {
      const token = sessionStorage.getItem("token");

      if (!isConfigured) {
        clearInterval(progressInterval);
        setLoading(false);
        setScanProgress(0);
        alert("The PhishX backend URL is not configured. Please contact the administrator.");
        return;
      }

      const res = await axios.post(`${API_URL}/api/v1/scans/predict`, { 
        url: url.trim() 
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setTimeout(() => {
        setResult(res.data);
        const risk = Math.round(res.data.risk_score);
        const isDanger = risk >= 70;
        
        const newHistoryItem = {
          id: res.data.id || Date.now(),
          url: url.trim(),
          date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
          risk: risk,
          status: isDanger ? "Phishing" : "Safe"
        };

        if (onScanComplete) onScanComplete(newHistoryItem);
        setLoading(false);
      }, 500);

    } catch (err) {
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setTimeout(() => {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("Backend failed:", errorMsg);
        setLoading(false);
        setScanProgress(0);
        // Show the actual error so we know why it's failing
        alert(`Deep Analysis Engine Error: ${errorMsg}`);
      }, 500);
    }
  };

  const submitFeedback = async () => {
    if (!result || !result.id) {
      console.warn("Feedback failed: Scan result has no database ID (likely a simulated result).");
      alert("Cannot report results from simulated scans. Please ensure your backend is connected and you are logged in.");
      return;
    }
    setFeedbackLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/feedback/`, {
        scan_id: result.id,
        feedback_type: activeFeedbackType,
        comment: feedbackComment || "Submitted via Quick Action"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbackSent(true);
      setShowFeedbackInput(false);
    } catch (err) {
      console.error("Failed to submit feedback", err);
      alert("Failed to submit report. Please check your connection.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const risk = result ? Math.round(result.risk_score) : 0;
  const isDanger = risk > 50;

  return (
    <div className={`scan-section-container ${isError ? "shake" : ""}`}>
      <ElectricBorder
        color={isError ? "#ef4444" : "#4ade80"}
        speed={2}
        chaos={0.25}
        borderRadius={24}
      >
        <div className="scan-card">
          <h2>Scan URL</h2>
          <div className="input-group">
            <div className="input-relative-wrapper">
              <input
                className="large-input"
                type="text"
                placeholder="https://example.com or localhost:5173"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") scan(); }}
                disabled={loading}
              />
              {url && !loading && (
                <FaTimesCircle 
                  className="clear-icon-inner" 
                  onClick={() => setUrl("")} 
                />
              )}
            </div>
            <button className="large-button" onClick={scan} disabled={loading}>
              {loading ? `Scanning... ${scanProgress}%` : "Scan Now"}
            </button>
          </div>

          {loading && (
            <motion.div 
              className="loading-progress-container"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="scanner-hud">
                <div className="hud-header">
                  <span className="pulse-dot"></span>
                  <span className="hud-title">SYSTEM ANALYSIS IN PROGRESS</span>
                  <span className="hud-progress">{scanProgress}%</span>
                </div>
                
                <div className="loading-bar-track">
                  <motion.div 
                    className="loading-bar-fill glow"
                    style={{ width: `${scanProgress}%` }}
                    layout
                  ></motion.div>
                </div>
                
                <div className="scan-steps-container">
                  {[
                    { t: 0, text: "Initializing Deep Lexical Analysis...", icon: <FaSearch /> },
                    { t: 20, text: "Extracting semantic features & domain metrics...", icon: <FaCode /> },
                    { t: 45, text: "Running AI neural network models...", icon: <FaBrain /> },
                    { t: 70, text: "Cross-referencing global threat intelligence...", icon: <FaShieldAlt /> },
                    { t: 90, text: "Finalizing security risk score...", icon: <FaCheckCircle /> }
                  ].map((step, idx) => {
                    const isDone = scanProgress > step.t + 15;
                    const isActive = scanProgress >= step.t && !isDone;
                    return (
                    <motion.div 
                      key={idx}
                      className={`scan-step ${scanProgress >= step.t ? 'active' : 'pending'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={scanProgress >= step.t ? { opacity: 1, x: 0 } : { opacity: 0.3, x: -10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className={`step-icon ${isActive ? 'spin-icon' : ''}`}>
                        {isActive ? <FaSpinner /> : step.icon}
                      </span>
                      <span className="step-text">{step.text}</span>
                    </motion.div>
                  )})}
                </div>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              className={`result ${isDanger ? "danger" : "safe"}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h3 className="result-title">
                {isDanger ? "🚨 High Risk URL" : "✅ Safe URL"}
              </h3>
              <div className="risk-meter">
                <div className="risk-label">Risk Level: {risk}%</div>
                <div className="risk-bar-container">
                  <div 
                    className={`risk-bar ${isDanger ? "danger-fill" : "safe-fill"}`} 
                    style={{ width: `${risk}%` }}
                  ></div>
                </div>
              </div>

              {isDanger && (
                <div className="threat-indicators">
                  <h4>Threat Indicators Found:</h4>
                  <div className="indicator-tags">
                    {getThreatIndicators(result.features_json).map((text, i) => (
                      <span key={i} className="indicator-tag">🚩 {text}</span>
                    ))}
                    {getThreatIndicators(result.features_json).length === 0 && (
                      <span className="indicator-tag gray">Pattern Anomaly</span>
                    )}
                  </div>
                </div>
              )}

              {/* FEEDBACK SECTION */}
              {isLoggedIn && (
                <div className="feedback-section" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  {!feedbackSent ? (
                    <div className="feedback-flow">
                      {!showFeedbackInput ? (
                        <button 
                          className="feedback-btn text-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '8px', color: '#ccc' }}
                          onClick={() => {
                            setActiveFeedbackType(isDanger ? "false_positive" : "false_negative");
                            setShowFeedbackInput(true);
                          }}
                        >
                          {isDanger ? "🚨 Report False Positive" : "🛡️ Report Missed Threat"}
                        </button>
                      ) : (
                        <motion.div 
                          className="feedback-input-wrapper"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                        >
                          <textarea 
                            className="feedback-textarea"
                            placeholder="Why is this classification incorrect? (optional)"
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                            style={{ 
                              width: '100%', 
                              background: 'rgba(0,0,0,0.3)', 
                              border: '1px solid rgba(255,255,255,0.1)', 
                              borderRadius: '8px', 
                              padding: '10px', 
                              color: 'white',
                              fontSize: '0.9rem',
                              resize: 'none',
                              marginBottom: '10px',
                              height: '80px'
                            }}
                          />
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button 
                              className="confirm-feedback-btn"
                              style={{ background: '#3b82f6', border: 'none', padding: '0.4rem 1.2rem', borderRadius: '6px', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                              onClick={submitFeedback}
                              disabled={feedbackLoading}
                            >
                              {feedbackLoading ? "Submitting..." : "Confirm Report"}
                            </button>
                            <button 
                              className="cancel-feedback-btn"
                              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '0.4rem 1rem', borderRadius: '6px', color: '#94a3b8', cursor: 'pointer' }}
                              onClick={() => setShowFeedbackInput(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <motion.span 
                      className="feedback-success" 
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: '700' }}
                    >
                      ✅ Intelligence Logged. Thank you for contributing!
                    </motion.span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </ElectricBorder>
    </div>
  );
}