import { motion } from "framer-motion";
import axios from "axios";
import { FaCheck } from "react-icons/fa";
import "./PricingCards.css";

const plans = [
  {
    id: "free",
    name: "Standard",
    price: "$0",
    features: ["Unlimited Scans", "AI Classification", "Scan History", "Community Support"],
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    features: ["Advanced AI Analysis", "Priority Support", "Detailed Risk Insights", "Automated Alerts"],
    buttonText: "Coming Soon",
    disabled: true,
    comingSoon: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    features: ["Custom AI Training", "Team Management", "Dedicated Support", "Full Analytics Suite"],
    buttonText: "Coming Soon",
    disabled: true,
    comingSoon: true,
  }
];

export default function PricingCards({ user }) {
  const handleUpgrade = async (planId) => {
    if (planId === "enterprise") {
      window.location.href = "mailto:sales@phishx.com";
      return;
    }
    
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(`http://127.0.0.1:8000/api/v1/payments/create-checkout-session?plan_id=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert("Failed to start payment: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  return (
    <div className="pricing-container">
      <h2 className="section-title">Upgrade Your Protection</h2>
      <div className="pricing-grid">
        {plans.map((plan) => (
          <motion.div 
            key={plan.id}
            className={`pricing-card glass-panel ${plan.highlight ? 'highlight' : ''}`}
            whileHover={{ translateY: -10 }}
          >
            {plan.highlight && <div className="popular-tag">Most Popular</div>}
            <h3>{plan.name}</h3>
            <div className="price">{plan.price}<span>/mo</span></div>
            <ul className="features-list">
              {plan.features.map((feature, i) => (
                <li key={i}><FaCheck className="check-icon" /> {feature}</li>
              ))}
            </ul>
            <button 
              className={`primary-btn ${plan.disabled ? 'disabled-btn' : ''}`}
              onClick={() => !plan.disabled && handleUpgrade(plan.id)}
              disabled={plan.disabled || (user?.subscription_tier === plan.id)}
            >
              {user?.subscription_tier === plan.id ? "Current Plan" : plan.buttonText}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
