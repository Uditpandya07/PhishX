from fastapi import APIRouter
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

import time
import asyncio

_news_cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_TTL = 600  # 10 minutes

@router.get("/")
async def get_cyber_news():
    """
    Fetch top tech and cybersecurity news.
    Proxied through the backend to avoid frontend CORS and AdBlocker issues.
    Results are cached for 10 minutes to prevent memory spikes on Render.
    """
    global _news_cache
    
    current_time = time.time()
    if _news_cache["data"] and (current_time - _news_cache["last_fetched"]) < CACHE_TTL:
        return {"status": "success", "data": _news_cache["data"], "cached": True}

    try:
        async with httpx.AsyncClient() as client:
            # Fetch top 100 story IDs to ensure we have enough after filtering
            top_stories_res = await client.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10.0)
            top_stories_res.raise_for_status()
            story_ids = top_stories_res.json()[:100]
            
            # Use a semaphore to strictly limit concurrent requests to 10 at a time
            # This prevents the 512MB RAM limit from being exhausted on Render
            semaphore = asyncio.Semaphore(10)
            
            async def fetch_story(story_id):
                async with semaphore:
                    try:
                        res = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json", timeout=10.0)
                        return res.json()
                    except Exception as e:
                        logger.warning(f"Failed to fetch story {story_id}: {e}")
                        return None
                
            all_news = await asyncio.gather(*[fetch_story(sid) for sid in story_ids])
            
            # Filter strictly for tech and cybersecurity topics
            keywords = [
                "cyber", "security", "hack", "breach", "malware", "ransomware", "phish", 
                "vulnerability", "cve", "ai", "tech", "software", "hardware", "linux", 
                "windows", "apple", "google", "microsoft", "amazon", "crypto", "web", 
                "app", "cloud", "server", "database", "network", "api", "code", 
                "programming", "developer", "startup", "intel", "amd", "nvidia", 
                "data", "privacy", "bug", "exploit", "patch"
            ]
            
            filtered_news = []
            for story in all_news:
                if story and story.get('title'):
                    title_lower = story['title'].lower()
                    if any(keyword in title_lower for keyword in keywords):
                        filtered_news.append(story)
                        if len(filtered_news) == 20:
                            break
            
            _news_cache["data"] = filtered_news
            _news_cache["last_fetched"] = current_time
            
            return {"status": "success", "data": filtered_news, "cached": False}
    except Exception:
        logger.exception("Failed to fetch cybersecurity news")
        return {"status": "error", "message": "An internal error occurred"}
