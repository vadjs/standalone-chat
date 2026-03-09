import asyncio
import json
import time
import uuid

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app import model

router = APIRouter(tags=["completions"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = "smollm2"
    messages: list[ChatMessage]
    stream: bool = True


@router.post("/v1/chat/completions")
async def chat_completions(body: ChatCompletionRequest):
    # Strip any system messages from the client — the backend adds its own.
    history = [{"role": m.role, "content": m.content} for m in body.messages if m.role != "system"]

    completion_id = f"chatcmpl-{uuid.uuid4().hex}"
    created = int(time.time())
    model_name = body.model

    async def _sse_generator():
        loop = asyncio.get_event_loop()
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        def _produce():
            try:
                for token in model.generate_stream(history):
                    chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": model_name,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"content": token},
                                "finish_reason": None,
                            }
                        ],
                    }
                    loop.call_soon_threadsafe(queue.put_nowait, f"data: {json.dumps(chunk)}\n\n")
            finally:
                # Sentinel — signals the async side that we're done
                loop.call_soon_threadsafe(queue.put_nowait, None)

        loop.run_in_executor(None, _produce)

        while True:
            item = await queue.get()
            if item is None:
                break
            yield item

        empty_delta: dict[str, str] = {}
        final = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created,
            "model": model_name,
            "choices": [{"index": 0, "delta": empty_delta, "finish_reason": "stop"}],
        }
        yield f"data: {json.dumps(final)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(_sse_generator(), media_type="text/event-stream")
