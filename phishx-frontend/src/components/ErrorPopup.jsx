"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExclamationTriangle, FaTimes, FaServer } from "react-icons/fa";

export default function ErrorPopup() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleShowError = (e) => setError(e.detail.message);
    window.addEventListener('show-error-popup', handleShowError);
    return () => window.removeEventListener('show-error-popup', handleShowError);
  }, []);

  return (
    <AnimatePresence>
      {error && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(2, 6, 23, 0.7)",
          backdropFilter: "blur(12px)",
          padding: "20px"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30, rotateX: -20 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            style={{
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "24px",
              padding: "40px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 0 1px rgba(239, 68, 68, 0.1) inset",
              position: "relative",
              overflow: "hidden",
              textAlign: "center"
            }}
          >
            {/* Background Glitch Accent */}
            <div style={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background: "conic-gradient(from 0deg at 50% 50%, rgba(239,68,68,0) 0%, rgba(239,68,68,0.05) 50%, rgba(239,68,68,0) 100%)",
              animation: "spin 10s linear infinite",
              zIndex: 0,
              pointerEvents: "none"
            }} />
            <style>{`
              @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>

            <button
              onClick={() => setError(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(255,255,255,0.05)",
                border: "none",
                color: "#94a3b8",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                zIndex: 2,
                fontSize: "1.2rem"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
            >
              ✕
            </button>

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, damping: 10 }}
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "2px solid rgba(239, 68, 68, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  boxShadow: "0 0 30px rgba(239, 68, 68, 0.4)"
                }}
              >
                <FaServer style={{ fontSize: "2rem", color: "#ef4444" }} />
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ color: "#f8fafc", fontSize: "1.5rem", margin: "0 0 10px 0", fontWeight: 700 }}
              >
                System Alert
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ color: "#cbd5e1", fontSize: "1rem", lineHeight: "1.6", margin: "0 0 30px 0", padding: "0 10px" }}
              >
                {error}
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => setError(null)}
                style={{
                  background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 30px",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 10px 20px -5px rgba(239, 68, 68, 0.4)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 25px -5px rgba(239, 68, 68, 0.5)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 20px -5px rgba(239, 68, 68, 0.4)"; }}
              >
                Acknowledge
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
