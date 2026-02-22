import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
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
    <motion.div
      className="scan-card"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2>Scan URL</h2>

      <input
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <button onClick={scan} disabled={loading}>
        {loading ? "Scanning..." : "Scan Now"}
      </button>

      {result && (
        <motion.div
          className={`result ${isDanger ? "danger" : "safe"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3>
            {isDanger ? "🚨 High Risk URL" : "✅ Safe URL"}
          </h3>

          <p>Risk Score: {risk}%</p>

          <div className="risk-bar">
            <div
              className={`risk-fill ${isDanger ? "danger-fill" : "safe-fill"}`}
              style={{ width: `${risk}%` }}
            ></div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}