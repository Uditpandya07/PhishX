import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";
import { supabase } from "./supabaseClient";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

axios.defaults.withCredentials = true;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [entered, setEntered] = useState(false);
  const [notification, setNotification] = useState(null);
  const codeProcessed = useRef(false);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    // Fail-safe: ensure the app eventually stops loading even if network hangs
    const failSafe = setTimeout(() => {
      setCheckingAuth(false);
    }, 3000);

    // Add axios interceptor for auth
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        let token = sessionStorage.getItem("token") || localStorage.getItem("phishx_token");
        
        // Only check Supabase if no local token is found (prevents slow requests)
        if (!token) {
          try {
            const { data } = await supabase.auth.getSession();
            token = data.session?.access_token;
          } catch (e) {
            console.warn("Supabase session check skipped/failed");
          }
        }

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const checkAuth = async () => {
      try {
        await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/me`);
        setIsLoggedIn(true);
        setEntered(true);
      } catch (err) {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle Email Verification Results
    if (urlParams.get("verified") === "true") {
      triggerNotification("Email Verified Successfully! You can now access all features.");
      window.history.replaceState({}, document.title, "/");
    } else if (urlParams.get("error") === "verification_failed") {
      triggerNotification("Verification failed or link expired. Please try again.");
      window.history.replaceState({}, document.title, "/");
    }

    // Check if we are coming back from Google (Backend-driven OAuth)
    const code = urlParams.get("code");
    
    if (code && !codeProcessed.current) {
      codeProcessed.current = true;
      setCheckingAuth(true);
      axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/google/callback`, { code })
        .then(res => {
          if (res.data.access_token) {
            sessionStorage.setItem("token", res.data.access_token);
            localStorage.setItem("phishx_token", res.data.access_token);
          }
          setIsLoggedIn(true);
          setEntered(true);
          triggerNotification("Authentication Successful! Welcome back.");
        })
        .catch(err => {
          console.error("Google Auth failed:", err);
          triggerNotification("Google login failed. Please try again or use email.");
        })
        .finally(() => {
          setCheckingAuth(false);
          // Clean up the URL
          window.history.replaceState({}, document.title, "/");
        });
    }

    return () => {
      axios.interceptors.request.eject(interceptor);
      clearTimeout(failSafe);
    };
  }, []);

  const isCallback = useMemo(() => new URLSearchParams(window.location.search).has("code"), []);
  const showLanding = !entered && !isCallback;

  if (checkingAuth) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#020617',
        color: '#fff'
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 40, height: 40, border: '4px solid #1e293b', borderTopColor: '#4ade80', borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Global Notification Toast (Outside of page transitions) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 20, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            style={{
              position: 'fixed',
              left: '50%',
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              padding: '10px 20px',
              borderRadius: '100px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <FaShieldAlt style={{ color: '#4ade80' }} />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Landing onEnter={() => setEntered(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* We pass the onLogout function and login state to Dashboard here */}
            <Dashboard 
              onLogout={async () => { 
                try {
                  await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/logout`);
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
    </>
  );
}