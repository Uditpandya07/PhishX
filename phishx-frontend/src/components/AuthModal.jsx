import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaEye, FaEyeSlash, FaGoogle, FaGithub, FaEnvelope, FaLock, FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import DotGrid from "./DotGrid";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose, initialMode = "login", onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === "login");
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setIsLoading(false);
    setShowPassword(false);
    setVerificationSent(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const validateForm = () => {
    if (!isLogin && name.trim() === "") return "Full Name is required to sign up.";
    if (!email.includes("@") || !email.includes(".")) return "Please enter a valid email address.";
    if (password.trim() === "") return "Password is required.";
    
    if (!isLogin) {
      if (!hasLength || !hasUpper || !hasNumber || !hasSymbol) {
        return "Please meet all the password requirements.";
      }
    }
    return null; 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setVerificationSent(false);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    const apiCall = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL;
        
        if (isLogin) {
          // Use our backend login
          const params = new URLSearchParams();
          params.append('username', email);
          params.append('password', password);
          
          const res = await axios.post(`${baseUrl}/api/v1/auth/login`, params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });

          // Check if we got a token in the response (some setups might return it in JSON)
          // But our backend currently sets a cookie. 
          // If it returns a token in JSON, we should save it.
          if (res.data.access_token) {
             sessionStorage.setItem("token", res.data.access_token);
             localStorage.setItem("phishx_token", res.data.access_token);
          }
          
          if (onLoginSuccess) onLoginSuccess(res.data.user || { email });
        } else {
          // Use our backend register
          const res = await axios.post(`${baseUrl}/api/v1/auth/register`, {
            email,
            password,
            name
          });

          // Show verification message
          setVerificationSent(true);
          triggerNotification && triggerNotification("Verification email sent! Please check your inbox.");
        }
      } catch (err) {
        let errorMsg = "Authentication failed.";
        if (err.response?.data?.detail) {
          const detail = err.response.data.detail;
          errorMsg = Array.isArray(detail) ? detail[0].msg : detail;
        } else {
          errorMsg = err.message || errorMsg;
        }
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    apiCall();
  };

  // We wrap the entire modal in a variable
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{ position: 'fixed', inset: 0, zIndex: -1, backgroundColor: '#000' }}>
        <DotGrid
          dotSize={4}
          gap={18}
          baseColor="#2a2a3f"
          activeColor="#7B61FF"
          proximity={140}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>
      
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        <button className="close-btn" onClick={onClose} disabled={isLoading}>
          <FaTimes />
        </button>
        
        <h2 className="modal-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={verificationSent ? "verification" : (isLogin ? "login" : "signup")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {verificationSent ? (
              <div className="verification-success" style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📧</div>
                <h3>Verify your email</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  We've sent a magic link to <strong>{email}</strong>.<br/> 
                  Please click the link in your email to activate your PhishX account.
                </p>
                <button 
                  className="primary-btn" 
                  style={{ marginTop: '20px', width: '100%' }}
                  onClick={onClose}
                >
                  Got it!
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              {!isLogin && (
                <div className="input-group">
                  <label><FaUser style={{marginRight: '6px'}} /> Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
              
              <div className="input-group">
                <label><FaEnvelope style={{marginRight: '6px'}} /> Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="input-group">
                <label><FaLock style={{marginRight: '6px'}} /> Password</label>
                <div className="password-wrapper">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={isLogin ? "Enter your password" : "Create a strong password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button 
                    type="button" 
                    className="eye-btn" 
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="password-checklist">
                  <span className={hasLength ? "valid" : "invalid"}>{hasLength ? "✔️" : "❌"} At least 8 characters</span>
                  <span className={hasUpper ? "valid" : "invalid"}>{hasUpper ? "✔️" : "❌"} One uppercase letter</span>
                  <span className={hasNumber ? "valid" : "invalid"}>{hasNumber ? "✔️" : "❌"} One number</span>
                  <span className={hasSymbol ? "valid" : "invalid"}>{hasSymbol ? "✔️" : "❌"} One special symbol</span>
                </div>
              )}
              
              <button 
                type="submit" 
                className="primary-btn" 
                style={{ width: "100%", opacity: isLoading ? 0.7 : 1, marginTop: "10px" }}
                disabled={isLoading}
              >
                {isLoading 
                  ? (isLogin ? "Logging in..." : "Creating account...") 
                  : (isLogin ? "Log In" : "Sign Up")}
              </button>
            </form>
          )}
        </motion.div>
        </AnimatePresence>

        <div className="social-login-divider">
          <span>or continue with</span>
        </div>
        <div className="social-buttons" style={{ display: "flex", justifyContent: "center" }}>
          <button 
            type="button" 
            className="social-btn google-login-btn" 
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL}/api/v1/auth/google/login`;
            }}
            style={{ 
              width: "100%", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "12px", 
              background: "#fff", 
              color: "#000", 
              fontWeight: "600",
              border: "none",
              padding: "12px"
            }}
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{ height: "20px" }} />
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </button>
        </div>

        <p className="auth-switch" style={{ marginTop: '20px' }}>
          {isLogin ? "New to PhishX? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#3b82f6', fontWeight: '700' }}>
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );

  // 🔥 NEW: Render the modal directly onto the document body so nothing can block it!
  return createPortal(modalContent, document.body);
}