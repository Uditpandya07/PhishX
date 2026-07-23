"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FaShieldAlt, FaExclamationTriangle } from "react-icons/fa";
import { API_URL, isConfigured } from "../config";
import Landing from "../views/Landing";
import Dashboard from "../views/Dashboard";
import ErrorPopup from "../components/ErrorPopup";
axios.defaults.withCredentials = true;
// ─── Config Error Screen ───────────────────────────────────────────────────
function ConfigError() {
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#020617",
      color: "#fff",
      padding: "20px",
      textAlign: "center",
      gap: "16px",
      fontFamily: "Inter, sans-serif"
    }}>
      <FaExclamationTriangle style={{ fontSize: "3rem", color: "#f59e0b" }} />
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
        Backend Not Configured
      </h1>
      <p style={{ color: "#94a3b8", maxWidth: 460, lineHeight: 1.7, margin: 0 }}>
        The <code style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#7B61FF" }}>VITE_API_URL</code> environment variable is missing or invalid.
      </p>
      <div style={{
        background: "#0f172a",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: "16px 24px",
        textAlign: "left",
        maxWidth: 460,
        width: "100%"
      }}>
        <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          To fix this:
        </p>
        <ol style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 2, paddingLeft: 18, margin: 0 }}>
          <li>Go to <strong style={{ color: "#e2e8f0" }}>Vercel Dashboard</strong> → your project → <strong style={{ color: "#e2e8f0" }}>Settings</strong> → <strong style={{ color: "#e2e8f0" }}>Environment Variables</strong></li>
          <li>Add: <code style={{ background: "#1e293b", padding: "1px 5px", borderRadius: 4, color: "#4ade80" }}>VITE_API_URL = https://your-backend.onrender.com</code></li>
          <li><strong style={{ color: "#e2e8f0" }}>Redeploy</strong> the project</li>
        </ol>
      </div>
    </div>
  );
}
// ─── Main App ──────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entered, setEntered] = useState(false);
  const [notification, setNotification] = useState(null);
  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };
  useEffect(() => {
    // If not configured, skip all auth checks
    if (!isConfigured) {
      setCheckingAuth(false);
      return;
    }
    // Fail-safe: ensure the app eventually stops loading even if network hangs
    const failSafe = setTimeout(() => setCheckingAuth(false), 3000);
    // The backend uses HttpOnly cookies for authentication.
    // axios.defaults.withCredentials = true is set globally at the top of this file.
    const checkAuth = async () => {
      try {
        await axios.get(`${API_URL}/api/v1/users/me`);
        setIsLoggedIn(true);
        setEntered(true);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("verified") === "true") {
      triggerNotification("Email Verified Successfully! You can now access all features.");
      window.history.replaceState({}, document.title, "/");
    } else if (urlParams.get("error") === "verification_failed") {
      triggerNotification("Verification failed or link expired. Please try again.");
      window.history.replaceState({}, document.title, "/");
    }
    return () => {
      clearTimeout(failSafe);
    };
  }, []);
  // Show full-screen config error if VITE_API_URL is missing/invalid
  if (!isConfigured) return <ConfigError />;
  if (checkingAuth) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617"
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 40, height: 40, border: "4px solid #1e293b", borderTopColor: "#4ade80", borderRadius: "50%" }}
        />
      </div>
    );
  }
  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: "-50%" }}
            animate={{ y: 20, opacity: 1, x: "-50%" }}
            exit={{ y: -50, opacity: 0, x: "-50%" }}
            style={{
              position: "fixed",
              left: "50%",
              zIndex: 9999,
              background: "rgba(15, 23, 42, 0.9)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(74, 222, 128, 0.3)",
              padding: "10px 20px",
              borderRadius: "100px",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              fontWeight: 600,
              fontSize: "0.9rem"
            }}
          >
            <FaShieldAlt style={{ color: "#4ade80" }} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!entered ? (
          <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <Landing onEnter={() => setEntered(true)} />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Dashboard
              onLogout={async () => {
                try {
                  await axios.post(`${API_URL}/api/v1/auth/logout`);
                } catch (e) {
                  console.error("Logout request failed:", e);
                }
                sessionStorage.removeItem("token");
                localStorage.removeItem("phishx_token");
                setEntered(false);
                setIsLoggedIn(false);
                triggerNotification("Logged out successfully.");
              }}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
              setEntered={setEntered}
              triggerNotification={triggerNotification}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <ErrorPopup />
    </>
  );
}

