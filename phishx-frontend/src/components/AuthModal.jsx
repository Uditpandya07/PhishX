import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // 🔥 NEW: This teleports the modal to the front!
import { FaTimes, FaEye, FaEyeSlash, FaGoogle, FaGithub } from "react-icons/fa";
import "./AuthModal.css";

export default function AuthModal({ isOpen, onClose, initialMode = "login", onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === "login");
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setIsLoading(false);
    setShowPassword(false);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const validateForm = () => {
    if (!isLogin && name.trim() === "") return "Full Name is required to sign up.";
    if (!email.includes("@") || !email.includes(".")) return "Please enter a valid email address.";
    
    if (!hasLength || !hasUpper || !hasNumber || !hasSymbol) {
      return "Please meet all the password requirements.";
    }
    return null; 
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) onLoginSuccess();
    }, 1500);
  };

  // We wrap the entire modal in a variable
  const modalContent = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        
        <button className="close-btn" onClick={onClose} disabled={isLoading}>
          <FaTimes />
        </button>
        
        <h2 className="modal-title">{isLogin ? "Welcome Back" : "Create Account"}</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
          
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
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

          {(!isLogin || password.length > 0) && (
            <div className="password-checklist">
              <span className={hasLength ? "valid" : "invalid"}>{hasLength ? "✔️" : "❌"} 8+ chars</span>
              <span className={hasUpper ? "valid" : "invalid"}>{hasUpper ? "✔️" : "❌"} 1 Uppercase</span>
              <span className={hasNumber ? "valid" : "invalid"}>{hasNumber ? "✔️" : "❌"} 1 Number</span>
              <span className={hasSymbol ? "valid" : "invalid"}>{hasSymbol ? "✔️" : "❌"} 1 Symbol</span>
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

        <div className="social-login-divider">
          <span>or continue with</span>
        </div>
        <div className="social-buttons">
          <button type="button" className="social-btn"><FaGoogle /> Google</button>
          <button type="button" className="social-btn"><FaGithub /> GitHub</button>
        </div>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => { if (!isLoading) setIsLogin(!isLogin); }}
            style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );

  // 🔥 NEW: Render the modal directly onto the document body so nothing can block it!
  return createPortal(modalContent, document.body);
}