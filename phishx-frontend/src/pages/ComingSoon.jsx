import { motion } from "framer-motion";
import "./Legal.css";

export default function ComingSoon({ title, subtitle, icon: Icon }) {
  return (
    <motion.div 
      className="coming-soon-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="glass-section coming-soon-box">
        <div className="icon-pulse">
          <Icon />
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="progress-track">
          <div className="progress-fill"></div>
        </div>
        <span className="status-badge">Development in Progress</span>
      </div>
    </motion.div>
  );
}
