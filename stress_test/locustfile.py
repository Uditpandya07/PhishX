"""
PhishX Stress Test Suite — Locust
==================================
Simulates realistic user behavior for 500–1000 concurrent users on the
PhishX platform. Tests the endpoints that actually get hit during a
LinkedIn launch spike.

Usage:
    locust -f locustfile.py --host https://phishx-vqib.onrender.com

Then open: http://localhost:8089 for the live web dashboard.

For headless CI mode:
    locust -f locustfile.py --host https://phishx-vqib.onrender.com \\
           --headless -u 500 -r 50 --run-time 3m --html report.html
"""

import random
import time
from locust import HttpUser, task, between, events


# ─── Sample URLs for scanning (mix of safe + phishing) ──────────────────────
SAFE_URLS = [
    "https://google.com",
    "https://github.com",
    "https://stackoverflow.com",
    "https://youtube.com",
    "https://wikipedia.org",
    "https://reddit.com",
    "https://twitter.com",
    "https://linkedin.com",
    "https://microsoft.com",
    "https://amazon.com",
    "https://apple.com",
    "https://cloudflare.com",
    "https://openai.com",
    "https://vercel.com",
    "https://stripe.com",
]

PHISHING_URLS = [
    "http://paypa1-secure-login.xyz/verify",
    "http://192.168.1.1/admin/login",
    "http://secure-banking-alert.tk/update",
    "http://login.microsooft.com.hacker.xyz/auth",
    "http://google.com.phishing-attempt.xyz",
    "http://paypal-account-verify.pw/login",
    "http://xn--googl-fsa.com",
    "http://secure.apple.com.login.fake.xyz/verify",
]

ALL_TEST_URLS = SAFE_URLS + PHISHING_URLS


# ─── User Type 1: Anonymous Visitor (60% of traffic) ────────────────────────
class AnonymousUser(HttpUser):
    """
    Represents a LinkedIn visitor who lands on PhishX for the first time.
    They hit the homepage, check the API health, and may scan a URL.
    This is the most common user type after a social media post.
    """
    weight = 6
    wait_time = between(1, 5)

    @task(5)
    def health_check(self):
        """Simulates landing on the site — frontend pings the backend root."""
        with self.client.get("/", catch_response=True, name="GET /  [health]") as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Health check failed: {r.status_code}")

    @task(3)
    def scan_url_anonymous(self):
        """
        Anonymous URL scan — the core feature most visitors try immediately.
        Rate limiter allows 10 scans/60s per IP, so 429s are expected and OK.
        """
        url = random.choice(ALL_TEST_URLS)
        payload = {"url": url}
        with self.client.post(
            "/api/v1/scans/predict",
            json=payload,
            catch_response=True,
            name="POST /api/v1/scans/predict [anon]",
        ) as r:
            if r.status_code in (200, 201):
                r.success()
            elif r.status_code == 429:
                # Rate limit is expected behavior — not a failure
                r.success()
            else:
                r.failure(f"Scan failed: {r.status_code} — {r.text[:200]}")

    @task(1)
    def check_docs(self):
        """Some devs from LinkedIn will check the Swagger/OpenAPI docs."""
        with self.client.get(
            "/api/v1/openapi.json",
            catch_response=True,
            name="GET /api/v1/openapi.json [docs]",
        ) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Docs failed: {r.status_code}")


# ─── User Type 2: Registered User (30% of traffic) ──────────────────────────
class RegisteredUser(HttpUser):
    """
    Simulates a returning user who registers, logs in, and uses the full platform.
    Tests auth flow + DB writes + scan history reads under concurrent load.
    """
    weight = 3
    wait_time = between(2, 8)

    def on_start(self):
        """Each virtual user creates a unique account at test start."""
        self.token = None
        self._register_and_login()

    def _register_and_login(self):
        """Register a new account + login to get a session token."""
        uid = f"{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
        self.email = f"stresstest_{uid}@loadtest.phishx.io"
        self.password = "StressTest@123!"

        # Register
        with self.client.post(
            "/api/v1/auth/register",
            json={
                "email": self.email,
                "password": self.password,
                "full_name": f"Load Tester {uid}",
            },
            catch_response=True,
            name="POST /api/v1/auth/register [setup]",
        ) as r:
            if r.status_code in (200, 201):
                r.success()
            elif r.status_code == 400:
                r.success()  # Already exists — OK
            else:
                r.failure(f"Register failed: {r.status_code}")
                return

        # Login (using OAuth2 form — FastAPI standard)
        with self.client.post(
            "/api/v1/auth/login",
            data={"username": self.email, "password": self.password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            catch_response=True,
            name="POST /api/v1/auth/login [setup]",
        ) as r:
            if r.status_code == 200:
                try:
                    data = r.json()
                    self.token = data.get("access_token")
                    r.success()
                except Exception:
                    r.failure("Login response parse error")
            else:
                r.failure(f"Login failed: {r.status_code} — {r.text[:200]}")

    def _auth_headers(self):
        if self.token:
            return {"Authorization": f"Bearer {self.token}"}
        return {}

    @task(5)
    def scan_url_authenticated(self):
        """Authenticated scan — most common action for logged-in users."""
        url = random.choice(ALL_TEST_URLS)
        with self.client.post(
            "/api/v1/scans/predict",
            json={"url": url},
            headers=self._auth_headers(),
            catch_response=True,
            name="POST /api/v1/scans/predict [auth]",
        ) as r:
            if r.status_code in (200, 201):
                r.success()
            elif r.status_code == 429:
                r.success()  # Expected rate limit behavior
            else:
                r.failure(f"Auth scan failed: {r.status_code} — {r.text[:200]}")

    @task(2)
    def get_scan_history(self):
        """View scan history — DB read under concurrent load."""
        with self.client.get(
            "/api/v1/scans/history",
            headers=self._auth_headers(),
            catch_response=True,
            name="GET /api/v1/scans/history",
        ) as r:
            if r.status_code in (200, 401):
                r.success()
            else:
                r.failure(f"History fetch failed: {r.status_code}")

    @task(1)
    def get_user_profile(self):
        """Fetch user profile — lightweight JWT verification under load."""
        with self.client.get(
            "/api/v1/users/me",
            headers=self._auth_headers(),
            catch_response=True,
            name="GET /api/v1/users/me",
        ) as r:
            if r.status_code in (200, 401):
                r.success()
            else:
                r.failure(f"Profile fetch failed: {r.status_code}")


# ─── User Type 3: Power User / Researcher (10% of traffic) ──────────────────
class PowerUser(HttpUser):
    """
    Represents a security researcher who scans many URLs in rapid succession.
    This is the most stressful user type — tests your rate limiter behavior.
    """
    weight = 1
    wait_time = between(0.3, 1.5)

    @task(8)
    def rapid_scan(self):
        """Fast sequential scans — intentionally hammers the rate limiter."""
        url = random.choice(ALL_TEST_URLS)
        with self.client.post(
            "/api/v1/scans/predict",
            json={"url": url},
            catch_response=True,
            name="POST /api/v1/scans/predict [power]",
        ) as r:
            # 429 is expected and correct behavior for power users
            if r.status_code in (200, 201, 429):
                r.success()
            else:
                r.failure(f"Power scan failed: {r.status_code}")

    @task(2)
    def health_probe(self):
        """Repeated health checks — simulates monitoring scripts."""
        with self.client.get("/", catch_response=True, name="GET / [power]") as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"Health probe failed: {r.status_code}")


# ─── Event hooks for custom summary reporting ────────────────────────────────
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("\n" + "="*65)
    print("  [*] PhishX LinkedIn Launch Stress Test -- STARTING")
    print(f"  [>] Target Host : {environment.host}")
    print("  [U] User Mix    : 60% Anonymous | 30% Registered | 10% Power")
    print("  [D] Dashboard   : http://localhost:8089")
    print("="*65 + "\n")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    stats = environment.stats
    total_reqs  = stats.total.num_requests
    total_fails = stats.total.num_failures
    fail_rate   = (total_fails / total_reqs * 100) if total_reqs > 0 else 0
    p95 = stats.total.get_response_time_percentile(0.95) or 0
    p99 = stats.total.get_response_time_percentile(0.99) or 0
    avg = stats.total.avg_response_time or 0
    rps = stats.total.current_rps or 0

    FAIL_RATE_THRESHOLD = 5.0   # < 5% errors = healthy
    P95_THRESHOLD_MS    = 3000  # < 3s p95 = acceptable UX
    P99_THRESHOLD_MS    = 5000  # < 5s p99 = no severe outliers

    print("\n" + "="*65)
    print("  [DONE] PhishX Stress Test -- COMPLETE")
    print(f"  [+]  Total Requests  : {total_reqs:,}")
    print(f"  [-]  Total Failures  : {total_fails:,} ({fail_rate:.1f}%)")
    print(f"  [t]  Avg Latency     : {avg:.0f} ms")
    print(f"  [p]  p95 Latency     : {p95:.0f} ms")
    print(f"  [p]  p99 Latency     : {p99:.0f} ms")
    print(f"  [~]  Requests/sec    : {rps:.1f}")
    print("="*65)

    all_passed = True
    print("\n  VERDICT:")

    if fail_rate > FAIL_RATE_THRESHOLD:
        print(f"  FAIL -- Error rate {fail_rate:.1f}% > {FAIL_RATE_THRESHOLD}% threshold")
        print(f"       -> Your free tier is OVERWHELMED. Check Render logs.")
        all_passed = False
    else:
        print(f"  PASS -- Error rate {fail_rate:.1f}% is within {FAIL_RATE_THRESHOLD}% limit")

    if p95 > P95_THRESHOLD_MS:
        print(f"  FAIL -- p95 latency {p95:.0f}ms > {P95_THRESHOLD_MS}ms threshold")
        print(f"       -> Users will experience sluggish responses. Consider caching.")
        all_passed = False
    else:
        print(f"  PASS -- p95 latency {p95:.0f}ms is acceptable")

    if p99 > P99_THRESHOLD_MS:
        print(f"  WARN -- p99 latency {p99:.0f}ms > {P99_THRESHOLD_MS}ms")
        print(f"       -> Some users will have very bad experiences.")
    else:
        print(f"  PASS -- p99 latency is within limits")

    if all_passed:
    else:
        print("\n  ⚠️   REVIEW ISSUES ABOVE BEFORE GOING LIVE TOMORROW.")
    print()
