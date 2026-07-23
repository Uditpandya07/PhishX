# PhishX Stress Test Suite 🛡️

Pre-launch load testing for the PhishX LinkedIn launch.
Simulates 500–1000 concurrent users hitting your Render + Vercel deployment.

## Files

| File | Purpose |
|---|---|
| `locustfile.py` | Main HTTP load test (Locust) |
| `ws_stress_test.py` | WebSocket `/ws/scan` concurrent test |
| `run_tests.ps1` | One-click PowerShell runner (Windows) |
| `requirements.txt` | Test dependencies |

## Quick Start

### Option 1 — One-Click (Recommended)
```powershell
cd c:\PhishX
.\stress_test\run_tests.ps1
```

### Option 2 — Manual with Web UI
```powershell
cd c:\PhishX\stress_test
pip install -r requirements.txt

# Launch Locust with web UI
locust -f locustfile.py --host https://phishx-vqib.onrender.com

# Open http://localhost:8089
# Set users=500, spawn rate=25, then click Start
```

### Option 3 — Headless (no browser UI)
```powershell
locust -f locustfile.py `
  --host https://phishx-vqib.onrender.com `
  --headless `
  --users 500 `
  --spawn-rate 25 `
  --run-time 3m `
  --html reports/report.html
```

## Test Scenarios

### Ramp-up Strategy (recommended for LinkedIn launch simulation)
1. **Warm-up**: 50 users, spawn rate 5 → run 2 min
2. **Ramp**: 200 users, spawn rate 20 → run 3 min  
3. **Peak**: 500 users, spawn rate 25 → run 5 min
4. **Spike**: 1000 users, spawn rate 100 → run 2 min

### User Mix (realistic LinkedIn post traffic)
| Type | Weight | Behavior |
|---|---|---|
| `AnonymousUser` | 60% | Health check + occasional scan |
| `RegisteredUser` | 30% | Register → Login → Scan → History |
| `PowerUser` | 10% | Rapid scans (tests rate limiter) |

## Interpreting Results

### ✅ Thresholds for a PASS
| Metric | Threshold | What it means |
|---|---|---|
| Error Rate | < 5% | Platform is stable |
| p95 Latency | < 3,000ms | 95% of users have good UX |
| p99 Latency | < 5,000ms | No severe outliers |

### ❌ Common Failure Patterns

**High error rate (>5%)**
- Render free tier is cold-starting → pre-warm your service!
- DB connection pool exhausted → check `DATABASE_URL` pool settings
- Rate limiter blocking legitimate users → expected, not a bug

**High p95 latency (>3s)**
- The live content analysis (`httpx.Client` in `scans.py`) adds 3s timeout per scan
- The ML model prediction is CPU-heavy on a free tier
- Neon Postgres cold connections on free tier

**WebSocket failures**
- Render free tier drops WebSocket connections after ~30s inactivity
- Solution: add a ping/pong keepalive in `ws.py`

## Known Free-Tier Limits

| Service | Free Tier Limit | Impact |
|---|---|---|
| **Render** | 750 hrs/month, cold starts ~30s | First request after idle will be slow |
| **Neon Postgres** | 0.25 vCPU, 1GB RAM | DB queries may slow under 500+ users |
| **Vercel** | 100GB bandwidth/month | Frontend likely fine |

## Pre-Launch Checklist

- [ ] Warm up Render service (hit the API once to wake it up)
- [ ] Run stress test at 500 users — check error rate < 5%
- [ ] Run stress test at 1000 users — observe degradation pattern  
- [ ] Verify rate limiter returns 429 (not 500) for rapid requests
- [ ] Check WebSocket stability with ws_stress_test.py
- [ ] Review Render logs during test for any crashes/OOM errors
