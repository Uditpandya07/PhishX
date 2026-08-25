import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Activity, 
  Clock, 
  ShieldCheck, 
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  Crosshair,
  TrendingUp,
  Zap
} from 'lucide-react';

export default function DashboardCharts({ dashboard }) {
  const metrics = dashboard?.metrics || {
    totalLookups: 0,
    averageScore: 0,
    activeThreats: 0,
  };

  const safeRate = metrics.totalLookups > 0 
    ? Math.round(((metrics.totalLookups - (metrics.activeThreats || 0)) / metrics.totalLookups) * 100) 
    : 0;

  const getVerdictIcon = (verdict) => {
    switch (verdict) {
      case 'Safe': return <ShieldCheck size={16} className="safe" />;
      case 'Low Risk': return <AlertTriangle size={16} className="warn" />;
      case 'Caution': return <AlertTriangle size={16} className="warn" />;
      case 'High Risk': return <ShieldAlert size={16} className="danger" />;
      case 'Critical Risk': return <ShieldAlert size={16} className="danger" />;
      default: return <HelpCircle size={16} className="neutral" />;
    }
  };

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'Safe': return 'badge safe';
      case 'Low Risk': return 'badge warn';
      case 'Caution': return 'badge warn';
      case 'High Risk': return 'badge danger';
      case 'Critical Risk': return 'badge danger';
      default: return 'badge neutral';
    }
  };

  const generateChartData = (lookups) => {
    if (!lookups || lookups.length === 0) return [];
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const groups = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${days[d.getDay()]}`;
      groups[key] = 0;
    }

    lookups.forEach(l => {
      const d = new Date(l.createdAt);
      const key = `${days[d.getDay()]}`;
      if (groups[key] !== undefined) {
        groups[key]++;
      }
    });

    return Object.keys(groups).map(k => ({ name: k, lookups: groups[k] }));
  };

  const data = generateChartData(dashboard?.lookups);

  const pieData = [
    { name: 'Safe', value: metrics.totalLookups - metrics.activeThreats, color: 'var(--safe)' },
    { name: 'Threats', value: metrics.activeThreats, color: 'var(--danger)' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="dashboard-grid">
        <motion.div variants={itemVariants} className="glass-panel stat-card accent-accent">
          <div className="stat-icon accent"><Activity size={18} /></div>
          <div className="stat-label">Total Lookups</div>
          <div className="stat-value">{metrics.totalLookups}</div>
          <div className="stat-subtext">All-time queries processed</div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel stat-card accent-cyan">
          <div className="stat-icon cyan"><ShieldCheck size={18} /></div>
          <div className="stat-label">Avg Trust Score</div>
          <div className="stat-value">{metrics.averageScore}</div>
          <div className="stat-subtext">0-100 Aggregate Rating</div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="glass-panel stat-card accent-danger">
          <div className="stat-icon danger"><Crosshair size={18} /></div>
          <div className="stat-label">Active Threats</div>
          <div className="stat-value">{metrics.activeThreats}</div>
          <div className="stat-subtext">High & Critical risks found</div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel stat-card accent-safe">
          <div className="stat-icon safe"><TrendingUp size={18} /></div>
          <div className="stat-label">Safe Rate</div>
          <div className="stat-value">{safeRate}%</div>
          <div className="stat-subtext">Emails passing verification</div>
        </motion.div>
      </div>

      <div className="dashboard-grid-wide">
        <motion.div variants={itemVariants} className="glass-panel chart-panel">
          <h3>Traffic Volume (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLookups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-tertiary)" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}
                  itemStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="lookups" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorLookups)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-panel chart-panel">
          <h3>Risk Distribution</h3>
          <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--safe)' }}></div> Safe
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }}></div> Threats
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="glass-panel">
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Recent Lookups</h3>
        </div>
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Email Target</th>
                <th>Verdict</th>
                <th>Trust Score</th>
                <th>Primary Signal</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.lookups || []).slice(0, 10).map((item) => (
                <tr key={item.id}>
                  <td className="mono">{item.email}</td>
                  <td>
                    <div className={getVerdictBadge(item.verdict)}>
                      {getVerdictIcon(item.verdict)} {item.verdict}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: item.trustScore < 50 ? 'var(--danger)' : item.trustScore < 80 ? 'var(--warn)' : 'var(--safe)' }}>
                      {item.trustScore} / 100
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', textTransform: 'capitalize' }}>
                    {item.signals && item.signals.length > 0 ? item.signals[0].replace(/_/g, ' ').toLowerCase() : 'No critical signals'}
                  </td>
                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
