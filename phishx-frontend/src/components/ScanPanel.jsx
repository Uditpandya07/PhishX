"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FaTimesCircle, FaSearch, FaCode, FaBrain, FaShieldAlt, FaCheckCircle, FaSpinner, FaRobot, FaCopy, FaCheck, FaChevronDown, FaChevronUp, FaTrash } from "react-icons/fa";
import { FiAlertTriangle, FiCheckCircle as FiCheckCircleIcon, FiShield, FiAlertCircle } from "react-icons/fi";
import axios from "axios";
import { API_URL, isConfigured } from "../config";
import ElectricBorder from "./ElectricBorder";
import RiskInsights from "./RiskInsights";
import "./ScanPanel.css";
import { showErrorPopup } from "../utils/errorHandler";

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

export default function ScanPanel({ isLoggedIn, user, onAuthRequired, onScanComplete, onNavigate }) {
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
  
  // LIVE AI CHAT STATES
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const chatContainerRef = useRef(null);
  const MAX_CHAT_CHARS = 500;

  const QUICK_CHIPS = [
    "Why is this flagged?",
    "What's the risk?",
    "Am I safe to ignore this?",
  ];

  // Auto-scroll only the chat container, NOT the whole page
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const sendChatMessage = useCallback(async (overrideMsg) => {
    const msg = (overrideMsg || chatInput).trim();
    if (!msg || isChatLoading) return;
    if (!overrideMsg) setChatInput("");
    const ts = formatTimestamp();
    setChatHistory(prev => [...prev, { role: 'user', content: msg, ts }]);
    setIsChatLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const riskScore = result ? Math.round(result.risk_score) : 0;
      const res = await axios.post(`${API_URL}/api/v1/chat/message`, {
        message: msg,
        url: url.trim(),
        risk_score: riskScore,
        features: result?.features || result?.features_json || {},
        history: chatHistory
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const replyTs = formatTimestamp();
      setChatHistory(prev => [...prev, { role: 'model', content: res.data.reply, ts: replyTs }]);
    } catch (err) {
      console.error("Chat error:", err);
      const replyTs = formatTimestamp();
      setChatHistory(prev => [...prev, { role: 'model', content: "Failed to connect to AI.", ts: replyTs }]);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, result, url, chatHistory]);

  const copyMessage = (content, idx) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  const wsRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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
    setChatHistory([]);

    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev < 90) {
          const increment = Math.max(1, Math.floor((90 - prev) / 10));
          return prev + increment;
        }
        return prev;
      });
    }, 400);

    try {
      const token = sessionStorage.getItem("token");

      if (!isConfigured) {
        clearInterval(progressInterval);
        setLoading(false);
        setScanProgress(0);
        showErrorPopup("The PhishX backend URL is not configured. Please contact the administrator.");
        return;
      }

      const res = await axios.post(`${API_URL}/api/v1/scans/predict`, { 
        url: url.trim() 
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // If the backend ran synchronously (e.g., local dev) and returned the result immediately
      if (res.data.status === 'COMPLETED' && res.data.result) {
        clearInterval(progressInterval);
        setScanProgress(100);
        setTimeout(() => {
          if (res.data.result.error) {
            console.error("Backend task completed with error result:", res.data.result.error);
            setLoading(false);
            setScanProgress(0);
            showErrorPopup(`Deep Analysis Engine Error: ${res.data.result.error}`);
            return;
          }
          
          setResult(res.data.result);
          const risk = Math.round(res.data.result.risk_score);
          const isDanger = risk >= 70;
          
          const newHistoryItem = {
            id: res.data.result.id || Date.now(),
            url: url.trim(),
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
            risk: risk,
            status: isDanger ? "Phishing" : "Safe"
          };

          if (onScanComplete) onScanComplete(newHistoryItem);
          setLoading(false);
        }, 500);
        return;
      }

      const taskId = res.data.task_id;
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendDomain = API_URL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}//${backendDomain}/api/v1/ws/scans/${taskId}`;
      
      wsRef.current = new WebSocket(wsUrl);
      const ws = wsRef.current;
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.progress) {
            setScanProgress(prev => Math.max(prev, data.progress));
        }
        
        if (data.status === 'COMPLETED') {
          ws.close();
          clearInterval(progressInterval);
          setScanProgress(100);
          
          setTimeout(() => {
            if (data.result && data.result.error) {
              console.error("Backend task completed with error result:", data.result.error);
              setLoading(false);
              setScanProgress(0);
              showErrorPopup(`Deep Analysis Engine Error: ${data.result.error}`);
              return;
            }
            
            setResult(data.result);
            const risk = Math.round(data.result.risk_score);
            const isDanger = risk >= 70;
            
            const newHistoryItem = {
              id: data.result.id || Date.now(),
              url: url.trim(),
              date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
              rawTimestamp: new Date().toISOString(),
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
            showErrorPopup(`Deep Analysis Engine Error: ${data.error}`);
          }, 500);
        }
      };
      
      ws.onclose = () => {
        // If we close before reaching 100 or getting a result, it means connection dropped
        setScanProgress((prev) => {
          if (prev < 100) {
            clearInterval(progressInterval);
            setIsError(true);
            setLoading(false);
            setScanProgress(0);
          }
          return prev;
        });
      };
      
      ws.onerror = (err) => {
        clearInterval(progressInterval);
        console.error("Scan error:", err);
        setIsError(true);
        setLoading(false);
      };

    } catch (err) {
      clearInterval(progressInterval);
      setScanProgress(100);
      
      setTimeout(() => {
        const errorMsg = err.response?.data?.detail || err.message || "Unknown error";
        console.error("Backend failed:", errorMsg);
        setLoading(false);
        setScanProgress(0);
        showErrorPopup(`Deep Analysis Engine Error: ${errorMsg}`);
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
        showErrorPopup("Could not find scan record. Please try scanning again.");
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
      showErrorPopup("Failed to submit report. Please check your connection.");
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                      <span className={`step-icon ${isActive ? 'active-icon' : isDone ? 'done-icon' : ''}`}>
                        {isActive ? <FaSpinner className="spin-icon" /> : step.icon}
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
                  
                  {/* LIVE AI CHAT INTEGRATION */}
                  <div style={{
                    marginTop: '1.2rem',
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(23,37,84,0.75) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}>

                    {/* ── Chat Header ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(99,102,241,0.12)', borderBottom: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 0 14px rgba(99,102,241,0.5)', border: '1px solid rgba(99,102,241,0.4)', flexShrink: 0 }}>
                        <img src="/ai-avatar.jpg" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div>
                        <div style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase' }}>PhishX AI</div>
                        <div style={{ color: '#64748b', fontSize: '0.68rem' }}>Threat Intelligence Chat</div>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#4ade80' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80', animation: 'pulse 2s infinite' }} />
                          Live
                        </div>
                        {chatHistory.length > 0 && (
                          <button onClick={() => setChatHistory([])} title="Clear chat" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '2px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                            <FaTrash style={{ fontSize: '0.65rem' }} /> Clear
                          </button>
                        )}
                        <button onClick={() => setChatExpanded(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '2px' }}>
                          {chatExpanded ? <FaChevronUp style={{ fontSize: '0.75rem' }} /> : <FaChevronDown style={{ fontSize: '0.75rem' }} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {chatExpanded && (
                        <motion.div
                          key="chat-body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          {/* ── Quick chips (empty state) ── */}
                          {chatHistory.length === 0 && (
                            <div style={{ padding: '14px 16px 0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ width: '100%', fontSize: '0.72rem', color: '#475569', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggested</div>
                              {QUICK_CHIPS.map(chip => (
                                <button key={chip} onClick={() => sendChatMessage(chip)} style={{
                                  padding: '5px 12px',
                                  borderRadius: '20px',
                                  border: '1px solid rgba(99,102,241,0.4)',
                                  background: 'rgba(99,102,241,0.08)',
                                  color: '#a5b4fc',
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s'
                                }}>
                                  {chip}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* ── Messages ── */}
                          {chatHistory.length > 0 && (
                            <div className="px-chat-history" ref={chatContainerRef} style={{
                              maxHeight: '220px',
                              overflowY: 'auto',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              scrollbarWidth: 'thin',
                              scrollbarColor: 'rgba(99,102,241,0.3) transparent'
                            }}>
                              <AnimatePresence initial={false}>
                                {chatHistory.map((msg, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}
                                  >
                                    {/* AI avatar */}
                                    {msg.role === 'model' && (
                                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, marginBottom: '18px', border: '1px solid rgba(99,102,241,0.4)' }}>
                                        <img src="/ai-avatar.jpg" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      </div>
                                    )}
                                    <div style={{ maxWidth: '85%' }}>
                                      <div style={{
                                        padding: '9px 14px',
                                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                                        background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.07)',
                                        border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                        color: '#f1f5f9',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.55',
                                        boxShadow: msg.role === 'user' ? '0 2px 12px rgba(99,102,241,0.35)' : 'none',
                                        whiteSpace: 'pre-wrap'
                                      }}>
                                        {msg.content}
                                      </div>
                                      {/* Timestamp + copy */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', paddingLeft: msg.role === 'user' ? 0 : '4px' }}>
                                        {msg.ts && <span style={{ fontSize: '0.65rem', color: '#334155' }}>{msg.ts}</span>}
                                        {msg.role === 'model' && (
                                          <button onClick={() => copyMessage(msg.content, idx)} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedIdx === idx ? '#4ade80' : '#475569', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}>
                                            {copiedIdx === idx ? <FaCheck style={{ fontSize: '0.6rem' }} /> : <FaCopy style={{ fontSize: '0.6rem' }} />}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                              </AnimatePresence>

                              {/* Typing indicator */}
                              {isChatLoading && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(99,102,241,0.4)' }}>
                                    <img src="/ai-avatar.jpg" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                  <div style={{ padding: '9px 14px', borderRadius: '4px 16px 16px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    {[0,1,2].map(i => (
                                      <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a5b4fc', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}

                          {/* ── Input ── */}
                          <div style={{ padding: '12px', borderTop: chatHistory.length > 0 ? '1px solid rgba(99,102,241,0.15)' : 'none' }}>
                            <div style={{ display: 'flex', gap: '0' }}>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <input
                                  type="text"
                                  placeholder="Ask about this threat..."
                                  value={chatInput}
                                  maxLength={MAX_CHAT_CHARS}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      sendChatMessage();
                                    }
                                  }}
                                  disabled={isChatLoading}
                                  style={{
                                    width: '100%',
                                    padding: '10px 50px 10px 16px',
                                    borderRadius: '12px 0 0 12px',
                                    border: '1px solid rgba(99,102,241,0.3)',
                                    borderRight: 'none',
                                    background: 'rgba(0,0,0,0.4)',
                                    color: '#f1f5f9',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    boxSizing: 'border-box'
                                  }}
                                />
                                {chatInput.length > 0 && (
                                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: chatInput.length > MAX_CHAT_CHARS * 0.9 ? '#f87171' : '#475569', pointerEvents: 'none' }}>
                                    {chatInput.length}/{MAX_CHAT_CHARS}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => sendChatMessage()}
                                disabled={isChatLoading || !chatInput.trim()}
                                style={{
                                  padding: '10px 20px',
                                  background: (isChatLoading || !chatInput.trim()) ? 'rgba(99,102,241,0.25)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                  color: '#fff',
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  borderLeft: 'none',
                                  borderRadius: '0 12px 12px 0',
                                  cursor: (isChatLoading || !chatInput.trim()) ? 'not-allowed' : 'pointer',
                                  fontWeight: '600',
                                  fontSize: '0.9rem',
                                  transition: 'all 0.2s',
                                  whiteSpace: 'nowrap',
                                  boxShadow: (!isChatLoading && chatInput.trim()) ? '0 0 16px rgba(99,102,241,0.4)' : 'none'
                                }}
                              >
                                Send ↑
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* RISK INSIGHTS (PRO FEATURE) */}
              <RiskInsights user={user} scanData={result} />

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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
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
