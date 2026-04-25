import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FaShieldAlt } from "react-icons/fa";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("token"));
  const [entered, setEntered] = useState(false);
  const [notification, setNotification] = useState(null);

  const triggerNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    // Check if we are coming back from Google
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (code) {
      // Exchange code for token at our backend
      axios.post("http://127.0.0.1:8000/api/v1/auth/google/callback", { code })
        .then(res => {
          sessionStorage.setItem("token", res.data.access_token);
          setIsLoggedIn(true);
          setEntered(true);
          triggerNotification("Authentication Successful! Welcome back.");
        })
        .catch(err => {
          console.error("Google Auth failed:", err);
          setEntered(false);
        })
        .finally(() => {
          window.history.replaceState({}, document.title, "/");
        });
    }
  }, []);

  const isCallback = useMemo(() => new URLSearchParams(window.location.search).has("code"), []);
  const showLanding = !entered && !isCallback;

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
              onLogout={() => { setEntered(false); setIsLoggedIn(false); triggerNotification("Logged out successfully."); }} 
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