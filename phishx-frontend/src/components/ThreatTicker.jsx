"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";

const THREATS = [
  { icon: <FaExclamationTriangle className="text-amber-500" />, text: "HIGH RISK: phishing-paypal-secure.xyz detected in London" },
  { icon: <FaShieldAlt className="text-blue-500" />, text: "SYSTEM: Deep Analysis Engine online and analyzing..." },
  { icon: <FaCheckCircle className="text-emerald-500" />, text: "SAFE: Google Drive oauth token validated" },
  { icon: <FaExclamationTriangle className="text-rose-500" />, text: "CRITICAL: Credential harvesting attempt blocked (IP: 192.168.1.1)" },
  { icon: <FaShieldAlt className="text-blue-500" />, text: "SYSTEM: 10,243 domains scanned in the last hour" },
];

export default function ThreatTicker() {
  const [items, setItems] = useState(THREATS);

  // Rotate items to create an infinite scroll effect without jumping
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const newArr = [...prev];
        const first = newArr.shift();
        newArr.push(first);
        return newArr;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: '100%', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
      overflow: 'hidden', display: 'flex', alignItems: 'center', height: '40px',
      padding: '0 16px', position: 'relative', boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '96px',
        background: 'linear-gradient(to right, #0f172a, transparent)', zIndex: 10
      }}></div>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '96px',
        background: 'linear-gradient(to left, #0f172a, transparent)', zIndex: 10
      }}></div>
      
      <div style={{
        display: 'flex', fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '0.1em',
        color: '#94a3b8', fontWeight: 600, alignItems: 'center', whiteSpace: 'nowrap'
      }}>
        <span style={{ color: '#10b981', marginRight: '16px', display: 'flex', alignItems: 'center' }}>
          <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px', marginRight: '8px' }}>
            <span style={{
              position: 'absolute', display: 'inline-flex', height: '100%', width: '100%',
              borderRadius: '9999px', backgroundColor: '#34d399', opacity: 0.75,
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}></span>
            <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '9999px', height: '8px', width: '8px', backgroundColor: '#10b981' }}></span>
          </span>
          LIVE FEED:
        </span>
        
        <div style={{ display: 'flex', gap: '3rem' }}>
          {items.map((item, idx) => (
            <motion.div
              key={item.text + idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {item.icon}
              <span>{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
