import { motion } from 'framer-motion';
import { Scale, ExternalLink, Zap, CheckCircle2 } from 'lucide-react';

const LEGAL_DOCS = [
  {
    title: "1. Terms of Service & Acceptable Use Policy",
    subtitle: "Effective January 1, 2025. Legally Binding Agreement.",
    points: [
      "1.1. Service Provision: Phyloc Email Intelligence is an autonomous threat intelligence service provided as a feature of the PhishX platform, operated exclusively by PhishX.",
      "1.2. Lawful Basis for Use: You represent and warrant that you possess the explicit, documented, and lawful authority to process and query the specific email addresses submitted to the Phyloc engine, pursuant to applicable cybersecurity or internal IT policies.",
      "1.3. Prohibited Conduct (Abuse): Automated abuse, unauthorized mass scraping, reverse-engineering of the trust scoring algorithm, and the utilization of scan results for unsolicited marketing (spam) or harassment are strictly prohibited and will result in immediate termination of the PhishX account.",
      "1.4. Disclaimers of Warranties: The Phyloc engine provides heuristic and OSINT-based intelligence 'AS IS' and 'AS AVAILABLE'. PhishX expressly disclaims all implied warranties of accuracy, merchantability, and fitness for a particular purpose.",
      "1.5. Limitation of Liability: Under no circumstances shall PhishX be liable for any direct, indirect, incidental, consequential, or punitive damages arising from false positives, false negatives, or any automated cybersecurity decisions made based on Phyloc verdicts.",
      "1.6. Indemnification: You agree to indemnify, defend, and hold harmless PhishX from any claims, damages, liabilities, or expenses (including legal fees) arising from your unlawful use of the Phyloc API or violation of these Terms."
    ]
  },
  {
    title: "2. Privacy Policy & Data Processing Agreement (DPA)",
    subtitle: "GDPR, CCPA, and Global Privacy Compliance",
    points: [
      "2.1. Data Collection: When utilizing the Phyloc engine, the specific email address queried, the resulting intelligence verdict, and associated metadata (e.g., timestamps) are securely stored in your PhishX account's encrypted scan history.",
      "2.2. Third-Party Sub-processors: Phyloc dynamically queries external OSINT databases (e.g., EmailRep, LeakCheck, XposedOrNot). By using this service, you acknowledge that queried email addresses may be transmitted securely to these authorized sub-processors. We do not sell your data.",
      "2.3. Zero-Knowledge Infrastructure: DNS, MX, and SMTP banner verifications are performed autonomously from our edge infrastructure. PhishX actively masks your origin IP, ensuring the target mail server is unaware of the scanning entity.",
      "2.4. Data Subject Rights (GDPR/CCPA): As the data controller, you are responsible for handling data subject access requests (DSARs). PhishX, acting as the data processor, provides API endpoints and dashboard controls to manually delete specific records from your scan history to comply with the 'Right to Be Forgotten'.",
      "2.5. Security Measures: All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256 block-level encryption."
    ]
  },
  {
    title: "3. Data Retention & Incident Response",
    subtitle: "Enterprise Data Governance",
    points: [
      "3.1. Standard Retention: Scan results and intelligence logs are retained within your PhishX dashboard for the lifetime of your active subscription unless manually purged.",
      "3.2. Account Termination: Upon cancellation or deletion of your PhishX account, all associated scan history, raw logs, and PII are permanently cryptographically purged within thirty (30) days in accordance with SOC 2 compliance standards.",
      "3.3. Aggregate Analytics: PhishX reserves the right to retain anonymized, aggregate metrics (e.g., global malicious domain trends, average trust scores) indefinitely for the purpose of training the autonomous threat engine.",
      "3.4. Incident Notification: In the event of a confirmed data breach compromising Phyloc scan histories, PhishX will notify the primary account administrator within 72 hours, detailing the scope of the incident and mitigation steps."
    ]
  },
  {
    title: "4. API Usage, Compliance, & Rate Limiting",
    subtitle: "Technical Guidelines and Constraints",
    points: [
      "4.1. Access & Authentication: API access is granted exclusively through secure bearer tokens generated within the PhishX platform. You are solely responsible for the rotation and security of your API keys.",
      "4.2. Rate Limiting: The Phyloc API is subject to dynamic rate limiting based on your PhishX subscription tier. Excessive polling or denial-of-service attempts against our infrastructure will trigger automated IP bans.",
      "4.3. Continuous Auditing: PhishX actively monitors API usage patterns for signs of credential stuffing or unauthorized bulk extraction. We reserve the right to temporarily suspend API access pending a security review if anomalous behavior is detected.",
      "4.4. Legal Compliance: You agree to comply with all applicable local, state, national, and international laws, including export control laws, when using the Phyloc engine."
    ]
  }
];

export default function LegalPricingView({ activeView }) {
  if (activeView === 'pricing') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hero-section"
        style={{ padding: '60px 20px', alignItems: 'center' }}
      >
        <Zap size={48} color="var(--warn)" style={{ marginBottom: '24px' }} />
        <h2 className="text-hero" style={{ margin: '0 0 16px 0', letterSpacing: '-0.04em' }}>Phyloc is included with PhishX</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 0 48px 0', fontSize: '1.2rem' }}>
          The Phyloc Email Intelligence scanner is a built-in feature of the PhishX platform.
          Upgrade your PhishX plan to unlock higher scan limits and priority processing.
        </p>

        <div className="dashboard-grid" style={{ maxWidth: '1000px', width: '100%' }}>
          {/* Pro Plan */}
          <div className="glass-panel" style={{ padding: 'clamp(20px, 5vw, 40px)', display: 'flex', flexDirection: 'column' }}>
            <h3 className="text-subtitle" style={{ margin: '0 0 8px 0' }}>PhishX Pro</h3>
            <div className="text-price" style={{ fontWeight: 700, margin: '0 0 24px 0' }}>
              See PhishX<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}> for pricing</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--safe)" /> Unlimited Email Scans</li>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--safe)" /> Full History &amp; Dashboard</li>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--safe)" /> Priority API Access</li>
            </ul>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              Upgrade on PhishX <ExternalLink size={16} />
            </a>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-panel" style={{ padding: 'clamp(20px, 5vw, 40px)', display: 'flex', flexDirection: 'column', border: '1px solid var(--accent)' }}>
            <div style={{ background: 'var(--accent)', color: '#000', fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', borderRadius: '999px', alignSelf: 'flex-start', marginBottom: '16px' }}>MOST POPULAR</div>
            <h3 className="text-subtitle" style={{ margin: '0 0 8px 0' }}>PhishX Enterprise</h3>
            <div className="text-price" style={{ fontWeight: 700, margin: '0 0 24px 0' }}>Custom</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--accent)" /> All Pro Features</li>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--accent)" /> SSO &amp; Advanced Audit Trails</li>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--accent)" /> Dedicated Success Manager</li>
              <li style={{ display: 'flex', gap: '8px' }}><CheckCircle2 size={18} color="var(--accent)" /> Custom SLA</li>
            </ul>
            <a href="/" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
              Contact Sales <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 0' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
        <Scale size={40} color="var(--text-secondary)" />
        <div>
          <h2 className="text-title" style={{ margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Legal &amp; Compliance</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>
            Operational boundaries and transparent data policies.
          </p>
        </div>
      </div>

      {LEGAL_DOCS.map((doc, idx) => (
        <div key={idx} className="glass-panel" style={{ padding: 'clamp(20px, 5vw, 40px)', marginBottom: '24px' }}>
          <h3 className="text-subtitle" style={{ margin: '0 0 8px 0' }}>{doc.title}</h3>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, margin: '0 0 24px 0' }}>{doc.subtitle}</p>
          <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {doc.points.map((pt, i) => (
              <li key={i} style={{ marginBottom: '12px' }}>{pt}</li>
            ))}
          </ul>
        </div>
      ))}
    </motion.div>
  );
}
