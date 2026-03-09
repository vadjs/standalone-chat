from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=4096)
    messages: list[HistoryMessage] = Field(default_factory=list)


class MessageOut(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: str


class NewConversationResponse(BaseModel):
    conversation_id: str


class ChatResponse(BaseModel):
    conversation_id: str
    role: Literal["assistant"]
    content: str
    timestamp: str


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
