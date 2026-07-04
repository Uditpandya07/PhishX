from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, scans, payments, feedback, admin, ws, news, contact

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(feedback.router, prefix="/feedback", tags=["feedback"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ws.router, prefix="/ws", tags=["websocket"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
