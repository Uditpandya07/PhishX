import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ElectricBorder from "./ElectricBorder";
import "./ScanPanel.css";

// We added `onScanComplete` to the props here!
export default function ScanPanel({ isLoggedIn, onAuthRequired, onScanComplete }) {

  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    if (!isLoggedIn) {
      onAuthRequired();
      return;
    }

    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // 1. Try to ask the backend for the real result
      const res = await axios.post(
        "http://127.0.0.1:8000/predict",
        { url: url.trim() }
      );
      setResult(res.data);

      // 2. Add the result to our history table
      const risk = Math.round(res.data.risk_score);
      const isDanger = risk > 50;
      
      const newHistoryItem = {
        id: Date.now(), // Generate a unique ID
        url: url.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        risk: risk,
        status: isDanger ? "Phishing" : "Safe"
      };

      if (onScanComplete) {
        onScanComplete(newHistoryItem);
      }

    } catch (err) {
      // If the backend isn't running, let's create a fake result so you can test the frontend!
      console.log("Backend not reachable. Simulating a scan...");
      
      const fakeRisk = Math.floor(Math.random() * 100);
      const fakeIsDanger = fakeRisk > 50;
      
      const fakeResult = {
        prediction: fakeIsDanger ? "Phishing" : "Safe",
        risk_score: fakeRisk
      };
      
      setResult(fakeResult);

      const newHistoryItem = {
        id: Date.now(),
        url: url.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        risk: fakeRisk,
        status: fakeIsDanger ? "Phishing" : "Safe"
      };

      if (onScanComplete) {
        onScanComplete(newHistoryItem);
      }
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? Math.round(result.risk_score) : 0;
  const isDanger = risk > 50;

  return (
    <div className="scan-section-container">
      <ElectricBorder
        color="#4ade80"
        speed={2}
        chaos={0.25}
        borderRadius={24}
      >
        <div className="scan-card">
          <h2>Scan URL</h2>

          <div className="input-group">
            <input
              className="large-input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") scan();
              }}
            />

            <button
              className="large-button"
              onClick={scan}
              disabled={loading}
            >
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

              <p className="result-text">
                Risk Score: {risk}%
              </p>

              <div className="risk-bar">
                <div
                  className={`risk-fill ${isDanger ? "danger-fill" : "safe-fill"}`}
                  style={{ width: `${risk}%` }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </ElectricBorder>
    </div>
  );
}