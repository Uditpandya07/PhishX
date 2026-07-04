import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPaperPlane, FaTimes, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './ContactModal.css';

export default function ContactModal({ isOpen, onClose, userToken }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus('loading');
    try {
      await axios.post(
        `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')}/api/v1/contact/submit`,
        { query_text: query }
      );
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
        setQuery('');
      }, 3000);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.response?.data?.detail || 'Failed to submit query. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div 
            className="contact-modal glass-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close" onClick={onClose}><FaTimes /></button>
            
            <div className="modal-header">
              <h2>Contact Support</h2>
              <p>Send a secure message directly to the PhishX admin team.</p>
            </div>

            {status === 'success' ? (
              <div className="success-message">
                <FaCheckCircle style={{ fontSize: '3rem', color: '#4ade80', marginBottom: '15px', display: 'block', margin: '0 auto 15px auto' }} />
                <h3>Query Submitted!</h3>
                <p>We've received your message and will review it shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label htmlFor="query">Your Message (Max 1000 chars)</label>
                  <textarea 
                    id="query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    maxLength={1000}
                    placeholder="Describe your issue, report a bug, or ask a question..."
                    required
                  />
                  <span className="char-count">{query.length}/1000</span>
                </div>

                {status === 'error' && (
                  <div className="error-banner">
                    <FaExclamationTriangle /> {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="primary-btn submit-btn"
                  disabled={status === 'loading' || !query.trim()}
                >
                  {status === 'loading' ? 'Sending...' : <><FaPaperPlane /> Send Message</>}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
