# In-memory store for background task tracking
# Used instead of Celery + Redis to save memory on Render Free Tier

TASK_STORE = {}
