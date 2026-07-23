"use client";
import { motion } from "framer-motion";
import { FaGavel, FaBan, FaHandshake, FaGlobe, FaBalanceScale, FaFileContract, FaEnvelope } from "react-icons/fa";
import "./Legal.css";

export default function TermsOfService({ onContactSupport }) {
  return (
    <motion.div 
      className="legal-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="section-header">
        <h1 className="hero-title" style={{ fontSize: '3.5rem' }}>Terms of Service</h1>
        <p>Legally Binding Agreement for PhishX Platform Usage</p>
      </div>

      <div className="glass-section legal-content">
        <section>
          <h3><FaGavel /> 1. Acceptance of Terms & Capacity</h3>
          <p>
            By accessing or using the PhishX platform ("Service"), you enter into a legally binding agreement 
            with Udit Pandya ("Creator"). If you are using the Service on behalf of an organization, you represent 
            and warrant that you have the authority to bind that organization to these Terms.
          </p>
        </section>

        <section>
          <h3><FaBan /> 2. Acceptable Use Policy & Indian IT Act Compliance</h3>
          <p>
            You agree to use the Service in compliance with all applicable local and international laws, specifically 
            including the Information Technology Act, 2000 (India). You shall not: (a) test your own phishing 
            infrastructure to evade detection, (b) scrape, reverse-engineer, or systematically extract the underlying 
            Machine Learning models, (c) use the Service for any malicious cyber activities violating Section 43 or 66 
            of the IT Act.
          </p>
        </section>

        <section>
          <h3><FaHandshake /> 3. Limitation of Liability & "As-Is" Disclaimer</h3>
          <p>
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis. While our AI aims for high accuracy, 
            we do not warrant that the Service is error-free (i.e., immune to false positives or false negatives). 
            <strong>To the maximum extent permitted by law, PhishX and its Creator shall not be liable for any direct, 
            indirect, incidental, or consequential damages resulting from your reliance on the scan results.</strong> 
            Users must exercise independent judgment before interacting with analyzed links.
          </p>
        </section>

        <section>
          <h3><FaGlobe /> 4. Community Contributions & Licensing</h3>
          <p>
            By submitting feedback, reporting false positives, or interacting with community threat logs, you grant 
            PhishX a perpetual, worldwide, royalty-free license to use, aggregate, and incorporate this data to 
            improve the global detection engine, subject to the anonymization guarantees in our Privacy Policy.
          </p>
        </section>
        
        <section>
          <h3><FaBalanceScale /> 5. Webhook Integrations & Liability</h3>
          <p>
            By utilizing the SecOps Webhook feature to integrate with third-party services (e.g., Slack, Microsoft Teams), 
            you represent that you have the lawful right and authorization to transmit data to the designated endpoints. 
            PhishX is not liable for data breaches, data loss, or unauthorized access occurring on third-party platforms, 
            nor for any misconfiguration of webhook URLs by the user.
          </p>
        </section>

        <section>
          <h3><FaFileContract /> 6. Governing Law and Jurisdiction</h3>
          <p>
            These Terms of Service and any separate agreements whereby we provide you Services shall be governed by 
            and construed in accordance with the laws of India. Any disputes arising under or in connection with these 
            Terms shall be subject to the exclusive jurisdiction of the competent courts located in New Delhi, India.
          </p>
        </section>

        <section>
          <h3><FaFileContract /> 7. Severability & Modifications</h3>
          <p>
            If any provision of these Terms is deemed unlawful or unenforceable, that provision shall be severed, 
            and the remaining provisions will remain in full force and effect. We reserve the right to modify these 
            Terms at any time without prior notice.
          </p>
        </section>

        <section style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px', marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Effective Date: April 23, 2026. PhishX is operated by Udit Pandya.
          </p>
          <a href="#" onClick={(e) => { e.preventDefault(); if (onContactSupport) onContactSupport(); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '12px', color: '#60a5fa', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
            <FaEnvelope /> Contact Support
          </a>
        </section>
      </div>
    </motion.div>
  );
}
