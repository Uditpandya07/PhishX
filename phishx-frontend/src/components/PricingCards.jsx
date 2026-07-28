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
    price: "₹0",
    features: ["Unlimited Scans", "AI Classification", "Scan History", "Community Support"],
    buttonText: "Current Plan",
    disabled: true,
  },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹999',
      description: 'Advanced protection for professionals',
      features: [
        'Advanced AI Analysis',
        'Unlimited Scans',
        'Priority Support',
        'Detailed Reports',
        'API Access (100 req/day)'
      ],
      buttonText: "Upgrade to Pro",
      highlight: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '₹4,999',
      description: 'Custom solutions for teams',
      features: [
        'Everything in Pro',
        'Custom Integrations',
        '24/7 Phone Support',
        'Dedicated Account Manager',
        'Unlimited API Access',
        'Custom Training Models'
      ],
      buttonText: "Upgrade to Enterprise"
    }
];

export default function PricingCards({ user }) {
  const userTier = user?.subscription_tier || "free";

  const handleUpgrade = async (planId) => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/v1/payments/create-subscription`, { plan_id: planId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { subscription_id, amount, currency, key_id } = res.data;

      const options = {
          key: key_id,
          amount: amount,
          currency: currency,
          name: "PhishX",
          description: `Upgrade to ${planId.toUpperCase()}`,
          subscription_id: subscription_id,
          handler: async function (response) {
              try {
                  await axios.post(`${API_URL}/api/v1/payments/verify-payment`, {
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_subscription_id: response.razorpay_subscription_id,
                      razorpay_signature: response.razorpay_signature,
                      plan_id: planId
                  }, {
                      headers: { Authorization: `Bearer ${token}` }
                  });
                  alert("Upgrade successful! Welcome to " + planId.toUpperCase());
                  window.location.reload();
              } catch (err) {
                  showErrorPopup("Payment verification failed: " + (err.response?.data?.detail || "Unknown error"));
              }
          },
          prefill: {
              name: user?.name || "",
              email: user?.email || ""
          },
          theme: {
              color: "#3b82f6"
          }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          showErrorPopup("Payment failed: " + response.error.description);
      });
      rzp.open();
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
      <h2 className="pricing-header">Upgrade Your Protection</h2>
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
