import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose, initialMode = "login", onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  // Sync internal state with the mode clicked on Dashboard
  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    // This triggers the handleLoginSuccess in Dashboard.jsx
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        <h2 className="modal-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" placeholder="John Doe" required />
            </div>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required />
          </div>
          <button type="submit" className="primary-btn full-width">
            {isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );
}