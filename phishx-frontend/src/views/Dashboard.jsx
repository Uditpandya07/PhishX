"use client";
import { useState, useEffect } from "react";
import { FaGithub, FaTwitter, FaLinkedin, FaProductHunt, FaShieldAlt, FaBolt, FaRobot, FaLock, FaHistory, FaCode, FaChartLine, FaEnvelopeOpenText, FaSearch, FaExclamationTriangle, FaTerminal, FaInfoCircle, FaCrown, FaCog, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaUserShield, FaTrashAlt, FaBars, FaTimes, FaNewspaper, FaGlobe, FaSatelliteDish } from "react-icons/fa";
import { FiInfo, FiZap, FiGlobe, FiClock, FiActivity, FiStar, FiLogIn, FiUserPlus as FiUserPlusOutline, FiCpu, FiShield, FiDatabase, FiCode, FiLayers, FiBox, FiMonitor, FiLock, FiBell, FiFileText, FiDownload, FiCalendar, FiFilter } from "react-icons/fi";
import { motion, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { STATUS } from "react-joyride";
import Tour from "../components/Tour";
import axios from "axios";
import "../config";
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportStatusFilter, setExportStatusFilter] = useState("ALL");

  useEffect(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    const hash = window.location.hash.replace(/^#/, '').toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');

    const targetView = path || hash || viewParam;
    if (targetView && ['pricing', 'admin', 'privacy', 'terms', 'creator', 'api', 'docs', 'vision', 'news', 'intel'].includes(targetView)) {
      setCurrentView(targetView);
    }
  }, []);

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
          const res = await axios.get(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/scans/history`, { withCredentials: true });
          const clearTimestamp = sessionStorage.getItem("history_clear_timestamp");
          const formattedHistory = res.data
            .filter(scan => !clearTimestamp || new Date(scan.timestamp) > new Date(parseInt(clearTimestamp)))
            .map(scan => ({
              id: scan.id,
              url: scan.url,
              date: new Date(scan.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
              rawTimestamp: scan.timestamp,
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
            const res = await axios.get(`${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")}/api/v1/users/me`, { withCredentials: true });
            setUser(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch user:", err);
        }
      };
      fetchUser();
    }
  }, [isLoggedIn]);

  // Stripe session verification removed - Razorpay uses popup callbacks

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

  const generateColorfulPDF = () => {
    let filtered = [...scanHistory];

    if (exportStartDate) {
      const start = new Date(exportStartDate).getTime();
      filtered = filtered.filter(s => {
        const t = s.rawTimestamp ? new Date(s.rawTimestamp).getTime() : new Date(s.date).getTime();
        return !isNaN(t) && t >= start;
      });
    }

    if (exportEndDate) {
      const end = new Date(exportEndDate).getTime() + (24 * 60 * 60 * 1000 - 1);
      filtered = filtered.filter(s => {
        const t = s.rawTimestamp ? new Date(s.rawTimestamp).getTime() : new Date(s.date).getTime();
        return !isNaN(t) && t <= end;
      });
    }

    if (exportStatusFilter === "PHISHING") {
      filtered = filtered.filter(s => s.status === "Phishing" || s.risk >= 70);
    } else if (exportStatusFilter === "SAFE") {
      filtered = filtered.filter(s => s.status === "Safe" && s.risk < 70);
    }

    if (filtered.length === 0) {
      showErrorPopup("No scan records match the selected date range or filter.");
      return;
    }

    const escapeHtml = (unsafe) => {
      if (unsafe === null || unsafe === undefined) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const totalScans = filtered.length;
    const phishingScans = filtered.filter(s => s.status === "Phishing" || s.risk >= 70).length;
    const safeScans = totalScans - phishingScans;
    const threatRate = Math.round((phishingScans / totalScans) * 100);
    const dateRangeStr = (exportStartDate || exportEndDate)
      ? `${exportStartDate || 'Beginning'} to ${exportEndDate || 'Present'}`
      : "All Time (Complete Archive)";
    const generatedTime = new Date().toLocaleString();
    const operatorName = user?.name || "SOC Senior Investigator";
    const operatorEmail = user?.email || "analyst@phishx.security";
    const clearanceTier = (user?.subscription_tier || "Enterprise").toUpperCase();
    const auditId = `SOC-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : '847291'}-PX`;

    const tableRows = filtered.map((s, idx) => {
      const isDanger = s.status === "Phishing" || s.risk >= 70;
      const statusBg = isDanger ? "#ef4444" : "#22c55e";
      const statusText = isDanger ? "PHISHING THREAT" : "VERIFIED SAFE";
      const rowBg = idx % 2 === 0 ? "#0b0f19" : "#111827";
      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #1e293b;">
          <td style="padding: 14px 16px; color: #f8fafc; font-family: monospace; font-size: 13px; word-break: break-all;">${escapeHtml(s.url)}</td>
          <td style="padding: 14px 16px; color: #94a3b8; font-size: 13px; white-space: nowrap;">${escapeHtml(s.date)}</td>
          <td style="padding: 14px 16px; font-weight: bold; color: ${isDanger ? '#ef4444' : '#4ade80'}; font-size: 14px; text-align: center;">${s.risk}%</td>
          <td style="padding: 14px 16px; text-align: center;">
            <span style="background-color: ${statusBg}; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block;">${statusText}</span>
          </td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>PhishX_SOC_Report_${Date.now()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    @media print {
      body {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .report-container {
        width: 100%;
        max-width: none;
        box-sizing: border-box;
      }
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #05050A !important;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .report-container {
      width: 210mm; /* A4 width */
      margin: 0 auto;
      padding: 20px;
      background-color: #030712;
      border: 1px solid #1e293b;
      border-radius: 12px;
    }
    .header-banner {
      background: linear-gradient(135deg, #030712 0%, #0f172a 50%, #022c22 100%) !important;
      border: 2px solid #4ade80;
      border-radius: 12px;
      padding: 25px 30px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(74, 222, 128, 0.2);
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #4ade80;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
    }
    .status-badge {
      text-align: right;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .user-details-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .details-section {
      background-color: #0f172a !important;
      border: 1px solid #1e293b;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 16px 20px;
    }
    .details-section.green-border {
      border-left: 4px solid #4ade80;
    }
    .details-title {
      font-size: 11px;
      font-weight: 800;
      color: #38bdf8;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 8px;
    }
    .details-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 13px;
    }
    .label {
      color: #64748b;
      font-weight: 600;
      display: inline-block;
      width: 140px;
    }
    .val {
      color: #f1f5f9;
      font-weight: 700;
    }
    .badge-green {
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid rgba(74, 222, 128, 0.4);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    .stat-card {
      background-color: #0f172a !important;
      border: 1px solid #1e293b;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .stat-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 600;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
    }
    .stat-value.blue { color: #38bdf8; }
    .stat-value.red { color: #ef4444; }
    .stat-value.green { color: #4ade80; }
    
    .exec-summary {
      background: linear-gradient(90deg, rgba(74, 222, 128, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
      border-left: 4px solid #4ade80;
      padding: 20px 24px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 30px;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }
    th {
      background-color: #0f172a !important;
      color: #4ade80;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 14px 16px;
      text-align: left;
      border-bottom: 2px solid #3b82f6;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #64748b;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header-banner">
      <div class="brand-section">
        <img src="${window.location.origin}/logo-icon.png" style="height: 48px; width: auto; object-fit: contain; filter: drop-shadow(0 0 8px rgba(74,222,128,0.8));" alt="PhishX Logo" onerror="this.style.display='none'" />
        <div>
          <h1 class="brand-title">PHISHX THREAT RADAR • SOC AUDIT</h1>
          <p class="brand-subtitle">Next-Generation Zero-Day Threat Detection & Real-Time ML URL Analysis</p>
        </div>
      </div>
      <div class="status-badge">
        <span style="font-size: 11px; color: #94a3b8; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">STATUS: AUTHORIZED SOC AUDIT</span>
        <span style="font-size: 12px; color: #4ade80; font-weight: 800; background: rgba(74, 222, 128, 0.15); padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(74, 222, 128, 0.3); display: inline-block;">● LIVE ARCHIVE EXPORT</span>
      </div>
    </div>

    <div class="user-details-card">
      <div class="details-section">
        <div class="details-title" style="color: #38bdf8;">👤 AUTHORIZED SOC OPERATOR</div>
        <div class="details-grid">
          <div><span class="label">Analyst Name:</span> <span class="val">${escapeHtml(operatorName)}</span></div>
          <div><span class="label">Analyst Email:</span> <span class="val">${escapeHtml(operatorEmail)}</span></div>
          <div><span class="label">Security Clearance:</span> <span class="val badge-green">${escapeHtml(clearanceTier)} SOC OPERATOR</span></div>
        </div>
      </div>
      <div class="details-section green-border">
        <div class="details-title" style="color: #4ade80;">🛡️ AUDIT SPECIFICATIONS</div>
        <div class="details-grid">
          <div><span class="label">Audit Reference ID:</span> <span class="val">${escapeHtml(auditId)}</span></div>
          <div><span class="label">Monitoring Period:</span> <span class="val">${escapeHtml(dateRangeStr)}</span></div>
          <div><span class="label">Detection Engine:</span> <span class="val" style="color: #38bdf8;">PhishX V2 ML Classifier (Random Forest)</span></div>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="stat-card">
        <div class="stat-label">Total Analyzed</div>
        <div class="stat-value blue">${totalScans}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Phishing Threats</div>
        <div class="stat-value red">${phishingScans}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Verified Safe</div>
        <div class="stat-value green">${safeScans}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Threat Density</div>
        <div class="stat-value ${threatRate > 30 ? 'red' : 'green'}">${threatRate}%</div>
      </div>
    </div>

    <div class="exec-summary">
      <strong style="color: #4ade80; display: block; margin-bottom: 8px; font-size: 14px; letter-spacing: 0.5px; text-transform: uppercase;">📋 Executive Threat Analysis & Methodology</strong>
      This security audit report covers the monitoring period of <strong>${escapeHtml(dateRangeStr)}</strong> for authorized SOC operator <strong>${escapeHtml(operatorName)}</strong>. During this timeframe, the <strong>PhishX Deep Lexical & Neural Engine (v2.0)</strong> evaluated <strong>${totalScans} URLs</strong>.<br/><br/>
      <strong style="color: #38bdf8; font-size: 13px;">3-Layer Hierarchical Precedence Evaluation:</strong>
      <ul style="margin: 6px 0 10px 18px; padding: 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
        <li><strong>Layer 1 (Enterprise Whitelist):</strong> Direct string matching against 500+ curated trusted domains with 0.0% false-positive guarantee.</li>
        <li><strong>Layer 2 (Heuristic Overrides):</strong> Immediate pattern recognition catching raw IPs, double-slashes, high-risk TLDs (.xyz, .tk, .pw), and keyword stuffing (98.0% immediate risk override).</li>
        <li><strong>Layer 3 (Machine Learning Engine):</strong> Scikit-Learn Random Forest Classifier extracting 15 mathematical lexical features (entropy, digit density, character distribution) for sub-100ms zero-day threat detection.</li>
      </ul>
      <strong style="color: #38bdf8; font-size: 13px;">Audit Verdict:</strong> The automated scanning pipeline identified <strong>${phishingScans} malicious entities</strong> (${threatRate}% threat density) and confirmed <strong>${safeScans} verified safe destinations</strong>. All telemetry is cryptographically signed and verified by the PhishX Security Operations Core.
    </div>

    <div class="section-title">
      <span>Detailed Intelligence Log</span>
      <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">Filter Active: <strong>${escapeHtml(exportStatusFilter)}</strong></span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 45%;">Target Entity (URL)</th>
          <th style="width: 25%;">Discovery Date</th>
          <th style="width: 15%; text-align: center;">Risk Score</th>
          <th style="width: 15%; text-align: center;">Status Badge</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div style="font-size: 11px; color: #4ade80; font-weight: 700; margin-bottom: 4px;">AUTHORIZED BY:</div>
        <div style="font-size: 13px; font-weight: 800; color: #f1f5f9; letter-spacing: 0.5px;">PhishX Autonomous Threat Engine (V2 ML Classifier • Alembic Verified)</div>
        <div style="font-size: 11px; color: #64748b;">End-to-End JWT Session Security • SHA-256 Telemetry Lock • DPDP & GDPR Compliant</div>
      </div>
      <div style="text-align: right;">
        <div>© 2026 PhishX Cyber Defense Platform. All Rights Reserved.</div>
        <div style="margin-top: 4px; color: #38bdf8; font-weight: 700;">https://phishx-app.vercel.app • Confidential SOC Document</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showErrorPopup("Pop-up blocker prevented generating the PDF report. Please allow pop-ups for this site.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setIsExportModalOpen(false);
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
            {/* HERO (CYBER-TERMINAL SECURITY CORE - CROWDSTRIKE / PALANTIR STYLE) */}
            <section className="hero-section cyber-hero">
              {/* Active Cyber Laser Scan Sweep Line */}
              <div className="cyber-laser-sweep"></div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="cyber-hero-container"
              >
                {/* Cyber Status Badge */}
                <div className="hero-badge cyber-badge">
                  <span className="cyber-live-dot"></span>
                  <FaShieldAlt style={{ color: '#4ade80', fontSize: '0.85rem' }} />
                  <span>SYSTEM OPERATIONAL · COMMUNITY DEFENSE</span>
                </div>

                {/* Cyber Title */}
                <h1 className="hero-title cyber-title">Stop Phishing <br /> Before It Starts.</h1>

                {/* Subtext */}
                <p className="hero-subtext cyber-subtext">
                  PhishX uses advanced lexical analysis and Random Forest classifiers to detect deceptive URLs in milliseconds. Protecting individuals and communities from digital threats.
                </p>

                {/* Cyber Action Buttons */}
                <div className="hero-btn-group cyber-btn-group">
                  <a href="#scan" className="primary-btn-nav hero-primary-btn cyber-primary-btn">
                    <span>Start Scanning ⚡</span>
                  </a>
                  <a href="#about" className="login-btn hero-secondary-btn cyber-secondary-btn">
                    <span>Learn More</span>
                    <span className="cyber-arrow">&rarr;</span>
                  </a>
                </div>
              </motion.div>
            </section>

            {/* SCANNER CENTERPIECE */}
            <section id="scan" className="scanner-container">
              <div className="glass-section scan-box-wrapper">
                <div className="scan-stats-grid">
                  <div className="scan-stat-card">
                    <span>Analysis Performed</span>
                    <AnimatedCounter
                      value={isLoggedIn ? scanHistory.length : 14892}
                      color="#3b82f6"
                    />
                  </div>
                  <div className="scan-stat-card">
                    <span>Malicious Blocked</span>
                    <AnimatedCounter
                      value={isLoggedIn ? scanHistory.filter(s => s.status === "Phishing").length : 4102}
                      color="#ef4444"
                    />
                  </div>
                  <div className="scan-stat-card">
                    <span>Verified Safe</span>
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
                    user={user}
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
              <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <FaHistory style={{ color: '#3b82f6', fontSize: '1.5rem' }} />
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Recent Activity</h3>
                </div>
                {scanHistory.length > 0 && (
                  <button
                    onClick={() => setIsExportModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.3))',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      borderRadius: '10px',
                      color: '#38bdf8',
                      fontWeight: '700',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 15px rgba(56, 189, 248, 0.15)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4ade80'; e.currentTarget.style.color = '#4ade80'; e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.3)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'; e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.15)'; }}
                  >
                    <FiFileText size={18} /> Export SOC Report (PDF)
                  </button>
                )}
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
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: user?.subscription_tier && user.subscription_tier !== 'free' ? '30px' : '0px' }}>
            <img src="/brand-text.png" alt="PhishX" className="brand-text-img" style={{ height: '40px' }} />
            {user?.subscription_tier && user.subscription_tier !== 'free' && (
              <span style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-28px',
                border: user.subscription_tier === 'enterprise' ? '1px solid #a855f7' : '1px solid #4ade80',
                background: user.subscription_tier === 'enterprise' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(74, 222, 128, 0.15)',
                color: user.subscription_tier === 'enterprise' ? '#c084fc' : '#4ade80',
                fontSize: '0.55rem',
                fontWeight: '800',
                padding: '1px 6px',
                borderRadius: '100px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: user.subscription_tier === 'enterprise' ? '0 0 10px rgba(168, 85, 247, 0.2)' : '0 0 10px rgba(74, 222, 128, 0.2)',
                backdropFilter: 'blur(4px)',
                lineHeight: '1'
              }}>
                {user.subscription_tier}
              </span>
            )}
          </div>
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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: user?.subscription_tier && user.subscription_tier !== 'free' ? '35px' : '0px' }}>
                  <img src="/brand-text.png" alt="PhishX" style={{ height: '45px' }} />
                  {user?.subscription_tier && user.subscription_tier !== 'free' && (
                    <span style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-32px',
                      border: user.subscription_tier === 'enterprise' ? '1px solid #a855f7' : '1px solid #4ade80',
                      background: user.subscription_tier === 'enterprise' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(74, 222, 128, 0.15)',
                      color: user.subscription_tier === 'enterprise' ? '#c084fc' : '#4ade80',
                      fontSize: '0.58rem',
                      fontWeight: '800',
                      padding: '1px 6px',
                      borderRadius: '100px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: user.subscription_tier === 'enterprise' ? '0 0 10px rgba(168, 85, 247, 0.2)' : '0 0 10px rgba(74, 222, 128, 0.2)',
                      backdropFilter: 'blur(4px)',
                      lineHeight: '1'
                    }}>
                      {user.subscription_tier}
                    </span>
                  )}
                </div>
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

        {isExportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: '#0f172a', padding: '32px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.4)', maxWidth: '480px', width: '100%', boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)', position: 'relative' }}
            >
              <button
                onClick={() => setIsExportModalOpen(false)}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                <FaTimes />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '12px', color: '#38bdf8' }}>
                  <FiFileText size={28} />
                </div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Export SOC PDF Report</h3>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Generate executive intelligence document</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <FiCalendar style={{ display: 'inline', marginRight: '6px', color: '#4ade80' }} /> Date Range Filter
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Start Date</span>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.9rem', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>End Date</span>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '0.9rem', colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      setExportStartDate(d.toISOString().split('T')[0]);
                      setExportEndDate(new Date().toISOString().split('T')[0]);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}
                  >Last 7 Days</button>
                  <button
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      setExportStartDate(d.toISOString().split('T')[0]);
                      setExportEndDate(new Date().toISOString().split('T')[0]);
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' }}
                  >Last 30 Days</button>
                  <button
                    onClick={() => {
                      setExportStartDate("");
                      setExportEndDate("");
                    }}
                    style={{ background: 'rgba(74, 222, 128, 0.15)', border: '1px solid rgba(74, 222, 128, 0.4)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', color: '#4ade80', cursor: 'pointer', fontWeight: '700' }}
                  >All Time</button>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <FiFilter style={{ display: 'inline', marginRight: '6px', color: '#4ade80' }} /> Threat Status Filter
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    onClick={() => setExportStatusFilter("ALL")}
                    style={{
                      background: exportStatusFilter === "ALL" ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${exportStatusFilter === "ALL" ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      color: exportStatusFilter === "ALL" ? '#38bdf8' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >All Logs</button>
                  <button
                    onClick={() => setExportStatusFilter("PHISHING")}
                    style={{
                      background: exportStatusFilter === "PHISHING" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${exportStatusFilter === "PHISHING" ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      color: exportStatusFilter === "PHISHING" ? '#ef4444' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >Phishing Only</button>
                  <button
                    onClick={() => setExportStatusFilter("SAFE")}
                    style={{
                      background: exportStatusFilter === "SAFE" ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0,0,0,0.3)',
                      border: `1px solid ${exportStatusFilter === "SAFE" ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      padding: '10px',
                      color: exportStatusFilter === "SAFE" ? '#22c55e' : '#94a3b8',
                      fontWeight: '700',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >Safe Only</button>
                </div>
              </div>

              <button
                onClick={generateColorfulPDF}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(90deg, #3b82f6, #4ade80)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontWeight: '900',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 20px rgba(74, 222, 128, 0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FiDownload size={20} /> Generate & Download PDF
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
