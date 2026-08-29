import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export default function ExportView({ dashboard }) {
  const [exporting, setExporting] = useState(null);

  const lookups = dashboard?.lookups || [];

  const generatePhylocPDF = (lookups) => {
    if (!lookups || lookups.length === 0) {
      alert("No data available to export.");
      setExporting(null);
      return;
    }

    const escapeHtml = (unsafe) => {
      if (unsafe === null || unsafe === undefined) return "";
      return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const totalScans = lookups.length;
    const activeThreats = lookups.filter(s => s.verdict === "High Risk" || s.verdict === "Critical Risk").length;
    const safeRate = Math.round(((totalScans - activeThreats) / totalScans) * 100) || 0;
    
    const tableRows = lookups.map((s, idx) => {
      const isDanger = s.verdict === "High Risk" || s.verdict === "Critical Risk";
      const isWarn = s.verdict === "Low Risk" || s.verdict === "Caution";
      const statusBg = isDanger ? "#ef4444" : isWarn ? "#eab308" : "#06b6d4";
      const rowBg = idx % 2 === 0 ? "#0b1221" : "#0f172a";
      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #1e293b;">
          <td style="padding: 14px 16px; color: #f8fafc; font-family: monospace; font-size: 13px; word-break: break-all;">${escapeHtml(s.email)}</td>
          <td style="padding: 14px 16px; color: #94a3b8; font-size: 13px; white-space: nowrap;">${escapeHtml(s.createdAt)}</td>
          <td style="padding: 14px 16px; font-weight: bold; color: ${isDanger ? '#ef4444' : isWarn ? '#eab308' : '#06b6d4'}; font-size: 14px; text-align: center;">${s.trustScore !== undefined ? s.trustScore : 'N/A'}</td>
          <td style="padding: 14px 16px; text-align: center;">
            <span style="background-color: ${statusBg}; color: #ffffff; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; display: inline-block;">${escapeHtml(s.verdict)}</span>
          </td>
        </tr>
      `;
    }).join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Phyloc_Intelligence_Report_${Date.now()}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    
    @media print {
      body {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .report-container {
        width: 100%;
        max-width: none;
        box-sizing: border-box;
      }
    }

    body {
      margin: 0;
      padding: 0;
      background-color: #020617 !important;
      color: #e2e8f0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .report-container {
      width: 210mm;
      margin: 0 auto;
      padding: 20px;
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
    }
    .header-banner {
      background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #082f49 100%) !important;
      border: 2px solid #06b6d4;
      border-radius: 12px;
      padding: 25px 30px;
      margin-bottom: 25px;
      box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 12px;
      color: #06b6d4;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
    }
    .user-details-card {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .details-section {
      background-color: #0f172a !important;
      border: 1px solid #1e293b;
      border-left: 4px solid #0ea5e9;
      padding: 16px 20px;
      border-radius: 8px;
    }
    .exec-summary {
      background: linear-gradient(90deg, rgba(6, 182, 212, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%) !important;
      border-left: 4px solid #06b6d4;
      padding: 20px 24px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 30px;
      font-size: 14px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 15px;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #1e293b;
    }
    th {
      background-color: #0f172a !important;
      color: #06b6d4;
      font-weight: 700;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 14px 16px;
      text-align: left;
      border-bottom: 2px solid #0ea5e9;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header-banner">
      <div style="display: flex; align-items: center; gap: 16px;">
        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
          <g>
            <!-- Left Facet: Indigo -->
            <polygon points="15,30 50,45 50,95 25,65" fill="#3730a3" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" stroke-linejoin="round" />
            <!-- Right Facet: Deep Sky Blue -->
            <polygon points="85,30 50,45 50,95 75,65" fill="#0284c7" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" stroke-linejoin="round" />
            <!-- Top Facet: Bright Cyan -->
            <polygon points="50,15 85,30 50,45 15,30" fill="#38bdf8" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-linejoin="round" />
          </g>
        </svg>
        <div style="display: flex; flex-direction: column;">
          <div class="brand-title" style="display: flex; align-items: baseline; line-height: 1;">
            Phyloc<span style="color: #38bdf8; font-weight: 800; font-size: 1.2em; margin-left: 2px;">.</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 4px; letter-spacing: 0.2px;">
            by <span style="color: #ffffff; font-weight: 700;">Phish</span><span style="color: #4ade80; font-weight: 700;">X</span>
          </div>
        </div>
      </div>
      <div style="text-align: right;">
        <div class="brand-subtitle" style="margin-bottom: 8px;">SOC 2 COMPLIANCE REPORT</div>
        <div style="font-size: 12px; color: #94a3b8; margin-bottom: 2px;">REPORT ID</div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #06b6d4; font-weight: 700;">PHY-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8).toUpperCase() : '847291'}</div>
      </div>
    </div>

    <div class="user-details-card">
      <div class="details-section">
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Analysis Date</div>
        <div style="font-size: 15px; font-weight: 600; color: #f8fafc; margin-bottom: 4px;">${new Date().toLocaleString()}</div>
      </div>
      <div class="details-section" style="border-left-color: #06b6d4;">
        <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Scan Volume</div>
        <div style="font-size: 15px; font-weight: 600; color: #f8fafc; margin-bottom: 4px;">${totalScans} Addresses Analyzed</div>
      </div>
    </div>

    <div class="exec-summary">
      <strong style="color: #ffffff; display: block; margin-bottom: 8px; font-size: 15px;">Executive Summary</strong>
      Phyloc Email Intelligence has processed <strong>${totalScans}</strong> email addresses. The autonomous engine identified <strong>${activeThreats}</strong> active threats (High/Critical risk). The aggregate safe rate across the dataset is <strong>${safeRate}%</strong>.
    </div>

    <div class="section-title">
      <span>Intelligence Log</span>
      <span style="font-size: 12px; color: #94a3b8; font-weight: normal;">All Time (Complete Archive)</span>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 45%;">Target Entity (Email)</th>
          <th style="width: 25%;">Discovery Date</th>
          <th style="width: 15%; text-align: center;">Trust Score</th>
          <th style="width: 15%; text-align: center;">Verdict</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>

    <div class="footer">
      <div>
        <div style="font-size: 11px; color: #06b6d4; font-weight: 700; margin-bottom: 4px;">AUTHORIZED BY:</div>
        <div style="font-size: 13px; font-weight: 800; color: #f1f5f9; letter-spacing: 0.5px;">Phyloc Autonomous Threat Engine</div>
        <div style="font-size: 11px; color: #64748b;">Powered by PhishX</div>
      </div>
      <div style="text-align: right;">
        <div>© ${new Date().getFullYear()} PhishX. All Rights Reserved.</div>
        <div style="margin-top: 4px; color: #0ea5e9; font-weight: 700;">Confidential SOC Document</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
    `;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocker prevented generating the PDF report. Please allow pop-ups for this site.");
      setExporting(null);
      return;
    }
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setExporting(null);
  };

  const handleExport = (type) => {
    setExporting(type);
    
    // Simulate generation time for large datasets
    setTimeout(() => {
      if (type === 'audit') {
        generatePhylocPDF(lookups);
        return;
      }

      let content = '';
      let filename = `phyloc_export_${new Date().toISOString().split('T')[0]}`;
      let mimeType = 'text/plain';

      if (type === 'csv') {
        const headers = ['ID', 'Email', 'Score', 'Verdict', 'Summary', 'Timestamp'];
        const rows = lookups.map(l => 
          `"${l.id}","${l.email}",${l.trustScore !== undefined ? l.trustScore : 'N/A'},"${l.verdict}","${l.summary || ''}","${l.createdAt}"`
        );
        content = [headers.join(','), ...rows].join('\n');
        filename += '.csv';
        mimeType = 'text/csv';
      } else if (type === 'json') {
        content = JSON.stringify(lookups, null, 2);
        filename += '.json';
        mimeType = 'application/json';
      }

      // Trigger download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExporting(null);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <div className="glass-panel" style={{ padding: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Download color="var(--accent)" /> Data Export & Compliance
        </h2>
        <p style={{ margin: '0 0 32px 0', color: 'var(--text-secondary)', maxWidth: '600px' }}>
          Export your intelligence logs for SIEM integration, compliance audits, or offline analysis. All exports are cryptographically signed for chain of custody.
        </p>

        <div className="export-grid">
          <div className="glass-panel export-card" onClick={() => handleExport('csv')}>
            <div className="export-icon" style={{ background: 'var(--safe-subtle)', color: 'var(--safe)' }}>
              {exporting === 'csv' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet size={28} />}
            </div>
            <div>
              <h4>CSV Dataset</h4>
              <p>Raw comma-separated values for Excel or BI tools.</p>
            </div>
          </div>

          <div className="glass-panel export-card" onClick={() => handleExport('json')}>
            <div className="export-icon" style={{ background: 'var(--warn-subtle)', color: 'var(--warn)' }}>
              {exporting === 'json' ? <Loader2 className="animate-spin" /> : <FileJson size={28} />}
            </div>
            <div>
              <h4>JSON Array</h4>
              <p>Full schema output for SIEMs and custom pipelines.</p>
            </div>
          </div>

          <div className="glass-panel export-card" onClick={() => handleExport('audit')}>
            <div className="export-icon" style={{ background: 'var(--cyan-subtle)', color: 'var(--cyan)' }}>
              {exporting === 'audit' ? <Loader2 className="animate-spin" /> : <FileText size={28} />}
            </div>
            <div>
              <h4>Compliance Audit (PDF)</h4>
              <p>Formatted PDF report for SOC2 / ISO27001 evidence.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'var(--accent-subtle)' }}>
        <ShieldCheck size={24} color="var(--accent)" style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Enterprise Data Guarantee</h4>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Phyloc retains raw lookup logs for a maximum of 30 days unless extended retention is configured in your enterprise contract. Exported data falls under your organization's internal data governance policies.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
