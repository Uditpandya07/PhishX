#!/usr/bin/env pwsh
# ============================================================
# PhishX Stress Test Runner — Windows PowerShell
# ============================================================
# Run this script from the PhishX root directory:
#   .\stress_test\run_tests.ps1
#
# Options:
#   -Target   : URL of your deployed backend (default: Render URL)
#   -Users    : Peak concurrent users to simulate (default: 500)
#   -SpawnRate: Users spawned per second (default: 25)
#   -Duration : How long to hold peak load (default: 3m)
# ============================================================

param(
    [string]$Target    = "https://phishx-vqib.onrender.com",
    [int]   $Users     = 500,
    [int]   $SpawnRate = 25,
    [string]$Duration  = "3m"
)

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  🛡️  PhishX LinkedIn Launch — Pre-Flight Stress Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Target    : $Target" -ForegroundColor Yellow
Write-Host "  Peak Users: $Users" -ForegroundColor Yellow
Write-Host "  Spawn Rate: $SpawnRate users/second" -ForegroundColor Yellow
Write-Host "  Duration  : $Duration at peak load" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Check if Python is available ────────────────────────────────────
Write-Host "  [1/4] Checking Python installation..." -ForegroundColor White
try {
    $pythonVersion = python --version 2>&1
    Write-Host "         ✅ Found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "         ❌ Python not found. Install from python.org" -ForegroundColor Red
    exit 1
}

# ─── Step 2: Install dependencies ────────────────────────────────────────────
Write-Host "  [2/4] Installing test dependencies..." -ForegroundColor White
$requirements = Join-Path $ScriptDir "requirements.txt"
try {
    pip install -q -r $requirements
    Write-Host "         ✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "         ❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "            Try: pip install locust websockets" -ForegroundColor Yellow
    exit 1
}

# ─── Step 3: Verify the target is reachable ──────────────────────────────────
Write-Host "  [3/4] Verifying target is reachable..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "$Target/" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "         ✅ Backend is UP (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "         ⚠️  Backend returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "         ❌ Cannot reach $Target" -ForegroundColor Red
    Write-Host "            Is your Render service running? Check the dashboard." -ForegroundColor Yellow
    $confirm = Read-Host "         Continue anyway? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") { exit 1 }
}

# ─── Step 4: Run Locust stress test ──────────────────────────────────────────
Write-Host "  [4/4] Launching Locust stress test..." -ForegroundColor White
Write-Host ""
Write-Host "  📊 Web UI will open at: http://localhost:8089" -ForegroundColor Cyan
Write-Host "  ⏹️  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host ""

$locustFile  = Join-Path $ScriptDir "locustfile.py"
$reportFile  = Join-Path $ScriptDir "reports\report_$(Get-Date -Format 'yyyyMMdd_HHmmss').html"
$csvPrefix   = Join-Path $ScriptDir "reports\stats_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create reports directory
$reportsDir = Join-Path $ScriptDir "reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

Write-Host "  Running: locust -f $locustFile --host $Target" -ForegroundColor DarkGray
Write-Host "           -u $Users -r $SpawnRate --run-time $Duration" -ForegroundColor DarkGray
Write-Host "           --html $reportFile" -ForegroundColor DarkGray
Write-Host ""

# Interactive mode with Web UI
locust `
    -f $locustFile `
    --host $Target `
    --users $Users `
    --spawn-rate $SpawnRate `
    --html $reportFile `
    --csv $csvPrefix

Write-Host ""
Write-Host "  📄 HTML Report saved: $reportFile" -ForegroundColor Green
Write-Host "  📊 CSV Stats saved  : $csvPrefix*.csv" -ForegroundColor Green
Write-Host ""

# ─── Optional: WebSocket test ────────────────────────────────────────────────
$wsConfirm = Read-Host "  Run WebSocket stress test too? (y/N)"
if ($wsConfirm -eq "y" -or $wsConfirm -eq "Y") {
    $wsHost = $Target -replace "^https://", "wss://" -replace "^http://", "ws://"
    $wsScript = Join-Path $ScriptDir "ws_stress_test.py"
    Write-Host ""
    Write-Host "  🔌 Running WebSocket test against: $wsHost" -ForegroundColor Cyan
    python $wsScript --host $wsHost --users 100 --batch-size 20
}

Write-Host ""
Write-Host "  ✅ Stress test complete! Review the report above." -ForegroundColor Green
Write-Host "     Good luck with the LinkedIn launch tomorrow! 🚀" -ForegroundColor Cyan
Write-Host ""
