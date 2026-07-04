from fastapi import APIRouter
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/")
async def get_cyber_news():
    """
    Fetch top tech and cybersecurity news.
    Proxied through the backend to avoid frontend CORS and AdBlocker issues.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Fetch top 100 story IDs to ensure we have enough after filtering
            top_stories_res = await client.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10.0)
            top_stories_res.raise_for_status()
            story_ids = top_stories_res.json()[:100]
            
            # Fetch details for each story concurrently
            import asyncio
            
            async def fetch_story(story_id):
                res = await client.get(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json", timeout=10.0)
                return res.json()
                
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
            
            return {"status": "success", "data": filtered_news}
    except Exception:
        logger.exception("Failed to fetch cybersecurity news")
        return {"status": "error", "message": "An internal error occurred"}
