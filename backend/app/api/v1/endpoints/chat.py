from typing import Any, Dict, List
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator, Field

from app.api import deps
from app.services.live_ai import handle_chat_message
from app.db.models import User

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_ROLES = {"user", "model"}


class ChatMessage(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ALLOWED_ROLES:
            raise ValueError(f"Invalid role '{v}'. Must be 'user' or 'model'.")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) > 300:
            raise ValueError("History message content exceeds maximum length.")
        return v


class ChatRequest(BaseModel):
    url: str = Field(default="", max_length=2048)
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    features: Dict[str, Any] = Field(default_factory=dict)
    history: List[ChatMessage] = Field(default_factory=list, max_length=20)
    message: str = Field(..., min_length=1, max_length=500)



    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        return v

    @field_validator("features")
    @classmethod
    def validate_features(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        # Limit feature dict size to prevent payload bloat
        if len(str(v)) > 5000:
            raise ValueError("Features payload too large.")
        return v


@router.post("/message")
async def send_chat_message(
    *,
    request: ChatRequest,
    current_user: User = Depends(deps.get_optional_user),
) -> Any:
    """
    Send a message to the Live AI threat assistant.
    All input is validated and sanitized before reaching the AI layer.
    """
    try:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]

        reply = handle_chat_message(
            url=request.url,
            risk_score=request.risk_score,
            features=request.features,
            history=history_dicts,
            user_message=request.message,
        )

        return {"reply": reply}

    except ValueError as e:
        # Pydantic validation errors bubble up here if re-raised
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process chat message.")
