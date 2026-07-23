"use client";
import { useState, useEffect } from "react";
import { FaGithub, FaTwitter, FaLinkedin, FaProductHunt, FaShieldAlt, FaBolt, FaRobot, FaLock, FaHistory, FaCode, FaChartLine, FaEnvelopeOpenText, FaSearch, FaExclamationTriangle, FaTerminal, FaInfoCircle, FaCrown, FaCog, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaUserShield, FaTrashAlt, FaBars, FaTimes, FaNewspaper, FaGlobe, FaSatelliteDish } from "react-icons/fa";
import { FiInfo, FiZap, FiGlobe, FiClock, FiActivity, FiStar, FiLogIn, FiUserPlus as FiUserPlusOutline, FiCpu, FiShield, FiDatabase, FiCode, FiLayers, FiBox, FiMonitor, FiLock, FiBell } from "react-icons/fi";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { STATUS } from "react-joyride";
import Tour from "../components/Tour";
import axios from "axios";
import Background from "../components/Background";
import ScanPanel from "../components/ScanPanel";
import AuthModal from "../components/AuthModal.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import AdminPanel from "../components/AdminPanel.jsx";
import PricingCards from "../components/PricingCards.jsx";
import TechStack from "../components/TechStack.jsx";
import ContactModal from "../components/ContactModal.jsx";
import CookieBanner from "../components/CookieBanner.jsx";
import { showErrorPopup } from "../utils/errorHandler";
// import ThreatTicker from "../components/ThreatTicker.jsx";
// New Pages
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import CreatorPage from "./CreatorPage";
import ComingSoon from "./ComingSoon";
import Documentation from "./Documentation";
import VisionPage from "./VisionPage";
import NewsPage from "./NewsPage";
import AnalyticsPage from "./AnalyticsPage";

import "./Dashboard.css";

const AnimatedCounter = ({ value, color }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const incrementTime = 30;
    const steps = duration / incrementTime;
    const stepValue = Math.max(1, Math.floor(value / steps));

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value]);

  return <strong style={{ color }}>{count.toLocaleString()}</strong>;
};

export default function Dashboard({ onLogout, isLoggedIn, setIsLoggedIn, setEntered, triggerNotification }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'admin', 'pricing', 'privacy', 'terms', 'creator', 'api', 'docs', 'vision', 'news', 'intel'
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [scanHistory, setScanHistory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

  // --- Joyride State ---
  const [runTour, setRunTour] = useState(false);
  const [tourSteps] = useState([
    {
      target: '.nav-brand',
      title: 'Welcome to PhishX!',
      content: "Let's take a quick 30-second tour of your new command center.",
    },
    {
      target: '.nav-links',
      title: 'Navigation',
      content: 'Access all areas of PhishX from here.',
    },
    {
      target: '#nav-cyberpulse',
      title: 'CyberPulse feed',
      content: 'Stay up-to-date with the latest global cybersecurity news and real-time intelligence feeds.',
    },
    {
      target: '#scan',
      title: 'AI Scanner',
      content: 'This is the core AI Scanner. Paste any suspicious URL here, and we will analyze it using machine learning in milliseconds.',
    },
    {
      target: '.auth-group',
      title: 'Your Account',
      content: 'Log in or sign up here to keep track of your scans and configure your threat alerts.',
    }
  ]);

  const startTourIfEligible = () => {
    const hasSeenTour = localStorage.getItem('phishx_has_seen_tour_v10');
    if (!hasSeenTour) {
      setTimeout(() => {
        setRunTour(true);
      }, 500);
    }
  };

  useEffect(() => {
    // Tour is now triggered by CookieBanner resolving
  }, [isLoggedIn]);

  const handleJoyrideCallback = (data) => {
    const { status, type, action } = data;
    console.log("Joyride callback fired:", data);
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('phishx_has_seen_tour_v4', 'true');
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      const fetchHistory = async () => {
        try {
          const res = await axios.get(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/scans/history`);
          const clearTimestamp = sessionStorage.getItem("history_clear_timestamp");
          const formattedHistory = res.data
            .filter(scan => !clearTimestamp || new Date(scan.timestamp) > new Date(parseInt(clearTimestamp)))
            .map(scan => ({
              id: scan.id,
              url: scan.url,
              date: new Date(scan.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
              risk: Math.round(scan.risk_score),
              status: scan.prediction === "Phishing" ? "Phishing" : "Safe"
            }));
          setScanHistory(formattedHistory);
        } catch (err) {
          console.error("Failed to fetch history:", err);
        }
      };
      fetchHistory();

      const fetchUser = async () => {
        try {
          if (isLoggedIn) {
            const res = await axios.get(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/users/me`);
            setUser(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
        }
      };
      fetchUser();
    }
  }, [isLoggedIn]);

  const openModal = (mode, e) => {
    if (e) e.preventDefault();
    setAuthMode(mode);
    setIsModalOpen(true);
  };

  const handleLoginSuccess = async (userData) => {
    setIsLoggedIn(true);
    if (userData) setUser(userData);
    if (setEntered) setEntered(true);
    setIsModalOpen(false);
    if (triggerNotification) triggerNotification("Authentication Successful! Welcome back.");
  };

  const handleNewScan = (newScan) => {
    setScanHistory([newScan, ...scanHistory]);
  };

  const handleClearLocalHistory = () => {
    sessionStorage.setItem("history_clear_timestamp", Date.now().toString());
    setScanHistory([]);
  };

  const handleDeleteScan = async (scanId) => {
    if (!window.confirm("Permanently delete this scan from your history?")) return;

    try {
      const token = sessionStorage.getItem("token");
      await axios.delete(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanHistory(prev => prev.filter(s => s.id !== scanId));
      if (triggerNotification) triggerNotification("Scan deleted successfully.");
    } catch (err) {
      console.error("Failed to delete scan:", err);
      showErrorPopup("Failed to delete scan. Please try again.");
    }
  };

  const setView = (view) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'admin':
        return <AdminPanel />;
      case 'pricing':
        return <PricingCards user={user} />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService onContactSupport={() => setIsContactOpen(true)} />;
      case 'creator':
        return <CreatorPage />;
      case 'api':
        return <ComingSoon title="Developer API" subtitle="Advanced integration tools for security professionals and hobbyists." icon={FaTerminal} />;
      case 'security':
        return <ComingSoon title="Security Architecture" subtitle="Detailed security documentation and bug bounty program information coming soon." icon={FaShieldAlt} />;
      case 'extension':
        return <ComingSoon title="Browser Extension" subtitle="Real-time browser protection is currently in active development." icon={FaGlobe} />;
      case 'docs':
        return <Documentation />;
      case 'vision':
        return <VisionPage />;
      case 'news':
        return <NewsPage />;
      case 'intel':
        return <AnalyticsPage />;
      default:
        return (
          <>
            <Tour
              steps={tourSteps}
              run={runTour}
              continuous={true}
              showProgress={true}
              showSkipButton={true}
              disableOverlayClose={true}
              callback={handleJoyrideCallback}
              styles={{
                options: {
                  primaryColor: '#3b82f6',
                  backgroundColor: '#1e293b',
                  textColor: '#f8fafc',
                  arrowColor: '#1e293b',
                }
              }}
            />
            {/* HERO */}
            <section className="hero-section">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="hero-badge">
                  <FaShieldAlt style={{ color: '#4ade80' }} /> Community-Driven Phishing Defense
                </div>
                <h1 className="hero-title">Stop Phishing <br /> Before It Starts.</h1>
                <p className="hero-subtext">
                  PhishX uses advanced lexical analysis and Random Forest classifiers to detect
                  deceptive URLs in milliseconds. Protecting individuals and communities from digital threats.
                </p>
                <div className="hero-btn-group">
                  <a href="#scan" className="primary-btn-nav hero-primary-btn">Start Scanning</a>
                  <a href="#about" className="login-btn hero-secondary-btn">Learn More &rarr;</a>
                </div>
              </motion.div>
            </section>

            {/* SCANNER CENTERPIECE */}
            <section id="scan" className="scanner-container">
              <div className="glass-section scan-box-wrapper">
                <div className="scan-stats-grid">
                  <div className="scan-stat-card">
                    <span>{isLoggedIn ? "Your " : ""}Analysis Performed</span>
                    <AnimatedCounter
                      value={isLoggedIn ? scanHistory.length : 14892}
                      color="#3b82f6"
                    />
                  </div>
                  <div className="scan-stat-card">
                    <span>{isLoggedIn ? "Your " : ""}Malicious Blocked</span>
                    <AnimatedCounter
                      value={isLoggedIn ? scanHistory.filter(s => s.status === "Phishing").length : 4102}
                      color="#ef4444"
                    />
                  </div>
                  <div className="scan-stat-card">
                    <span>{isLoggedIn ? "Your " : ""}Verified Safe</span>
                    <AnimatedCounter
                      value={isLoggedIn ? scanHistory.filter(s => s.status === "Safe").length : 10790}
                      color="#4ade80"
                    />
                  </div>
                </div>

                <motion.div
                  style={{ padding: '40px 0' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                >
                  <ScanPanel
                    isLoggedIn={isLoggedIn}
                    onAuthRequired={() => openModal("login")}
                    onScanComplete={handleNewScan}
                    onNavigate={(view) => setCurrentView(view)}
                  />
                </motion.div>
              </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="glass-section">
              <div className="about-grid">
                <div className="about-text">
                  <h2 className="about-title" style={{ fontWeight: 900, marginBottom: '20px', lineHeight: 1.1, fontSize: 'clamp(2.5rem, 4vw, 3.5rem)' }}>Intelligent <br /> Threat Detection.</h2>
                  <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1.8 }}>
                    Modern phishing attacks evolve every hour. Our engine analyzes 15+ lexical features—including entropy,
                    suspicious keywords, and redirection patterns—to identify the DNA of a threat before it reaches your inbox.
                  </p>
                  <div className="about-stats" style={{ marginTop: '40px', display: 'flex', gap: '40px' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '2rem', color: '#3b82f6' }}>15+</strong>
                      <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Feature Indicators</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '2rem', color: '#4ade80' }}>99.4%</strong>
                      <span style={{ color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>Detection Accuracy</span>
                    </div>
                  </div>
                </div>
                <div className="about-visual" style={{ background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)' }}>
                  <div className="pulse-circle" style={{ background: 'rgba(59, 130, 246, 0.2)' }}></div>
                  <FaShieldAlt style={{ fontSize: '7rem', color: '#3b82f6', zIndex: 1, filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.4))' }} />
                </div>
              </div>
            </section>

            {/* CAPABILITIES SECTION */}
            <section id="features">
              <div className="section-header">
                <h2 className="section-header-title">Platform Capabilities</h2>
                <p>Protecting the digital footprint of common people with enterprise-grade technology.</p>
              </div>
              <div className="grid-3">
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper">
                    <FiCpu />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>AI Classifier</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Our Random Forest model is continuously trained on massive datasets to maintain elite-level precision.
                  </p>
                </div>

                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper">
                    <FiZap />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Millisecond Analysis</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    State-of-the-art backend infrastructure ensures that your threat intelligence is delivered in real-time.
                  </p>
                </div>

                <div className="feature-card-premium" onClick={() => setView('news')} style={{ cursor: 'pointer' }}>
                  <div className="feature-icon-wrapper" style={{ border: '1px solid rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.1)', boxShadow: '0 0 20px rgba(236,72,153,0.2)' }}>
                    <FaSatelliteDish style={{ color: '#f472b6' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>CyberPulse</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Live tracking of global cyberattack vectors, threat origins, and breaking cybersecurity news.
                  </p>
                </div>

                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper">
                    <FiLock />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Secure Endpoint</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    All data processing happens in isolated environments, ensuring your browsing intent remains private.
                  </p>
                </div>

                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.1)', boxShadow: '0 0 20px rgba(74,222,128,0.2)' }}>
                    <FiBell style={{ color: '#4ade80' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>SecOps Webhooks</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Instant Slack & Microsoft Teams alerts when high-risk phishing payloads are detected in your environment.
                  </p>
                </div>

                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper">
                    <FiShield />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Active Shield</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    The browser extension provides a second line of defense by intercepting links before interaction.
                  </p>
                </div>
              </div>
            </section>

            {/* TECH STACK SECTION */}
            <section className="glass-section">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiZap size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>FastAPI</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>High-performance backend engine</span>
                  </div>
                </div>

                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiCpu size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Random Forest</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Optimized ML Classifier</span>
                  </div>
                </div>

                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiMonitor size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>React 19</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Reactive & dynamic interface</span>
                  </div>
                </div>

                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiDatabase size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Neon Postgres</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Serverless relational database</span>
                  </div>
                </div>

                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiCode size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Python</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Data processing & feature extraction</span>
                  </div>
                </div>

                <div className="tech-badge" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.3), 0 0 15px rgba(74,222,128,0.1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ background: 'rgba(74,222,128,0.1)', padding: '12px', borderRadius: '12px', color: '#4ade80' }}><FiShield size={24} /></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem' }}>Secure API</strong>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Protected endpoint infrastructure</span>
                  </div>
                </div>
              </div>
            </section>

            {/* RECENT ACTIVITY */}
            <section id="history" className="glass-section">
              <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <FaHistory style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Recent Activity</h3>
                </div>
              </div>

              {scanHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><FaSearch /></div>
                  <h4>No Intelligence Logs Found</h4>
                  <p>When you scan a URL, the analysis results will appear here in real-time.</p>
                  <a href="#scan" className="primary-btn-nav" style={{ marginTop: '20px', padding: '10px 25px' }}>Run First Scan</a>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="history-table">
                    <thead>
                      <tr><th>Target Entity</th><th>Discovery Date</th><th>Risk Evaluation</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {scanHistory.slice(0, visibleCount).map((scan) => (
                        <tr key={scan.id}>
                          <td data-label="Target Entity" className="target-url-cell" title={scan.url}>
                            {scan.url}
                          </td>
                          <td data-label="Discovery Date" style={{ color: '#64748b' }}>{scan.date}</td>
                          <td data-label="Risk Evaluation" style={{ fontWeight: 700 }}>{scan.risk}%</td>
                          <td data-label="Status"><span className={`badge ${scan.status === "Safe" ? "safe" : scan.status === "Suspicious" ? "suspicious" : "danger"}`}>{scan.status}</span></td>
                          <td data-label="Actions">
                            <button
                              onClick={() => handleDeleteScan(scan.id)}
                              className="delete-item-btn"
                              title="Delete from history"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer',
                                transition: 'color 0.2s',
                                padding: '5px'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                              onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {scanHistory.length > visibleCount && (
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                      <button
                        className="login-btn"
                        onClick={() => setVisibleCount(prev => prev + 5)}
                        style={{ padding: '10px 25px', fontSize: '0.9rem' }}
                      >
                        Load More History
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        );
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleNavClick = (e, viewName, targetId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (targetId) setActiveSection(targetId);

    if (currentView === viewName) {
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    } else {
      setView(viewName);
      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 350); // wait for AnimatePresence mode="wait" to exit old view
      }
    }
  };

  return (
    <div className="dashboard-root">
      <motion.div className="scroll-progress-bar" style={{ scaleX }} />
      <Background />

      <nav className={`navbar ${isMobileMenuOpen ? "mobile-menu-active" : ""}`}>
        <div className="nav-brand" onClick={() => { setView('main'); setIsMobileMenuOpen(false); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-icon.png" alt="PhishX Icon" className="brand-icon" style={{ height: '40px' }} />
          <img src="/brand-text.png" alt="PhishX" className="brand-text-img" style={{ height: '40px' }} />
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className={`nav-menu-wrapper ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="nav-links">
            <a href="#about" onClick={(e) => handleNavClick(e, 'main', 'about')} className={`nav-link-bento ${currentView === 'main' && activeSection === 'about' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiInfo /></div> About
            </a>
            <a href="#scan" onClick={(e) => handleNavClick(e, 'main', 'scan')} className={`nav-link-bento ${currentView === 'main' && activeSection === 'scan' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiZap /></div> Scanner
            </a>
            <a href="#intel" onClick={(e) => handleNavClick(e, 'intel', null)} className={`nav-link-bento ${currentView === 'intel' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiGlobe /></div> Intel
            </a>
            <a href="#history" onClick={(e) => handleNavClick(e, 'main', 'history')} className={`nav-link-bento ${currentView === 'main' && activeSection === 'history' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiClock /></div> History
            </a>
            <a id="nav-cyberpulse" href="#news" onClick={(e) => handleNavClick(e, 'news', null)} className={`nav-link-bento ${currentView === 'news' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiActivity /></div> CyberPulse
            </a>
            <a href="#pricing" onClick={(e) => handleNavClick(e, 'pricing', null)} className={`nav-link-bento ${currentView === 'pricing' ? 'active' : ''}`}>
              <div className="nav-icon-glass-neon"><FiStar /></div> Pricing
            </a>
          </div>

          <div className="auth-group">
            {isLoggedIn ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }} className="auth-btn-wrapper">
                {user?.is_superuser && (
                  <button
                    className={`header-action-btn danger ${currentView === 'admin' ? 'active' : ''}`}
                    onClick={() => { setView(currentView === 'admin' ? 'main' : 'admin'); setIsMobileMenuOpen(false); }}
                  >
                    <FaUserShield style={{ fontSize: '0.9rem' }} /> {currentView === 'admin' ? "Exit Admin" : "Admin"}
                  </button>
                )}
                <button
                  className="header-action-btn glass"
                  onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                  title="Settings"
                  style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                  <FaCog style={{ fontSize: '1.2rem' }} /> <span className="settings-text">Settings</span>
                </button>
                <button
                  className="header-action-btn primary"
                  onClick={async () => {
                    try {
                      await axios.post(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/auth/logout`);
                    } catch (err) {
                      console.error("Logout failed:", err);
                    }
                    setIsLoggedIn(false);
                    setUser(null);
                    setView('main');
                    setIsMobileMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <FaSignOutAlt /> Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="auth-btn-wrapper">
                <a
                  href="#login"
                  className="header-action-btn secondary"
                  onClick={(e) => { openModal("login", e); setIsMobileMenuOpen(false); }}
                >
                  <FaSignInAlt style={{ opacity: 0.8 }} /> Log In
                </a>
                <button
                  className="header-action-btn primary"
                  onClick={(e) => { openModal("signup", e); setIsMobileMenuOpen(false); }}
                >
                  <FaUserPlus /> Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="scroll-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <footer className="footer-box" style={{ marginTop: '80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '60px', marginBottom: '60px' }}>
            <div style={{ maxWidth: '400px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}>
                <img src="/logo-icon.png" alt="PhishX Icon" style={{ height: '45px' }} />
                <img src="/brand-text.png" alt="PhishX" style={{ height: '45px' }} />
              </div>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '1rem' }}>
                Next-generation AI phishing detection. A non-commercial project dedicated to securing individuals and communities from digital threats.
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                <a href="https://github.com/Uditpandya07" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaGithub /></a>
                <a href="https://www.linkedin.com/in/uditpandya07/" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaLinkedin /></a>
                <a href="https://www.producthunt.com/products/phishx?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-phishx" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaProductHunt /></a>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', flex: '1', justifyContent: 'space-around' }}>
              <div className="footer-col">
                <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Product</h4>
                <a href="#scan" onClick={() => setView('main')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Scanner</a>
                <a href="#features" onClick={() => setView('main')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Capabilities</a>
                <a href="#api" onClick={() => setView('api')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>API (Soon)</a>
                <a href="#extension" onClick={(e) => handleNavClick(e, 'extension', null)} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Extension</a>
              </div>
              <div className="footer-col">
                <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Resources</h4>
                <a href="#" onClick={() => setView('creator')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Meet the Creator</a>
                <a href="#" onClick={() => setView('docs')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Documentation</a>
                <a href="#" onClick={() => setView('vision')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Vision</a>
              </div>
              <div className="footer-col">
                <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Legal</h4>
                <a href="#" onClick={() => setView('privacy')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Privacy Policy</a>
                <a href="#" onClick={() => setView('terms')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Terms of Service</a>
              </div>
              <div className="footer-col">
                <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Support</h4>
                {isLoggedIn ? (
                  <a href="#" onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Contact Support</a>
                ) : (
                  <a href="#" onClick={(e) => openModal("login", e)} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Contact Support</a>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              &copy; 2026 PhishX Platform.
            </p>
          </div>
        </footer>
      </div>

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initialMode={authMode} onLoginSuccess={handleLoginSuccess} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onClearHistory={handleClearLocalHistory}
        setIsLoggedIn={setIsLoggedIn}
        onLogout={onLogout}
      />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <CookieBanner onResolve={startTourIfEligible} />

      {/* Floating Status Indicator */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        onClick={() => setIsWarningOpen(true)}
        whileHover={{ scale: 1.05, borderColor: "rgba(239, 68, 68, 0.7)" }}
        className="status-pill"
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 12px #ef4444' }}
        />
        <span className="status-pill-text" style={{ color: '#f8fafc', fontWeight: 600, letterSpacing: '0.5px' }}>Performance</span>
      </motion.div>

      <AnimatePresence>
        {isWarningOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#0f172a', padding: '30px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)' }}
            >
              <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '20px' }} />
              <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '1.4rem' }}>Limited Capability</h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6', marginBottom: '25px', fontSize: '0.95rem' }}>
                As a free, community-driven project, our backend intelligence engines occasionally enter sleep mode to conserve resources. Because of this, you may experience a slight delay (cold start) during your first scan or login as the servers wake up.
              </p>
              <button
                onClick={() => setIsWarningOpen(false)}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', width: '100%', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#dc2626'}
                onMouseOut={(e) => e.target.style.background = '#ef4444'}
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
