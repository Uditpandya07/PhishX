"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle, FaSearch, FaCode, FaBrain, FaShieldAlt, FaCheckCircle, FaSpinner, FaRobot } from "react-icons/fa";
import { FiAlertTriangle, FiCheckCircle as FiCheckCircleIcon, FiShield, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { API_URL, isConfigured } from "../config";
import ElectricBorder from "./ElectricBorder";
import "./ScanPanel.css";

const TypewriterText = ({ text, speed = 30, onNavigate }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const textRef = useRef(text);
  const currentIndex = useRef(0);

  useEffect(() => {
    // Reset state if text changes
    setDisplayedText("");
    setIsTyping(true);
    currentIndex.current = 0;
    textRef.current = text;
    
    if (!text) return;

    const interval = setInterval(() => {
      if (currentIndex.current < textRef.current.length) {
        const char = textRef.current[currentIndex.current];
        if (char !== undefined) {
          setDisplayedText(prev => prev + char);
        }
        currentIndex.current += 1;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const renderText = (rawText) => {
    const policyUrl = "https://phishx-app.vercel.app/legal";
    const allowedPolicyUrl = new URL(policyUrl);
    const urlRegex = /https?:\/\/[^\s]+/g;
    const matches = rawText.match(urlRegex);

    if (matches) {
      for (const candidate of matches) {
        try {
          const parsed = new URL(candidate);
          const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
          const allowedPath = allowedPolicyUrl.pathname.replace(/\/+$/, "") || "/";

          if (parsed.origin === allowedPolicyUrl.origin && normalizedPath === allowedPath) {
            const parts = rawText.split(candidate);
            return (
              <>
                {parts[0]}
                <a href="#privacy" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('privacy'); }} style={{ color: '#60a5fa', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</a>
                {parts.slice(1).join(candidate)}
              </>
            );
          }
        } catch {
          // Ignore invalid URL candidates
        }
      }
    }
    return rawText;
  };

  return (
    <span>
      {renderText(displayedText)}
      {isTyping && <span className="blinking-cursor" style={{ opacity: 1, animation: 'blink 1s step-end infinite' }}>|</span>}
    </span>
  );
};

export default function ScanPanel({ isLoggedIn, onAuthRequired, onScanComplete, onNavigate }) {
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

  const scan = async () => {
    if (!isLoggedIn) {
      const freeScansUsed = parseInt(localStorage.getItem("freeScansUsed") || "0", 10);
      if (freeScansUsed >= 1) {
        onAuthRequired();
        return;
      }
      localStorage.setItem("freeScansUsed", (freeScansUsed + 1).toString());
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

    try {
      const token = sessionStorage.getItem("token");

      if (!isConfigured) {
        setLoading(false);
        setScanProgress(0);
        alert("The PhishX backend URL is not configured. Please contact the administrator.");
        return;
      }

      const res = await axios.post(`${API_URL}/api/v1/scans/predict`, { 
        url: url.trim() 
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      const taskId = res.data.task_id;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendDomain = API_URL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}//${backendDomain}/api/v1/ws/scans/${taskId}`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.progress) {
            setScanProgress(data.progress);
        }
        
        if (data.status === 'COMPLETED') {
          ws.close();
          setScanProgress(100);
          
          setTimeout(() => {
            if (data.result && data.result.error) {
              console.error("Backend task completed with error result:", data.result.error);
              setLoading(false);
              setScanProgress(0);
              alert(`Deep Analysis Engine Error: ${data.result.error}`);
              return;
            }
            
            setResult(data.result);
            const risk = Math.round(data.result.risk_score);
            const isDanger = risk >= 70;
            
            const newHistoryItem = {
              id: data.result.id || Date.now(),
              url: url.trim(),
              date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
              risk: risk,
              status: isDanger ? "Phishing" : "Safe"
            };

            if (onScanComplete) onScanComplete(newHistoryItem);
            setLoading(false);
          }, 500);
        } else if (data.status === 'FAILED') {
          ws.close();
          clearInterval(progressInterval);
          setScanProgress(100);
          
          setTimeout(() => {
            console.error("Backend task failed:", data.error);
            setLoading(false);
            setScanProgress(0);
            alert(`Deep Analysis Engine Error: ${data.error}`);
          }, 500);
        }
      };
      
      ws.onerror = (err) => {
          console.error("WebSocket error", err);
          setLoading(false);
      };

    } catch (err) {
      setScanProgress(100);
      
      setTimeout(() => {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("Backend failed:", errorMsg);
        setLoading(false);
        setScanProgress(0);
        alert(`Deep Analysis Engine Error: ${errorMsg}`);
      }, 500);
    }
  };

  const submitFeedback = async () => {
    if (!result) return;
    
    setFeedbackLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      let scanId = result.id;
      
      // If the scan result doesn't have a DB ID, fetch it from history
      if (!scanId) {
        const historyRes = await axios.get(`${API_URL}/api/v1/scans/history?limit=5`, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const match = historyRes.data.find(s => s.url === url.trim());
        if (match) scanId = match.id;
      }
      
      if (!scanId) {
        setFeedbackLoading(false);
        alert("Could not find scan record. Please try scanning again.");
        return;
      }

      await axios.post(`${API_URL}/api/v1/feedback/`, {
        scan_id: scanId,
        feedback_type: activeFeedbackType,
        comment: feedbackComment || "Submitted via Quick Action"
      }, {
        withCredentials: true,
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
  const isDanger = risk >= 70;
  const isSuspicious = risk >= 40 && risk < 70;
  
  let borderColor = "#4ade80";
  if (isError) borderColor = "#ef4444";
  else if (result) {
    if (isDanger) borderColor = "#ef4444";
    else if (isSuspicious) borderColor = "#f59e0b";
  }

  return (
    <div className={`scan-section-container ${isError ? "shake" : ""}`}>
      <ElectricBorder
        color={borderColor}
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
              className={`result ${isDanger ? "danger" : isSuspicious ? "suspicious" : "safe"}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h3 className="result-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                {isDanger ? (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}>
                      <FiAlertTriangle style={{ color: '#ef4444', fontSize: '1.4rem' }} />
                    </span>
                    High Risk URL
                  </>
                ) : isSuspicious ? (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', boxShadow: '0 0 15px rgba(245, 158, 11, 0.2)' }}>
                      <FiAlertCircle style={{ color: '#f59e0b', fontSize: '1.4rem' }} />
                    </span>
                    Suspicious URL
                  </>
                ) : (
                  <>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', boxShadow: '0 0 15px rgba(74, 222, 128, 0.2)' }}>
                      <FiCheckCircleIcon style={{ color: '#4ade80', fontSize: '1.4rem' }} />
                    </span>
                    Safe URL
                  </>
                )}
              </h3>
              <div className="risk-meter">
                <div className="risk-label">Risk Level: {risk}%</div>
                <div className="risk-bar-container">
                  <div 
                    className={`risk-bar ${isDanger ? "danger-fill" : isSuspicious ? "warning-fill" : "safe-fill"}`} 
                    style={{ width: `${risk}%` }}
                  ></div>
                </div>
              </div>

              {(result.features?.ai_explanation || result.features_json?.ai_explanation) && (
                <div className="ai-explanation-box" style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginTop: '1rem',
                  textAlign: 'left'
                }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    <FaRobot /> AI Threat Intelligence
                  </h4>
                  <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.5', minHeight: '60px' }}>
                    <TypewriterText text={result.features?.ai_explanation || result.features_json?.ai_explanation} speed={12} onNavigate={onNavigate} />
                  </p>
                </div>
              )}

              {/* GUEST LIMIT BANNER */}
              {!isLoggedIn && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '15px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px' }}>
                  <p style={{ color: '#e2e8f0', fontSize: '0.95rem', margin: 0 }}>
                    You have used your 1 free scan. To scan more URLs and unlock full threat intelligence, please <a href="#" onClick={(e) => { e.preventDefault(); onAuthRequired(); }} style={{ color: '#60a5fa', textDecoration: 'underline', fontWeight: 'bold' }}>Sign Up or Log In</a>.
                  </p>
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
                          {isDanger ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', padding: '4px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px' }}>
                                <FiAlertTriangle style={{ color: '#ef4444' }} />
                              </span>
                              Report False Positive
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ display: 'inline-flex', padding: '4px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px' }}>
                                <FiShield style={{ color: '#3b82f6' }} />
                              </span>
                              Report Missed Threat
                            </span>
                          )}
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ display: 'inline-flex', padding: '4px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '6px', boxShadow: '0 0 10px rgba(74, 222, 128, 0.2)' }}>
                          <FiCheckCircleIcon style={{ color: '#4ade80', fontSize: '1.2rem' }} />
                        </span>
                        Intelligence Logged. Thank you for contributing!
                      </span>
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
