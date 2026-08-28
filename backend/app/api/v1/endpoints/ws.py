import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import json

logger = logging.getLogger(__name__)

router = APIRouter()

@router.websocket("/scans/{task_id}")
async def websocket_scan_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for task {task_id}")
    
    try:
        # Loop to check celery task status
        # In a massive production env, you'd use Redis Pub/Sub instead of polling, 
        # but this is perfect for the current scale and avoids extra overhead.
        from app.core.task_store import TASK_STORE
        while True:
            task_data = TASK_STORE.get(task_id)
            if not task_data:
                await asyncio.sleep(0.5)
                continue
                
            state = task_data.get("status")
            
            if state == 'PENDING':
                await websocket.send_json({"status": "PENDING", "progress": 10})
                
            elif state == 'PROCESSING':
                await websocket.send_json({"status": "PROCESSING", "progress": 50})
                
            elif state == 'COMPLETED':
                # Task finished successfully
                result = task_data.get("result")
                await websocket.send_json({
                    "status": "COMPLETED",
                    "progress": 100,
                    "result": result
                })
                break
                
            elif state == 'FAILED':
                # Task failed
                await websocket.send_json({
                    "status": "FAILED",
                    "error": task_data.get("error", "Unknown error")
                })
                break
                
            await asyncio.sleep(0.5)  # Poll every 500ms
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for task {task_id}")
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        try:
            await websocket.close()
        except:
            pass
