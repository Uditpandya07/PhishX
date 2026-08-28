#!/bin/bash
# start.sh - Run Celery and Uvicorn in the same container for free tier deployments

echo "Purging old Celery tasks to break crash loops..."
celery -A app.worker.celery_app purge -f

echo "Starting Uvicorn web server in the background..."
# Use the PORT environment variable provided by Render, defaulting to 8000
PORT=${PORT:-8000}
uvicorn app.main:app --host 0.0.0.0 --port $PORT &

echo "Waiting 5 seconds for Uvicorn to settle memory..."
sleep 5

echo "Starting optimized Celery worker..."
exec celery -A app.worker.celery_app worker --pool=solo --without-gossip --without-mingle --without-heartbeat -O fair --loglevel=warning
