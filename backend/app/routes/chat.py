from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel, Field

from typing import Literal

from app import model, store
from app.schemas import ChatResponse, NewConversationResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


class _HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=4096)
    messages: list[_HistoryMessage] = []


@router.post("/new", response_model=NewConversationResponse, status_code=201)
async def new_conversation():
    cid = store.new_conversation()
    return NewConversationResponse(conversation_id=cid)


@router.post("/{conversation_id}/message", response_model=ChatResponse)
async def send_message(conversation_id: str, body: SendMessageRequest):
    history = [{"role": m.role, "content": m.content} for m in body.messages]
    history.append({"role": "user", "content": body.content})
    reply = model.generate_reply(history)
    timestamp = datetime.now(timezone.utc).isoformat()
    return ChatResponse(
        conversation_id=conversation_id,
        role="assistant",
        content=reply,
        timestamp=timestamp,
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str):
    pass
