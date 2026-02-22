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
          className={`result ${result.prediction === "Phishing" ? "danger" : "safe"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3>
            {result.prediction === "Phishing" ? "🚨 Phishing Detected" : "✅ Safe URL"}
          </h3>
          <p>Risk Score: {result.risk_score}%</p>
        </motion.div>
      )}
    </motion.div>
  );
}