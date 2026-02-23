import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";
import Background from "../components/Background";
import ScanPanel from "../components/ScanPanel";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-root">
      <Background />

      {/* Navigation with Auth */}
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/logo.png" alt="PhishX Logo" />
        </div>
        <div className="nav-menu">
          <div className="nav-links">
            <a href="#about">What is PhishX</a>
            <a href="#features">Features</a>
            <a href="#scan">Scanner</a>
            <a href="#history">History</a>
          </div>
          <div className="auth-links">
            <a href="#login" className="login-btn">Log In</a>
            <a href="#signup" className="nav-btn">Sign Up</a>
          </div>
        </div>
      </nav>

      <div className="scroll-container">
        {/* HERO SECTION */}
        <section className="hero-section">
          <div className="hero-content-centered">
            <h1 className="gradient-text">Detect Phishing in Real-Time</h1>
            <p>
              AI-powered URL analysis. Protect yourself from malicious websites, track your scan history, and secure your digital presence with our Machine Learning engine.
            </p>
            <div className="hero-buttons">
              <a href="#scan" className="primary-btn">Scan a URL Now</a>
              <a href="#about" className="secondary-btn">Learn More</a>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section id="about" className="about-section glass-panel">
          <h2>What is PhishX?</h2>
          <p>
            PhishX is an advanced machine learning platform that analyzes URLs and predicts whether they are <strong>Safe</strong> or <strong>Phishing</strong>. 
            By extracting key data points—like URL length, special characters, suspicious keywords, and IP usage—our Random Forest model delivers high-accuracy threat intelligence in milliseconds.
          </p>
        </section>

        {/* SCAN SECTION */}
        <section id="scan" className="scan-section">
          <h2 className="section-title">Threat Detection Center</h2>
          
          <header className="topbar">
            <div className="stat-card glass-panel">
              <span>Total Scans</span>
              <strong>124</strong>
            </div>
            <div className="stat-card glass-panel border-danger">
              <span>Threats</span>
              <strong className="text-danger">39</strong>
            </div>
            <div className="stat-card glass-panel border-safe">
              <span>Safe</span>
              <strong className="text-safe">85</strong>
            </div>
          </header>

          <div className="scan-wrapper">
             <ScanPanel />
          </div>
        </section>

        {/* NEW: RECENT HISTORY MOCKUP */}
        <section id="history" className="history-section glass-panel">
          <div className="history-header">
            <h3>Recent Scans</h3>
            <a href="#history" className="view-all">View All History &rarr;</a>
          </div>
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>URL Scanned</th>
                  <th>Date</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="url-cell">secure-login-update.com/auth</td>
                  <td>Oct 24, 2025</td>
                  <td>89%</td>
                  <td><span className="badge danger">Phishing</span></td>
                </tr>
                <tr>
                  <td className="url-cell">github.com/uditpandya07</td>
                  <td>Oct 24, 2025</td>
                  <td>2%</td>
                  <td><span className="badge safe">Safe</span></td>
                </tr>
                <tr>
                  <td className="url-cell">netflix-billing-verify.net</td>
                  <td>Oct 23, 2025</td>
                  <td>94%</td>
                  <td><span className="badge danger">Phishing</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* EXPANDED FEATURES SECTION */}
        <section id="features" className="features-section">
          <h2 className="section-title">Everything You Need to Stay Safe</h2>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <h3>🤖 AI-Powered</h3>
              <p>Utilizes a trained Random Forest model on a balanced phishing dataset for extreme accuracy.</p>
            </div>
            <div className="feature-card glass-panel">
              <h3>⚡ Deep Extraction</h3>
              <p>Analyzes URL length, subdomains, symbols, hyphens, and IP address patterns instantly.</p>
            </div>
            <div className="feature-card glass-panel">
              <h3>📊 Risk Scoring</h3>
              <p>Doesn't just give a yes/no. Provides a detailed probability percentage of the threat level.</p>
            </div>
            <div className="feature-card glass-panel">
              <h3>🕒 Scan History</h3>
              <p>Create an account to save all your past scans and monitor recurring threats over time.</p>
            </div>
            <div className="feature-card glass-panel">
              <h3>🔌 API Access</h3>
              <p>Integrate PhishX directly into your own applications with our blazing-fast FastAPI backend.</p>
            </div>
            <div className="feature-card glass-panel">
              <h3>🛡️ Browser Extension</h3>
              <p>(Coming Soon) Real-time protection that automatically scans links before you click them.</p>
            </div>
          </div>
        </section>
        
        {/* FOOTER */}
        {/* ENHANCED FOOTER */}
        <footer className="footer">
          <div className="footer-box">
            <div className="footer-top">
              <div className="footer-brand">
                <img src="/logo.png" alt="PhishX Logo" className="footer-logo" />
                <p className="footer-desc">
                  Next-generation AI phishing detection. Securing your digital presence with advanced machine learning.
                </p>
                <div className="footer-socials">
                  <a href="#"><FaGithub /></a>
                  <a href="#"><FaTwitter /></a>
                  <a href="#"><FaLinkedin /></a>
                </div>
              </div>
              
              <div className="footer-links-group">
                <div className="footer-col">
                  <h4>Product</h4>
                  <a href="#scan">Scanner</a>
                  <a href="#features">Features</a>
                  <a href="#">API Access</a>
                  <a href="#">Browser Extension</a>
                </div>
                <div className="footer-col">
                  <h4>Resources</h4>
                  <a href="#">Documentation</a>
                  <a href="#">Threat Database</a>
                  <a href="#">Blog</a>
                  <a href="#">Help Center</a>
                </div>
                <div className="footer-col">
                  <h4>Legal</h4>
                  <a href="#">Privacy Policy</a>
                  <a href="#">Terms of Service</a>
                  <a href="#">Security</a>
                </div>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p className="copyright">&copy; 2025 PhishX. Built by Udit Pandya • B.Tech CSE.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}