import pytest
from pydantic import ValidationError

from app.schemas import (
    ChatResponse,
    HealthResponse,
    MessageIn,
    MessageOut,
    NewConversationResponse,
)

_TS = "2024-01-01T00:00:00+00:00"


def test_message_in_valid():
    msg = MessageIn(content="Hello, world!")
    assert msg.content == "Hello, world!"


def test_message_in_empty_content_fails():
    with pytest.raises(ValidationError):
        MessageIn(content="")


def test_message_in_content_at_max_length_passes():
    msg = MessageIn(content="x" * 4096)
    assert len(msg.content) == 4096


def test_message_in_content_over_max_length_fails():
    with pytest.raises(ValidationError):
        MessageIn(content="x" * 4097)


def test_message_out_user_role():
    msg = MessageOut(role="user", content="hi", timestamp=_TS)
    assert msg.role == "user"


def test_message_out_assistant_role():
    msg = MessageOut(role="assistant", content="hello", timestamp=_TS)
    assert msg.role == "assistant"


def test_message_out_invalid_role_fails():
    with pytest.raises(ValidationError):
        MessageOut(role="system", content="hi", timestamp=_TS)


def test_new_conversation_response_stores_id():
    resp = NewConversationResponse(conversation_id="abc-123")
    assert resp.conversation_id == "abc-123"


def test_chat_response_valid():
    resp = ChatResponse(
        conversation_id="abc",
        role="assistant",
        content="Hello",
        timestamp=_TS,
    )
    assert resp.role == "assistant"
    assert resp.content == "Hello"


def test_chat_response_rejects_non_assistant_role():
    with pytest.raises(ValidationError):
        ChatResponse(
            conversation_id="abc",
            role="user",
            content="Hello",
            timestamp=_TS,
        )


def test_health_response_loaded():
    resp = HealthResponse(status="ok", model_loaded=True)
    assert resp.status == "ok"
    assert resp.model_loaded is True


def test_health_response_not_loaded():
    resp = HealthResponse(status="ok", model_loaded=False)
    assert resp.model_loaded is False
