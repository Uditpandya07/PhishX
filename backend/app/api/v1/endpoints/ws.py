import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from celery.result import AsyncResult
from app.worker import celery_app
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
        task_result = AsyncResult(task_id, app=celery_app)
        while True:
            if task_result.state == 'PENDING':
                await websocket.send_json({"status": "PENDING", "progress": 10})
                
            elif task_result.state == 'STARTED':
                await websocket.send_json({"status": "PROCESSING", "progress": 50})
                
            elif task_result.state == 'SUCCESS':
                # Task finished successfully
                result = task_result.result
                await websocket.send_json({
                    "status": "COMPLETED",
                    "progress": 100,
                    "result": result
                })
                break
                
            elif task_result.state == 'FAILURE':
                # Task failed
                await websocket.send_json({
                    "status": "FAILED",
                    "error": str(task_result.info)
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
