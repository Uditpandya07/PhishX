import { motion } from 'framer-motion';
import { Code2, Terminal, Info } from 'lucide-react';

export default function ApiView({ dashboard }) {

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
            <Info size={20} color="var(--accent)" style={{ marginTop: '3px', flexShrink: 0 }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0' }}>PhishX API Integration</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                The Phyloc email scanner is now powered by the PhishX backend. Use the PhishX API to
                programmatically scan emails. Authentication uses your PhishX session cookie.
              </p>
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: 'var(--accent)', fontSize: '0.9rem' }}>
              Endpoint
            </p>
            <code style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontSize: '1rem' }}>
              POST /api/v1/phyloc/lookups
            </code>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <Terminal size={18} /> cURL Example
          </h4>
          <pre style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
            <code>
{`curl -X POST http://localhost:8000/api/v1/phyloc/lookups \\
  -H "Content-Type: application/json" \\
  --cookie "access_token=YOUR_SESSION_COOKIE" \\
  -d '{"email":"test@example.com"}'`}
            </code>
          </pre>
        </div>
        
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <Code2 size={18} /> JavaScript (fetch) Example
          </h4>
          <pre style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
            <code>
{`const response = await fetch('/api/v1/phyloc/lookups', {
  method: 'POST',
  credentials: 'include', // sends PhishX session cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@example.com' })
});

const data = await response.json();
console.log(data.lookup.trustScore);`}
            </code>
          </pre>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <h4 style={{ margin: '0 0 16px 0' }}>Response Schema</h4>
          <pre style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
            <code>
{`{
  "lookup": {
    "email": "string",
    "verdict": "Safe | Low Risk | Caution | High Risk | Critical Risk",
    "trustScore": 0-100,
    "riskLevel": "low | medium | high | critical",
    "signals": ["array of threat signals"],
    "dns": { "hasMx": bool, "mxRecords": [...] },
    "disposable": { "isDisposable": bool },
    "emailrep": { "found": bool, "suspicious": bool, ... },
    "leakcheck": { "found": bool, "sources": [...] },
    "xposedornot": { "found": bool, "breaches": [...] }
  }
}`}
            </code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}


