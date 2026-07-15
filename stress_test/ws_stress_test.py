"""
PhishX — WebSocket Stress Test
================================
Tests the real-time /ws/scan WebSocket endpoint under concurrent load.
This is separate from HTTP load testing since WS requires a different approach.

Run alongside locustfile.py:
    python ws_stress_test.py --host wss://phishx-vqib.onrender.com --users 100
"""

import asyncio
import websockets
import json
import random
import argparse
import time
from dataclasses import dataclass, field
from typing import List


TEST_URLS = [
    "https://google.com",
    "https://github.com",
    "http://paypa1-secure-login.xyz/verify",
    "http://192.168.1.1/admin/login",
    "https://linkedin.com",
    "http://secure-banking-alert.tk/update",
    "https://stackoverflow.com",
    "http://login.microsooft.com.hacker.xyz/auth",
]


@dataclass
class TestResult:
    success: int = 0
    failed: int = 0
    errors: List[str] = field(default_factory=list)
    latencies: List[float] = field(default_factory=list)


async def single_ws_client(host: str, result: TestResult, client_id: int):
    """Simulates one WebSocket user sending a scan request."""
    ws_url = f"{host}/ws/scan"
    url_to_scan = random.choice(TEST_URLS)

    try:
        start = time.time()
        async with websockets.connect(ws_url, open_timeout=10) as ws:
            # Send a scan request
            await ws.send(json.dumps({"url": url_to_scan}))

            # Wait for response (with timeout)
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=15.0)
                elapsed = (time.time() - start) * 1000
                result.latencies.append(elapsed)
                result.success += 1

                data = json.loads(response)
                if client_id % 50 == 0:  # Only log every 50th client
                    print(f"  [WS Client {client_id}] ✅ {url_to_scan} → {data.get('prediction', 'unknown')} ({elapsed:.0f}ms)")
            except asyncio.TimeoutError:
                result.failed += 1
                result.errors.append(f"Client {client_id}: WebSocket response timeout")

    except websockets.exceptions.ConnectionRefusedError:
        result.failed += 1
        result.errors.append(f"Client {client_id}: Connection refused")
    except Exception as e:
        result.failed += 1
        result.errors.append(f"Client {client_id}: {type(e).__name__}: {str(e)[:100]}")


async def run_ws_stress_test(host: str, num_users: int, batch_size: int = 20):
    """
    Run WebSocket stress test with `num_users` concurrent connections.
    Sends them in batches to avoid overwhelming the event loop.
    """
    result = TestResult()

    print(f"\n{'='*60}")
    print(f"  🔌  PhishX WebSocket Stress Test")
    print(f"  🎯  Host    : {host}")
    print(f"  👥  Users   : {num_users}")
    print(f"  📦  Batches : {batch_size} at a time")
    print(f"{'='*60}\n")

    start_time = time.time()
    clients = list(range(1, num_users + 1))

    for i in range(0, len(clients), batch_size):
        batch = clients[i:i + batch_size]
        print(f"  Launching batch {i // batch_size + 1}: clients {batch[0]}–{batch[-1]}...")
        tasks = [single_ws_client(host, result, cid) for cid in batch]
        await asyncio.gather(*tasks)
        await asyncio.sleep(0.1)  # Small delay between batches

    elapsed = time.time() - start_time
    total = result.success + result.failed
    fail_rate = (result.failed / total * 100) if total > 0 else 0
    avg_latency = sum(result.latencies) / len(result.latencies) if result.latencies else 0
    sorted_latencies = sorted(result.latencies)
    p95 = sorted_latencies[int(len(sorted_latencies) * 0.95)] if sorted_latencies else 0

    print(f"\n{'='*60}")
    print(f"  🏁  WebSocket Test Complete ({elapsed:.1f}s total)")
    print(f"  ✅  Successful connections : {result.success}")
    print(f"  ❌  Failed connections     : {result.failed} ({fail_rate:.1f}%)")
    print(f"  ⚡  Avg Latency            : {avg_latency:.0f}ms")
    print(f"  📊  p95 Latency            : {p95:.0f}ms")
    print(f"{'='*60}")

    if result.errors[:5]:
        print("\n  ⚠️  Sample Errors:")
        for err in result.errors[:5]:
            print(f"    • {err}")

    if fail_rate < 5 and p95 < 5000:
        print("\n  🎉  WebSocket endpoint is PRODUCTION READY!")
    else:
        print("\n  ⚠️  WebSocket issues detected — review before launch.")


def main():
    parser = argparse.ArgumentParser(description="PhishX WebSocket Stress Test")
    parser.add_argument(
        "--host",
        default="wss://phishx-vqib.onrender.com",
        help="WebSocket host URL (wss:// for prod, ws:// for local)",
    )
    parser.add_argument(
        "--users",
        type=int,
        default=100,
        help="Number of concurrent WebSocket clients (default: 100)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=20,
        help="Number of clients to launch per batch (default: 20)",
    )
    args = parser.parse_args()

    asyncio.run(run_ws_stress_test(args.host, args.users, args.batch_size))


if __name__ == "__main__":
    main()
