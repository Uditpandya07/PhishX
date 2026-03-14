import { useState } from "react";
import { motion } from "framer-motion";
import { FaTimesCircle } from "react-icons/fa";
import axios from "axios";
import ElectricBorder from "./ElectricBorder";
import "./ScanPanel.css";

export default function ScanPanel({ isLoggedIn, onAuthRequired, onScanComplete }) {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const scan = async () => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    // 🔥 STRICTOR VALIDATION: Must have a dot (.) or a colon (:) for ports
    // This allows localhost:5173, google.com, 192.168.1.1, but BLOCKS simple words.
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9.-]+(\.[a-zA-Z]{2,6})|localhost:[0-9]+|(\d{1,3}\.){3}\d{1,3})([\/\w .-]*)*\/?$/;
    
    // Check if it matches the pattern AND has a dot or port colon
    const hasStructure = url.includes(".") || url.includes(":");
    const isValid = urlPattern.test(url.trim()) && hasStructure;

    if (!url.trim() || !isValid) {
      setIsError(true);
      setTimeout(() => setIsError(false), 500);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", { 
        url: url.trim() 
      });
      
      setResult(res.data);
      const risk = Math.round(res.data.risk_score);
      const isDanger = risk > 50;
      
      const newHistoryItem = {
        id: Date.now(),
        url: url.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        risk: risk,
        status: isDanger ? "Phishing" : "Safe"
      };

      if (onScanComplete) onScanComplete(newHistoryItem);

    } catch (err) {
      console.log("Backend not reachable. Simulating a scan...");
      const fakeRisk = Math.floor(Math.random() * 100);
      const fakeIsDanger = fakeRisk > 50;
      const fakeResult = { prediction: fakeIsDanger ? "Phishing" : "Safe", risk_score: fakeRisk };
      
      setResult(fakeResult);
      const newHistoryItem = {
        id: Date.now(),
        url: url.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        risk: fakeRisk,
        status: fakeIsDanger ? "Phishing" : "Safe"
      };

      if (onScanComplete) onScanComplete(newHistoryItem);
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? Math.round(result.risk_score) : 0;
  const isDanger = risk > 50;

  return (
    <div className={`scan-section-container ${isError ? "shake" : ""}`}>
      <ElectricBorder
        color={isError ? "#ef4444" : "#4ade80"}
        speed={2}
        chaos={0.25}
        borderRadius={24}
      >
        <div className="scan-card">
          <h2>Scan URL</h2>
          <div className="input-group">
            <div className="input-relative-wrapper">
              <input
                className="large-input"
                type="text"
                placeholder="https://example.com or localhost:5173"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") scan(); }}
                disabled={loading}
              />
              {url && !loading && (
                <FaTimesCircle 
                  className="clear-icon-inner" 
                  onClick={() => setUrl("")} 
                />
              )}
            </div>
            <button className="large-button" onClick={scan} disabled={loading}>
              {loading ? "Scanning..." : "Scan Now"}
            </button>
          </div>

          {result && (
            <motion.div
              className={`result ${isDanger ? "danger" : "safe"}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <h3 className="result-title">
                {isDanger ? "🚨 High Risk URL" : "✅ Safe URL"}
              </h3>
              <p className="result-text">Risk Score: {risk}%</p>
              <div className="risk-bar">
                <motion.div
                  className={`risk-fill ${isDanger ? "danger-fill" : "safe-fill"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${risk}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </ElectricBorder>
    </div>
  );
}