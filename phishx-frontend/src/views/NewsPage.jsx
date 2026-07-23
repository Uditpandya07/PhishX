"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSatelliteDish, FaExternalLinkAlt, FaClock, FaUser, FaStar, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import SpotlightCard from '../components/SpotlightCard';
import { API_URL } from '../config';
import { showErrorPopup } from "../utils/errorHandler";

export default function NewsPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // SEO: Update the document title dynamically when the user opens this page
    const originalTitle = document.title;
    document.title = "CyberPulse - Live Tech & Cybersecurity News | PhishX";
    
    const fetchNews = async (isBackgroundRefresh = false) => {
      try {
        if (!isBackgroundRefresh) setLoading(true);
        // Fetch top stories from our own Backend Proxy to bypass all AdBlockers and CORS issues!
        const res = await axios.get(`${API_URL}/api/v1/news/`);
        
        if (res.data.status === 'success') {
          setStories(res.data.data.filter(story => story && story.url));
        } else {
          throw new Error(res.data.message || "Backend error");
        }
      } catch (err) {
        console.error("Failed to fetch news:", err);
        setError(`Failed to load live news: ${err.message || 'Network Error'}`);
        showErrorPopup(`CyberPulse Desync: ${err.message || 'Network Error'}`);
      } finally {
        if (!isBackgroundRefresh) setLoading(false);
      }
    };

    // Fetch immediately on load
    fetchNews();

    // Set up auto-refresh every 5 minutes (300,000 ms)
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing news feed...");
      fetchNews(true);
    }, 300000);

    // Cleanup interval and title when user leaves the page
    return () => {
      document.title = originalTitle;
      clearInterval(intervalId);
    };
  }, []);

  const timeAgo = (unixTimestamp) => {
    const seconds = Math.floor(Date.now() / 1000) - unixTimestamp;
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + (interval === 1 ? " year ago" : " years ago");
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + (interval === 1 ? " month ago" : " months ago");
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + (interval === 1 ? " day ago" : " days ago");
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + (interval === 1 ? " hour ago" : " hours ago");
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + (interval === 1 ? " min ago" : " mins ago");
    
    return "just now";
  };

  const getDomain = (url) => {
    if (!url) return "news.ycombinator.com";
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch (e) {
      return "External Source";
    }
  };

  const getTags = (title) => {
    const t = title.toLowerCase();
    const tags = [];
    if (t.includes('ai') || t.includes('gpt') || t.includes('llm')) tags.push('Artificial Intelligence');
    if (t.includes('hack') || t.includes('breach') || t.includes('phish') || t.includes('security')) tags.push('Cybersecurity');
    if (t.includes('crypto') || t.includes('bitcoin')) tags.push('Crypto');
    if (t.includes('apple') || t.includes('mac') || t.includes('ios')) tags.push('Apple');
    if (t.includes('google') || t.includes('android')) tags.push('Google');
    if (t.includes('microsoft') || t.includes('windows')) tags.push('Microsoft');
    if (tags.length === 0) tags.push('Tech News');
    return tags.slice(0, 2);
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      style={{ minHeight: '80vh', padding: '120px 20px 60px', background: 'transparent', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}
    >
      <header style={{ textAlign: 'left', marginBottom: '50px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
            <FaSatelliteDish style={{ fontSize: '2rem', color: '#ec4899' }} aria-hidden="true" />
          </div>
          <div>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 8vw, 3rem)', 
              fontWeight: 900, 
              color: '#fff', 
              margin: 0, 
              fontFamily: '"Orbitron", "Space Grotesk", sans-serif',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(236, 72, 153, 0.4)'
            }}>
              CYBER<span style={{ color: '#ec4899', fontWeight: 400 }}>pulse</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>powered by</span>
              <span style={{ 
                fontSize: '1rem', 
                fontWeight: 800, 
                letterSpacing: '1px',
                background: 'linear-gradient(90deg, #3b82f6, #4ade80)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                PhishX
              </span>
            </div>
          </div>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '800px', marginTop: '25px', marginBottom: '10px' }}>
          <strong>CyberPulse</strong> is your live intelligence hub for global cybersecurity events. 
          Powered by NESA AI and real-time news aggregators, CyberPulse tracks emerging threat vectors, 
          active phishing campaigns, and critical zero-day vulnerabilities as they happen around the world.
        </p>
      </header>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: 40, height: 40, border: "4px solid #1e293b", borderTopColor: "#ec4899", borderRadius: "50%" }}
          />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: '#ef4444', padding: '40px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      ) : (
        <motion.div 
          style={{ display: 'flex', flexDirection: 'column', gap: '25px', maxWidth: '800px', margin: '0 auto', paddingBottom: '60px' }}
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          {stories.map((story, index) => (
            <motion.div 
              key={story.id || index}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50, damping: 10 } }
              }}
            >
              <SpotlightCard spotlightColor="rgba(236, 72, 153, 0.4)">
                <article>
                  <a 
                    href={story.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        {getTags(story.title).map(tag => (
                          <span key={tag} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px', lineHeight: '1.5' }}>
                        {story.title}
                      </h2>
                      
                      <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                        Dive into this breaking report from <strong>{getDomain(story.url)}</strong>. Stay informed on the latest technical details and potential impact of this development.
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '15px', color: '#64748b', fontSize: '0.85rem', marginBottom: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 600 }}>
                          <FaStar aria-hidden="true" /> {story.score || story.points || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <FaUser style={{ color: '#94a3b8' }} aria-hidden="true" /> {story.by || story.author}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FaClock style={{ color: '#94a3b8' }} aria-hidden="true" /> {timeAgo(story.time)}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Read Source <FaExternalLinkAlt />
                      </span>
                    </div>
                  </a>
                </article>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.main>
  );
}
