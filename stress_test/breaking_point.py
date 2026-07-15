"""
PhishX — Breaking Point Stress Test
=====================================
Uses Locust's LoadTestShape to automatically ramp users in aggressive stages:
  100 → 300 → 500 → 750 → 1000 → 1500 → 2000 → 3000 → 5000 → 7500 → 10000

Each stage holds for 90 seconds. The test auto-stops when the error rate
exceeds 10% OR the server stops responding entirely.

Usage:
    locust -f breaking_point.py --host https://phishx-vqib.onrender.com

Then open http://localhost:8089 and watch it break.
"""

import random
import time
import logging
from locust import HttpUser, task, between, events, LoadTestShape
from locust.runners import WorkerRunner


logger = logging.getLogger(__name__)

# ─── Scan URLs (50/50 mix for realistic load) ────────────────────────────────
SAFE_URLS = [
    "https://google.com", "https://github.com", "https://stackoverflow.com",
    "https://youtube.com", "https://wikipedia.org", "https://reddit.com",
    "https://twitter.com", "https://linkedin.com", "https://microsoft.com",
    "https://amazon.com", "https://apple.com", "https://cloudflare.com",
]
PHISHING_URLS = [
    "http://paypa1-secure-login.xyz/verify",
    "http://192.168.1.1/admin/login",
    "http://secure-banking-alert.tk/update",
    "http://login.microsooft.com.hacker.xyz/auth",
    "http://google.com.phishing-attempt.xyz",
    "http://xn--googl-fsa.com",
]
ALL_URLS = SAFE_URLS + PHISHING_URLS


# ─── Stage definition: (users, spawn_rate, hold_for_seconds) ─────────────────
# Each stage ramps to the target user count at the given spawn rate,
# then holds steady. Stages get increasingly brutal.
STAGES = [
    {"users":   100, "spawn_rate":   20, "hold": 90,  "label": "Warm-up"},
    {"users":   300, "spawn_rate":   50, "hold": 90,  "label": "Light Load"},
    {"users":   500, "spawn_rate":   75, "hold": 90,  "label": "Medium Load"},
    {"users":   750, "spawn_rate":  100, "hold": 90,  "label": "Heavy Load"},
    {"users":  1000, "spawn_rate":  150, "hold": 90,  "label": "Very Heavy"},
    {"users":  1500, "spawn_rate":  200, "hold": 90,  "label": "Stress"},
    {"users":  2000, "spawn_rate":  300, "hold": 90,  "label": "High Stress"},
    {"users":  3000, "spawn_rate":  400, "hold": 90,  "label": "Extreme"},
    {"users":  5000, "spawn_rate":  500, "hold": 90,  "label": "Breaking Point"},
    {"users":  7500, "spawn_rate":  750, "hold": 90,  "label": "Nuclear"},
    {"users": 10000, "spawn_rate": 1000, "hold": 120, "label": "ANNIHILATION"},
]

# Auto-stop thresholds
ERROR_RATE_THRESHOLD = 15.0   # Stop when > 15% of requests fail
RESPONSE_TIME_KILL   = 90000  # Stop when median > 90s (server effectively dead)


class SpikeLoadShape(LoadTestShape):
    """
    Custom load shape that ramps through STAGES automatically.
    Each stage holds for `hold` seconds before escalating.
    Auto-stops if error rate or latency exceeds kill thresholds.
    """
    stage_start_time = None
    current_stage_index = 0
    peak_users_reached = 0
    is_stopped = False

    def tick(self):
        if self.is_stopped:
            return None  # Stop the test

        run_time = self.get_run_time()

        # Calculate cumulative time for each stage
        elapsed = 0
        for i, stage in enumerate(STAGES):
            ramp_time = stage["users"] / stage["spawn_rate"]
            total_stage_time = ramp_time + stage["hold"]

            if run_time < elapsed + total_stage_time:
                # We're in this stage
                if i != self.current_stage_index:
                    self.current_stage_index = i
                    print(f"\n{'='*55}")
                    print(f"  STAGE {i+1}/{len(STAGES)}: {stage['label']}")
                    print(f"  Ramping to {stage['users']:,} users @ {stage['spawn_rate']} users/sec")
                    print(f"  Hold time: {stage['hold']}s")
                    print(f"{'='*55}\n")
                    self.peak_users_reached = max(self.peak_users_reached, stage["users"])

                # Check kill conditions
                stats = self.runner.stats.total
                if stats.num_requests > 50:  # Only check after warmup
                    fail_rate = (stats.num_failures / stats.num_requests * 100)
                    median_rt = stats.get_response_time_percentile(0.5) or 0

                    if fail_rate > ERROR_RATE_THRESHOLD:
                        print(f"\n  *** KILL CONDITION MET ***")
                        print(f"  Error rate {fail_rate:.1f}% > {ERROR_RATE_THRESHOLD}% threshold")
                        print(f"  Peak users before failure: {stage['users']:,}")
                        print(f"  SERVER HAS BEEN BROKEN AT STAGE {i+1}: {stage['label']}")
                        self.is_stopped = True
                        return None

                    if median_rt > RESPONSE_TIME_KILL:
                        print(f"\n  *** KILL CONDITION MET ***")
                        print(f"  Median response time {median_rt:.0f}ms > {RESPONSE_TIME_KILL}ms")
                        print(f"  Server is effectively dead. Stage: {stage['label']}")
                        self.is_stopped = True
                        return None

                return (stage["users"], stage["spawn_rate"])

            elapsed += total_stage_time

        # All stages completed — test finished naturally
        print("\n  ALL STAGES COMPLETE — Server survived everything!")
        return None


# ─── User behaviour (all users do this — pure scan hammering) ────────────────
class HammerUser(HttpUser):
    """
    Aggressive user that only does the two most expensive things:
    1. URL scans (CPU-heavy ML + live content fetch)
    2. Health checks (to detect when the server goes down entirely)

    No wait time — hits as fast as possible to maximize CPU pressure.
    """
    wait_time = between(0.1, 0.5)  # Near-zero think time — aggressive

    @task(8)
    def scan_url(self):
        """Core scan endpoint — ML inference + live content fetch = max CPU."""
        with self.client.post(
            "/api/v1/scans/predict",
            json={"url": random.choice(ALL_URLS)},
            catch_response=True,
            name="POST /scan [HAMMER]",
            timeout=30,
        ) as r:
            if r.status_code in (200, 201):
                r.success()
            elif r.status_code == 429:
                r.success()   # Rate limited = server is healthy and defending
            elif r.status_code in (502, 503, 504):
                r.failure(f"SERVER DOWN: {r.status_code}")
            elif r.status_code == 500:
                r.failure(f"INTERNAL ERROR: {r.status_code}")
            else:
                r.failure(f"Unexpected: {r.status_code}")

    @task(2)
    def health_check(self):
        """
        Keeps hitting root endpoint. When this starts failing,
        the server is completely unreachable.
        """
        with self.client.get(
            "/",
            catch_response=True,
            name="GET / [HEALTH PROBE]",
            timeout=15,
        ) as r:
            if r.status_code == 200:
                r.success()
            elif r.status_code in (502, 503, 504):
                r.failure(f"SERVER OFFLINE: {r.status_code}")
            else:
                r.failure(f"Health probe failed: {r.status_code}")


# ─── Event hooks ─────────────────────────────────────────────────────────────
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    if isinstance(environment.runner, WorkerRunner):
        return
    print("\n" + "="*60)
    print("  PhishX BREAKING POINT Test -- STARTING")
    print(f"  Target : {environment.host}")
    print(f"  Stages : {len(STAGES)} escalating stages")
    print(f"  Max Users : {STAGES[-1]['users']:,}")
    print("  The test runs until the server breaks or all stages pass.")
    print("  Watch http://localhost:8089 for live metrics")
    print("="*60 + "\n")
    print("  STAGE PLAN:")
    total_time = 0
    for i, s in enumerate(STAGES):
        ramp = s["users"] / s["spawn_rate"]
        print(f"  Stage {i+1:2d}: {s['users']:5,} users | {s['label']:<20} | ~{ramp:.0f}s ramp + {s['hold']}s hold")
        total_time += ramp + s["hold"]
    print(f"\n  Total max duration: {total_time/60:.0f} minutes (if server survives)")
    print("="*60 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    if isinstance(environment.runner, WorkerRunner):
        return

    stats = environment.stats
    total_reqs  = stats.total.num_requests
    total_fails = stats.total.num_failures
    fail_rate   = (total_fails / total_reqs * 100) if total_reqs > 0 else 0
    p50  = stats.total.get_response_time_percentile(0.50) or 0
    p95  = stats.total.get_response_time_percentile(0.95) or 0
    p99  = stats.total.get_response_time_percentile(0.99) or 0

    print("\n" + "="*60)
    print("  PhishX BREAKING POINT Test -- COMPLETE")
    print(f"  Total Requests : {total_reqs:,}")
    print(f"  Total Failures : {total_fails:,} ({fail_rate:.1f}%)")
    print(f"  Median latency : {p50:,.0f} ms")
    print(f"  p95 latency    : {p95:,.0f} ms")
    print(f"  p99 latency    : {p99:,.0f} ms")
    print("="*60)

    if fail_rate > ERROR_RATE_THRESHOLD:
        print("  RESULT: SERVER BROKE UNDER LOAD")
        print(f"  Breaking point was somewhere between last two stages above.")
        print("  Check the CHARTS tab in Locust UI for the exact failure moment.")
    else:
        print("  RESULT: Server survived all stages!")
        print("  Either very resilient or test was not aggressive enough.")
    print()
