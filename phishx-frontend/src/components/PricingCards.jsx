"use client";
import { motion } from "framer-motion";
import axios from "axios";
import { FaCheck } from "react-icons/fa";
import { showErrorPopup } from "../utils/errorHandler";
import { API_URL } from "../config";
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
    price: "$9.99",
    features: ["Advanced AI Analysis", "Priority Support", "Detailed Risk Insights", "Automated Alerts"],
    buttonText: "Upgrade to Pro",
    disabled: false,
    comingSoon: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$49.99",
    features: ["Custom AI Training", "Team Management", "Dedicated Support", "Full Analytics Suite"],
    buttonText: "Upgrade to Enterprise",
    disabled: false,
    comingSoon: false,
  }
];

export default function PricingCards({ user }) {
  const userTier = user?.subscription_tier || "free";

  const handleUpgrade = async (planId) => {
    if (planId === "enterprise") {
      // Allow self-serve enterprise checkout too!
    }
    
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/v1/payments/create-checkout-session?plan_id=${planId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      showErrorPopup("Failed to start payment: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const getButtonText = (plan) => {
    if (userTier === plan.id) return "Current Plan";
    if (plan.id === "free" && userTier !== "free") return "Basic Protection";
    return plan.buttonText;
  };

  const isButtonDisabled = (plan) => {
    if (userTier === plan.id) return true;
    if (plan.id === "free" && userTier !== "free") return true;
    return plan.disabled;
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
              className={`primary-btn ${isButtonDisabled(plan) ? 'disabled-btn' : ''}`}
              onClick={() => !isButtonDisabled(plan) && handleUpgrade(plan.id)}
              disabled={isButtonDisabled(plan)}
            >
              {getButtonText(plan)}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
