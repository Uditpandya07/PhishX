import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCookieBite, FaTimes } from 'react-icons/fa';
import './CookieBanner.css';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted/declined cookies
    const consent = localStorage.getItem('phishx_cookie_consent');
    if (!consent) {
      // Delay showing it slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('phishx_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('phishx_cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="cookie-banner-wrapper"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className="cookie-banner glass-panel">
            <div className="cookie-content">
              <div className="cookie-icon">
                <FaCookieBite />
              </div>
              <div className="cookie-text">
                <h3>We use cookies</h3>
                <p>
                  PhishX uses cookies to ensure secure authentication, analyze traffic, and provide a better user experience. By clicking "Accept All", you consent to our use of cookies in accordance with our <a href="/#privacy">Privacy Policy</a>.
                </p>
              </div>
            </div>
            <div className="cookie-actions">
              <button className="cookie-btn cookie-decline" onClick={handleDecline}>
                Decline All
              </button>
              <button className="cookie-btn cookie-accept" onClick={handleAccept}>
                Accept All
              </button>
              <button className="cookie-close-btn" onClick={handleDecline} aria-label="Close">
                <FaTimes />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
