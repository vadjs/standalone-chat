import asyncio
from datetime import UTC, datetime

from fastapi import APIRouter

from app import model, store
from app.schemas import (
    ChatResponse,
    MessageIn,
    NewConversationResponse,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/new", response_model=NewConversationResponse, status_code=201)
async def new_conversation():
    cid = store.new_conversation()
    return NewConversationResponse(conversation_id=cid)


@router.post("/{conversation_id}/message", response_model=ChatResponse)
async def send_message(conversation_id: str, body: MessageIn):
    # Build history from the request body — backend is stateless
    model_history = [{"role": m.role, "content": m.content} for m in body.messages]
    model_history.append({"role": "user", "content": body.content})

    loop = asyncio.get_event_loop()
    reply_text = await loop.run_in_executor(None, model.generate_reply, model_history)

    timestamp = datetime.now(UTC).isoformat()
    return ChatResponse(
        conversation_id=conversation_id,
        role="assistant",
        content=reply_text,
        timestamp=timestamp,
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str):
    pass
