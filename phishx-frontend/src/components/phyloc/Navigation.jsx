import { useState, useEffect } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PhylocLogo from './PhylocLogo';

export default function Navigation({ profileName, activeView, setActiveView, onSignOut }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "threat-feed", label: "Threat Feed" },
    { id: "bulk", label: "Bulk Scan" },
    { id: "export", label: "Export" }
  ];

  // Close sidebar when navigating or resizing
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <motion.header 
        className="nav-header"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="nav-brand" onClick={() => setActiveView('dashboard')}>
          <PhylocLogo size={28} showText={true} />
        </div>
        
        {/* Desktop Links */}
        <div className="nav-links desktop-only">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeView === item.id ? "active" : ""}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="nav-actions">
          <a
            href="/"
            className="desktop-only"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '999px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--text-secondary)', fontSize: '0.85rem',
              fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <ArrowLeft size={16} />
            Back to PhishX
          </a>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </motion.header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="sidebar-overlay">
            <motion.div 
              className="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              className="sidebar-content glass-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="sidebar-header">
                <h3>Menu</h3>
                <button className="btn-close" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="sidebar-links">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={activeView === item.id ? "active" : ""}
                    onClick={() => setActiveView(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
                
                <div style={{ height: '1px', background: 'var(--border)', margin: '15px 0' }} />
                
                <a
                  href="/"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px 16px', borderRadius: '8px',
                    color: 'var(--text-secondary)', fontSize: '1rem',
                    textDecoration: 'none', transition: 'color 0.2s'
                  }}
                >
                  <ArrowLeft size={18} />
                  Back to PhishX
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
