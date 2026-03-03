"""Unit tests for the model module.

All tests mock out the actual HuggingFace model so no weights are downloaded.
Module-level globals (_model_loaded, _tokenizer, _model) are reset between
tests via the autouse fixture below.
"""

from unittest.mock import MagicMock, patch

import pytest
import torch

import app.model as model_module


@pytest.fixture(autouse=True)
def reset_model_globals():
    """Save and restore model module globals around each test."""
    saved = (
        model_module._model_loaded,
        model_module._tokenizer,
        model_module._model,
    )
    model_module._model_loaded = False
    model_module._tokenizer = None
    model_module._model = None
    yield
    model_module._model_loaded, model_module._tokenizer, model_module._model = saved


def test_is_loaded_returns_false_initially():
    assert model_module.is_loaded() is False


def test_is_loaded_returns_true_after_model_is_set():
    model_module._model_loaded = True
    assert model_module.is_loaded() is True


def test_ensure_loaded_calls_load_when_not_loaded():
    with patch("app.model._load") as mock_load:
        model_module.ensure_loaded()
    mock_load.assert_called_once()


def test_ensure_loaded_does_not_call_load_when_already_loaded():
    model_module._model_loaded = True
    with patch("app.model._load") as mock_load:
        model_module.ensure_loaded()
    mock_load.assert_not_called()


def test_ensure_loaded_calls_load_only_once_across_multiple_calls():
    def _set_loaded():
        model_module._model_loaded = True

    with patch("app.model._load", side_effect=_set_loaded) as mock_load:
        model_module.ensure_loaded()
        model_module.ensure_loaded()
        model_module.ensure_loaded()

    mock_load.assert_called_once()


def _make_mock_tokenizer(input_ids: torch.Tensor) -> MagicMock:
    """Return a MagicMock tokenizer that produces the given input_ids tensor."""
    tok = MagicMock()
    tok.apply_chat_template.return_value = "formatted_prompt"
    tok.return_value = {"input_ids": input_ids}
    tok.decode.return_value = "  mocked response  "
    return tok


def _make_mock_model(output_ids: torch.Tensor) -> MagicMock:
    m = MagicMock()
    m.generate.return_value = output_ids
    return m


def test_generate_reply_prepends_system_prompt():
    input_ids = torch.tensor([[1, 2, 3]])
    output_ids = torch.tensor([[1, 2, 3, 4]])

    mock_tok = _make_mock_tokenizer(input_ids)
    mock_mdl = _make_mock_model(output_ids)

    model_module._tokenizer = mock_tok
    model_module._model = mock_mdl
    model_module._model_loaded = True

    history = [{"role": "user", "content": "Hello"}]
    model_module.generate_reply(history)

    messages_arg = mock_tok.apply_chat_template.call_args[0][0]
    assert messages_arg[0]["role"] == "system"
    assert messages_arg[0]["content"] == model_module.SYSTEM_PROMPT
    assert messages_arg[1:] == history


def test_generate_reply_strips_whitespace():
    input_ids = torch.tensor([[1, 2, 3]])
    output_ids = torch.tensor([[1, 2, 3, 4]])

    mock_tok = _make_mock_tokenizer(input_ids)
    mock_tok.decode.return_value = "  response with spaces  "
    mock_mdl = _make_mock_model(output_ids)

    model_module._tokenizer = mock_tok
    model_module._model = mock_mdl
    model_module._model_loaded = True

    result = model_module.generate_reply([])
    assert result == "response with spaces"


def test_generate_reply_decodes_only_new_tokens():
    """Verify only the tokens after input_len are decoded."""
    input_ids = torch.tensor([[10, 20, 30]])  # length 3
    output_ids = torch.tensor([[10, 20, 30, 40, 50]])  # model echoes input + 2 new

    mock_tok = _make_mock_tokenizer(input_ids)
    mock_tok.decode.return_value = "new tokens"
    mock_mdl = _make_mock_model(output_ids)

    model_module._tokenizer = mock_tok
    model_module._model = mock_mdl
    model_module._model_loaded = True

    model_module.generate_reply([])

    decoded_arg = mock_tok.decode.call_args[0][0]
    # Should be the last 2 tokens, not the full output
    expected = torch.tensor([40, 50])
    assert torch.equal(decoded_arg, expected)


def test_generate_reply_calls_ensure_loaded():
    model_module._model_loaded = True

    input_ids = torch.tensor([[1]])
    output_ids = torch.tensor([[1, 2]])
    mock_tok = _make_mock_tokenizer(input_ids)
    mock_mdl = _make_mock_model(output_ids)

    model_module._tokenizer = mock_tok
    model_module._model = mock_mdl

    with patch("app.model.ensure_loaded") as mock_ensure:
        model_module.generate_reply([])

    mock_ensure.assert_called_once()
