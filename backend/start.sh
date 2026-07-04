#!/bin/bash
# start.sh - Run Celery and Uvicorn in the same container for free tier deployments

echo "Starting Celery worker in the background..."
celery -A app.worker.celery_app worker --loglevel=info &

echo "Starting Uvicorn web server..."
# Use the PORT environment variable provided by Render, defaulting to 8000
PORT=${PORT:-8000}
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
