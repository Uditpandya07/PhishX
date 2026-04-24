import { motion } from "framer-motion";
import { FaPython, FaReact, FaDatabase, FaShieldAlt } from "react-icons/fa";
import { SiFastapi, SiScikitlearn, SiSupabase, SiVite } from "react-icons/si";
import "./TechStack.css";

const tools = [
  { name: "FastAPI", icon: <SiFastapi />, desc: "High-performance backend engine" },
  { name: "Random Forest", icon: <SiScikitlearn />, desc: "Optimized ML Classifier" },
  { name: "React 19", icon: <FaReact />, desc: "Reactive & dynamic interface" },
  { name: "Supabase", icon: <SiSupabase />, desc: "Secure vector & relational data" },
  { name: "Python", icon: <FaPython />, desc: "Data processing & feature extraction" },
  { name: "Secure API", icon: <FaShieldAlt />, desc: "Protected endpoint infrastructure" }
];

export default function TechStack() {
  return (
    <section className="tech-stack-section">
      <h2 className="section-title">The Technology Behind PhishX</h2>
      <p className="tech-subtitle">Built with industry-leading tools to ensure millisecond-level precision and uncompromising security.</p>
      
      <div className="tech-grid">
        {tools.map((tool, i) => (
          <motion.div 
            key={i} 
            className="tech-card glass-panel"
            whileHover={{ y: -5, borderColor: "rgba(123, 97, 255, 0.4)" }}
          >
            <div className="tech-icon">{tool.icon}</div>
            <div className="tech-info">
              <h4>{tool.name}</h4>
              <p>{tool.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
