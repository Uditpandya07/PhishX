"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Navigation from "../../components/phyloc/Navigation";
import HeroSearch from "../../components/phyloc/HeroSearch";
import DashboardCharts from "../../components/phyloc/DashboardCharts";
import ResultsView from "../../components/phyloc/ResultsView";
import BulkView from "../../components/phyloc/BulkView";
import ApiView from "../../components/phyloc/ApiView";
import AdminView from "../../components/phyloc/AdminView";
import SettingsView from "../../components/phyloc/SettingsView";
import LegalPricingView from "../../components/phyloc/LegalPricingView";
import ThreatFeedView from "../../components/phyloc/ThreatFeedView";
import ExportView from "../../components/phyloc/ExportView";
import PhylocLogo from "../../components/phyloc/PhylocLogo";
import LiquidBackground from "../../components/phyloc/LiquidBackground";
import AuthModal from "../../components/AuthModal";
import { motion } from "framer-motion";
import { API_URL } from "../../config";
import "../../components/phyloc/phyloc.css";


axios.defaults.withCredentials = true;


export default function PhylocPage() {
  const [showSplash, setShowSplash] = useState(true);
  // PhishX uses httpOnly cookies, so we don't strictly need a local token,
  // but we can track session state based on whether API calls succeed.
  const [session, setSession] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [profileName, setProfileName] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // We should rely on the HttpOnly cookie by pinging /users/me, just like the main app does!
    axios.get(`${API_URL}/api/v1/users/me`)
      .then(userRes => {
        // User is authenticated!
        setSession(userRes.data);
        setProfileName(userRes.data.name || "PhishX User");
        
        // Now load their dashboard data
        return axios.get(`${API_URL}/api/v1/phyloc/dashboard`);
      })
      .then(dashboardRes => {
        setDashboard(dashboardRes.data);
        if (dashboardRes.data.latestLookup) {
          setLookupResult(dashboardRes.data.latestLookup);
        }
      })
      .catch(err => {
        // If /users/me fails, they are not authenticated.
        setSession(null);
        setDashboard(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    try {
      if (authMode === "login") {
        const formData = new URLSearchParams();
        formData.append("username", credentials.email);
        formData.append("password", credentials.password);

        const { data } = await axios.post(`${API_URL}/api/v1/auth/login`, formData, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });
        localStorage.setItem("phishx_token", data.access_token);
        setSession(data.user);
        setProfileName(data.user.name);
        setToast("Signed in.");
        
        // Load dashboard after login
        const dashboardRes = await axios.get(`${API_URL}/api/v1/phyloc/dashboard`);
        setDashboard(dashboardRes.data);
      } else {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/register`, {
          email: credentials.email,
          password: credentials.password,
          name: credentials.email.split("@")[0]
        });
        setToast("Account created. Please log in.");
        setAuthMode("login");
      }
    } catch (error) {
      setToast(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze(e) {
    if (e) e.preventDefault();
    if (!lookupEmail) return;

    setLookupLoading(true);
    setLookupResult(null);
    try {
      const { data } = await axios.post(`${API_URL}/api/v1/phyloc/lookups`, { email: lookupEmail });
      setLookupResult(data.lookup);
      setActiveView("results");
      
      // Refresh dashboard background silently
      if (session) {
        axios.get(`${API_URL}/api/v1/phyloc/dashboard`)
          .then(res => setDashboard(res.data))
          .catch(() => {});
      }
        
    } catch (error) {
      setToast(error.response?.data?.detail || error.message);
    } finally {
      setLookupLoading(false);
    }
  }

  function onSignOut() {
    axios.post(`${API_URL}/api/v1/auth/logout`).catch(() => {});
    localStorage.removeItem("phishx_token");
    setSession(null);
    setDashboard(null);
    setToast("Signed out.");
  }

  if (showSplash) {
    return (
      <>
        <LiquidBackground />
        <div style={{
          position: 'fixed', inset: 0, 
          backgroundColor: '#000000',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <PhylocLogo size={100} showText={true} />
          </motion.div>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <LiquidBackground />
        <div className="login-container" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <PhylocLogo size={64} showText={false} />
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <LiquidBackground />
        <div className="login-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <PhylocLogo size={64} showText={true} />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel login-card"
            style={{ padding: '48px', marginTop: '40px', maxWidth: '450px', textAlign: 'center' }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', color: '#fff' }}>Sign in to continue</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
              Phyloc Email Intelligence is now exclusively available through the PhishX platform. Please log in to your PhishX account to use the scanner.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="btn-primary"
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '14px 28px', 
                fontSize: '1rem', 
                width: '100%', 
                textDecoration: 'none',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to PhishX Login
            </button>
            <div style={{ marginTop: '24px' }}>
              <a 
                href="/"
                style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Return to PhishX Home
              </a>
            </div>
          </motion.div>
        </div>
        
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
          initialMode="login" 
          onLoginSuccess={() => window.location.reload()} 
        />
      </>
    );
  }

  return (
    <>
      <LiquidBackground />
      <div className="app-shell" style={{ padding: '20px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navigation 
          profileName={profileName}
          activeView={activeView}
          setActiveView={setActiveView}
          onSignOut={onSignOut}
        />
        
        <main className="page-shell" style={{ flex: 1, marginTop: '20px' }}>
          {(activeView === "dashboard" || activeView === "results") && (
            <HeroSearch 
              lookupEmail={lookupEmail} 
              setLookupEmail={setLookupEmail} 
              handleAnalyze={handleAnalyze} 
              lookupLoading={lookupLoading} 
            />
          )}

          {activeView === "dashboard" && dashboard && (
            <DashboardCharts dashboard={dashboard} />
          )}

          {activeView === "results" && (
            <ResultsView result={lookupResult} />
          )}

          {activeView === "threat-feed" && dashboard && (
            <ThreatFeedView dashboard={dashboard} />
          )}

          {activeView === "export" && dashboard && (
            <ExportView dashboard={dashboard} />
          )}

          {activeView === "bulk" && (
            <BulkView dashboard={dashboard} token={localStorage.getItem("phishx_token")} fetchJson={async (url, opts) => {
              const res = await axios(`${API_URL}${url}`, opts);
              return res.data;
            }} refreshDashboard={() => {
              axios.get(`${API_URL}/api/v1/phyloc/dashboard`)
                .then(res => setDashboard(res.data))
                .catch(() => {});
            }} />
          )}



          {activeView === "admin" && dashboard && (
            <AdminView dashboard={dashboard} />
          )}


          {(activeView === "legal" || activeView === "pricing") && (
            <LegalPricingView fetchJson={async (url, opts) => {
              const res = await axios(url, opts);
              return res.data;
            }} activeView={activeView} />
          )}
        </main>
        
        <footer className="site-footer">
          {/* Left Column */}
          <div className="footer-column" style={{ alignItems: 'flex-start', maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhylocLogo size={24} showText={true} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              Enterprise-grade email threat intelligence for modern security operations.
            </p>
          </div>
          
          {/* Center Column - Navigation */}
          <div className="footer-nav">
            <button className="footer-link" onClick={() => setActiveView('pricing')}>Pricing</button>
            <button className="footer-link" onClick={() => setActiveView('legal')}>Legal & Privacy</button>
          </div>
          
          {/* Right Column */}
          <div className="footer-column" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
            <div className="footer-status">
              <div className="footer-status-dot" />
              All Systems Operational
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>© {new Date().getFullYear()} PhishX.</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>SOC 2 Type II Compliant</div>
            </div>
          </div>
        </footer>

        {toast && <div className="toast" style={{ position: 'fixed', bottom: '20px', background: '#333', padding: '10px 20px', borderRadius: '8px', color: '#fff' }}>{toast}</div>}
      </div>
    </>
  );
}
