import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import ElectricBorder from "./ElectricBorder";
import "./ScanPanel.css";

export default function ScanPanel() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scan = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post("http://127.0.0.1:8000/predict", { url });
      setResult(res.data);
    } catch (err) {
      alert("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? Math.round(result.risk_score) : 0;
  const isDanger = risk > 50;

  return (
    <div className="scan-section-container">
      {/* Increased chaos and changed color to match logo Green (#4ade80) */}
      <ElectricBorder color="#4ade80" speed={2} chaos={0.25} borderRadius={24}>
        <div className="scan-card large">
          <h2>Scan URL</h2>

          <div className="input-group">
            <input
              className="large-input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <button className="large-button" onClick={scan} disabled={loading}>
              {loading ? "Scanning..." : "Scan Now"}
            </button>
          </div>

          {result && (
            <motion.div
              className={`result ${isDanger ? "danger" : "safe"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="result-title">
                {isDanger ? "🚨 High Risk URL" : "✅ Safe URL"}
              </h3>
              <p className="result-text">Risk Score: {risk}%</p>
              <div className="risk-bar">
                <div
                  className={`risk-fill ${isDanger ? "danger-fill" : "safe-fill"}`}
                  style={{ width: `${risk}%` }}
                ></div>
              </div>
            </motion.div>
          )}
        </div>
      </ElectricBorder>
    </div>
  );
}