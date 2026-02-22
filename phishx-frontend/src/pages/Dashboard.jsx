import Background from "../components/Background";
import ScanPanel from "../components/ScanPanel";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-root">
      <Background />

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <img src="/logo.png" alt="PhishX Logo" />
          </div>

          <nav className="nav">
            <div className="nav-item active">Dashboard</div>
            <div className="nav-item">Scan</div>
            <div className="nav-item">Analytics</div>
          </nav>
        </aside>

        {/* Main Area */}
        <div className="main-area">
          {/* Top Stats */}
          <header className="topbar">
            <div className="stat-card">
              <span>Total Scans</span>
              <strong>124</strong>
            </div>

            <div className="stat-card">
              <span>Threats</span>
              <strong>39</strong>
            </div>

            <div className="stat-card">
              <span>Safe</span>
              <strong>85</strong>
            </div>
          </header>

          {/* Main Content */}
          <div className="content">
            <ScanPanel />
          </div>
        </div>
      </div>
    </div>
  );
}