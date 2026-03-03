from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """FastAPI TestClient with model loading and inference mocked out."""
    with (
        patch("app.model.ensure_loaded"),
        patch("app.model.generate_reply", return_value="mocked reply"),
    ):
        from app.main import app

        with TestClient(app) as c:
            yield c
