"""Integration tests for the chat API routes.

The `client` fixture (from conftest.py) mocks out model loading and inference
so tests run without downloading or executing the actual ML model.
"""


def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "model_loaded" in data


def test_new_conversation_returns_201(client):
    resp = client.post("/api/chat/new")
    assert resp.status_code == 201


def test_new_conversation_returns_conversation_id(client):
    data = client.post("/api/chat/new").json()
    assert "conversation_id" in data
    assert isinstance(data["conversation_id"], str)
    assert len(data["conversation_id"]) > 0


def test_new_conversation_ids_are_unique(client):
    id1 = client.post("/api/chat/new").json()["conversation_id"]
    id2 = client.post("/api/chat/new").json()["conversation_id"]
    assert id1 != id2


def test_send_message_returns_200_with_assistant_reply(client):
    cid = client.post("/api/chat/new").json()["conversation_id"]
    resp = client.post(f"/api/chat/{cid}/message", json={"content": "Hello"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "assistant"
    assert data["content"] == "mocked reply"
    assert data["conversation_id"] == cid
    assert "timestamp" in data


def test_send_message_empty_content_returns_422(client):
    cid = client.post("/api/chat/new").json()["conversation_id"]
    resp = client.post(f"/api/chat/{cid}/message", json={"content": ""})
    assert resp.status_code == 422


def test_send_message_content_over_limit_returns_422(client):
    cid = client.post("/api/chat/new").json()["conversation_id"]
    resp = client.post(f"/api/chat/{cid}/message", json={"content": "x" * 4097})
    assert resp.status_code == 422


def test_send_message_works_for_unknown_conversation_id(client):
    """Backend is stateless — any conversation ID is accepted."""
    resp = client.post(
        "/api/chat/nonexistent-id/message",
        json={"content": "Hello"},
    )
    assert resp.status_code == 200


def test_send_message_passes_history_to_model(client):
    cid = client.post("/api/chat/new").json()["conversation_id"]
    history = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    resp = client.post(
        f"/api/chat/{cid}/message",
        json={"content": "how are you?", "messages": history},
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "assistant"


def test_delete_conversation_returns_204(client):
    cid = client.post("/api/chat/new").json()["conversation_id"]
    resp = client.delete(f"/api/chat/{cid}")
    assert resp.status_code == 204


def test_delete_unknown_conversation_returns_204(client):
    """Delete is a no-op — any ID returns 204."""
    resp = client.delete("/api/chat/nonexistent-id")
    assert resp.status_code == 204
