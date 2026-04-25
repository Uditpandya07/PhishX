import { useState, useEffect } from "react";
import { FaGithub, FaTwitter, FaLinkedin, FaShieldAlt, FaBolt, FaRobot, FaLock, FaHistory, FaCode, FaChartLine, FaEnvelopeOpenText, FaSearch, FaExclamationTriangle, FaTerminal, FaInfoCircle, FaCrown, FaCog, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaUserShield } from "react-icons/fa";
import { motion, useScroll, useSpring } from "framer-motion";
import axios from "axios";
import Background from "../components/Background";
import ScanPanel from "../components/ScanPanel";
import AuthModal from "../components/AuthModal.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import AdminPanel from "../components/AdminPanel.jsx";
import PricingCards from "../components/PricingCards.jsx";
import TechStack from "../components/TechStack.jsx";

// New Pages
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import CreatorPage from "./CreatorPage";
import ComingSoon from "./ComingSoon";
import Documentation from "./Documentation";
import VisionPage from "./VisionPage";

import "./Dashboard.css";

export default function Dashboard({ onLogout, isLoggedIn, setIsLoggedIn, setEntered, triggerNotification }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'admin', 'pricing', 'privacy', 'terms', 'creator', 'api', 'docs', 'vision'
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [scanHistory, setScanHistory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchHistory = async () => {
        try {
          const token = sessionStorage.getItem("token");
          if (!token) return;
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/scans/history`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const clearTimestamp = sessionStorage.getItem("history_clear_timestamp");
          const formattedHistory = res.data
            .filter(scan => !clearTimestamp || new Date(scan.timestamp) > new Date(parseInt(clearTimestamp)))
            .map(scan => ({
              id: scan.id,
              url: scan.url,
              date: new Date(scan.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
          const token = sessionStorage.getItem("token");
          if (token) {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
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

  const handleLoginSuccess = async () => {
    setIsLoggedIn(true);
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
        return <TermsOfService />;
      case 'creator':
        return <CreatorPage />;
      case 'api':
        return <ComingSoon title="Developer API" subtitle="Advanced integration tools for security professionals and hobbyists." icon={FaTerminal} />;
      case 'docs':
        return <Documentation />;
      case 'vision':
        return <VisionPage />;
      default:
        return (
          <>
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
                <h1 className="hero-title">Stop Phishing <br/> Before It Starts.</h1>
                <p className="hero-subtext">
                  PhishX uses advanced lexical analysis and Random Forest classifiers to detect 
                  deceptive URLs in milliseconds. Protecting individuals and communities from digital threats.
                </p>
                <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center' }}>
                    <a href="#scan" className="primary-btn-nav" style={{ padding: '18px 45px', fontSize: '1.2rem' }}>Start Scanning</a>
                    <a href="#about" className="login-btn" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Learn More &rarr;</a>
                </div>
              </motion.div>
            </section>

            {/* SCANNER CENTERPIECE */}
            <section id="scan" className="scanner-container">
              <div className="glass-section scan-box-wrapper" style={{ border: '2px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="scan-stats-grid">
                  <div className="scan-stat-card">
                    <span>Analysis Performed</span>
                    <strong style={{ color: '#3b82f6' }}>{scanHistory.length}</strong>
                  </div>
                  <div className="scan-stat-card">
                    <span>Malicious Blocked</span>
                    <strong style={{ color: '#ef4444' }}>{scanHistory.filter(s => s.status === "Phishing").length}</strong>
                  </div>
                  <div className="scan-stat-card">
                    <span>Verified Safe</span>
                    <strong style={{ color: '#4ade80' }}>{scanHistory.filter(s => s.status === "Safe").length}</strong>
                  </div>
                </div>
                
                <div style={{ padding: '40px 0' }}>
                  <ScanPanel 
                    isLoggedIn={isLoggedIn} 
                    onAuthRequired={() => openModal("login")} 
                    onScanComplete={handleNewScan} 
                  />
                </div>
              </div>
            </section>

            {/* ABOUT SECTION */}
            <section id="about" className="glass-section">
              <div className="about-grid">
                <div className="about-text">
                  <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1 }}>Intelligent <br/> Threat Detection.</h2>
                  <p style={{ color: '#94a3b8', fontSize: '1.2rem', lineHeight: 1.8 }}>
                    Modern phishing attacks evolve every hour. Our engine analyzes 15+ lexical features—including entropy, 
                    suspicious keywords, and redirection patterns—to identify the DNA of a threat before it reaches your inbox.
                  </p>
                  <div style={{ marginTop: '40px', display: 'flex', gap: '40px' }}>
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
                <h2 style={{ fontSize: '3rem' }}>Platform Capabilities</h2>
                <p>Protecting the digital footprint of common people with enterprise-grade technology.</p>
              </div>
              <div className="grid-3">
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#3b82f6' }}><FaRobot /></div>
                  <h3>AI Classifier</h3>
                  <p>Our Random Forest model is continuously trained on massive datasets to maintain elite-level precision.</p>
                </div>
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#4ade80' }}><FaBolt /></div>
                  <h3>Millisecond Analysis</h3>
                  <p>State-of-the-art backend infrastructure ensures that your threat intelligence is delivered in real-time.</p>
                </div>
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#6366f1' }}><FaChartLine /></div>
                  <h3>Threat Analytics</h3>
                  <p>Identify recurring patterns and track threat originators across your entire digital footprint.</p>
                </div>
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#f59e0b' }}><FaLock /></div>
                  <h3>Secure Endpoint</h3>
                  <p>All data processing happens in isolated environments, ensuring your browsing intent remains private.</p>
                </div>
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#ec4899' }}><FaCode /></div>
                  <h3>Developer API</h3>
                  <p>Integrate our detection capabilities directly into your custom applications. (Coming Soon)</p>
                </div>
                <div className="feature-card-premium">
                  <div className="feature-icon-wrapper" style={{ color: '#3b82f6' }}><FaEnvelopeOpenText /></div>
                  <h3>Active Shield</h3>
                  <p>The browser extension provides a second line of defense by intercepting links before interaction.</p>
                </div>
              </div>
            </section>

            {/* TECH STACK SECTION */}
            <section className="glass-section">
              <TechStack />
            </section>

            {/* RECENT ACTIVITY */}
            <section id="history" className="glass-section">
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <FaHistory style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Recent Activity</h3>
                  </div>
                  <span style={{ color: '#3b82f6', fontWeight: 600, cursor: 'pointer' }}>Detailed Logs &rarr;</span>
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
                        <tr><th>Target Entity</th><th>Discovery Date</th><th>Risk Evaluation</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                         {scanHistory.slice(0, visibleCount).map((scan) => (
                            <tr key={scan.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{scan.url}</td>
                              <td style={{ color: '#64748b' }}>{scan.date}</td>
                              <td style={{ fontWeight: 700 }}>{scan.risk}%</td>
                              <td><span className={`badge ${scan.status === "Safe" ? "safe" : "danger"}`}>{scan.status}</span></td>
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

  return (
    <div className="dashboard-root">
      <motion.div className="scroll-progress-bar" style={{ scaleX }} />
      <Background />

      <nav className="navbar">
        <div className="nav-brand" onClick={() => setView('main')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo-icon.png" alt="PhishX Icon" className="brand-icon" style={{ height: '40px' }} /> 
          <img src="/brand-text.png" alt="PhishX" className="brand-text-img" style={{ height: '40px' }} />
        </div>
        <div className="nav-links">
          <a href="#about" onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaInfoCircle style={{ fontSize: '0.9rem', opacity: 0.8, color: '#3b82f6' }} /> About
          </a>
          <a href="#scan" onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBolt style={{ fontSize: '0.9rem', opacity: 0.8, color: '#4ade80' }} /> Scanner
          </a>
          <a href="#history" onClick={() => setView('main')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaHistory style={{ fontSize: '0.9rem', opacity: 0.8, color: '#a855f7' }} /> History
          </a>
          <a href="#pricing" onClick={() => setView('pricing')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCrown style={{ fontSize: '0.9rem', opacity: 0.8, color: '#fbbf24' }} /> Pricing
          </a>
        </div>
        <div className="auth-group">
          {isLoggedIn ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {user?.is_superuser && (
                <button 
                  className="nav-btn" 
                  style={{ background: currentView === 'admin' ? '#ef4444' : 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.4)', color: currentView === 'admin' ? '#fff' : '#ef4444', padding: '6px 14px', borderRadius: '100px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setView(currentView === 'admin' ? 'main' : 'admin')}
                >
                  <FaUserShield style={{ fontSize: '0.9rem' }} /> {currentView === 'admin' ? "Exit" : "Admin"}
                </button>
              )}
              <button className="login-btn" onClick={() => setIsSettingsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}>
                <FaCog style={{ opacity: 0.8 }} /> Settings
              </button>
              <button className="primary-btn-nav" onClick={() => { 
                sessionStorage.removeItem("token");
                setIsLoggedIn(false); 
                setUser(null); 
                setView('main'); 
                if (onLogout) onLogout(); 
              }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', fontSize: '0.85rem' }}>
                <FaSignOutAlt /> Log Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <a href="#login" className="login-btn" onClick={(e) => openModal("login", e)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.85rem' }}>
                <FaSignInAlt style={{ opacity: 0.8 }} /> Log In
              </a>
              <button className="primary-btn-nav" onClick={(e) => openModal("signup", e)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', fontSize: '0.85rem' }}>
                <FaUserPlus /> Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="scroll-container">
        {renderContent()}

        <footer className="footer-box" style={{ marginTop: '80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '60px', marginBottom: '60px' }}>
            <div style={{ maxWidth: '400px' }}>
              <img src="/logo.png" alt="PhishX Logo" style={{ height: '60px', marginBottom: '25px' }} />
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '1rem' }}>
                Next-generation AI phishing detection. A non-commercial project dedicated to securing individuals and communities from digital threats.
              </p>
              <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
                <a href="https://github.com/Uditpandya07" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaGithub /></a>
                <a href="#" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaTwitter /></a>
                <a href="#" style={{ color: '#94a3b8', fontSize: '1.5rem' }}><FaLinkedin /></a>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '100px', flexWrap: 'wrap' }}>
              <div className="footer-col">
                <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.1rem' }}>Product</h4>
                <a href="#scan" onClick={() => setView('main')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Scanner</a>
                <a href="#features" onClick={() => setView('main')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Capabilities</a>
                <a href="#api" onClick={() => setView('api')} style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>API (Soon)</a>
                <a href="#" style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Extension</a>
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
                <a href="#" style={{ color: '#64748b', textDecoration: 'none', display: 'block', marginBottom: '10px' }}>Security</a>
              </div>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '30px', textAlign: 'center' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem' }}>
              &copy; 2026 PhishX Platform. Developed by <strong style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={() => setView('creator')}>Udit Pandya</strong> • B.Tech CSE.
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
      />
    </div>
  );
}