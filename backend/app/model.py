import logging
import threading
from collections.abc import Iterator
from typing import Any, cast

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    PreTrainedModel,
    PreTrainedTokenizerBase,
    TextIteratorStreamer,
)

logger = logging.getLogger(__name__)

MODEL_ID = "HuggingFaceTB/SmolLM2-360M-Instruct"
SYSTEM_PROMPT = (
    "You are a helpful, friendly, and concise AI assistant. "
    "Answer clearly and truthfully. Keep responses focused and concise."
)

_lock = threading.Lock()
_tokenizer: PreTrainedTokenizerBase | None = None
_model: PreTrainedModel | None = None
_model_loaded = False


def _load() -> None:
    global _tokenizer, _model, _model_loaded
    logger.info("Loading %s on CPU ...", MODEL_ID)
    _tokenizer = cast(PreTrainedTokenizerBase, AutoTokenizer.from_pretrained(MODEL_ID))  # pyright: ignore[reportUnknownMemberType]
    _model = cast(
        PreTrainedModel,
        AutoModelForCausalLM.from_pretrained(  # pyright: ignore[reportUnknownMemberType]
            MODEL_ID,
            torch_dtype=torch.float32,
            low_cpu_mem_usage=True,
        ),
    )
    _model.eval()
    _model_loaded = True
    logger.info("Model ready.")


def ensure_loaded() -> None:
    global _model_loaded
    if not _model_loaded:
        with _lock:
            if not _model_loaded:  # double-checked locking
                _load()


def is_loaded() -> bool:
    return _model_loaded


def generate_reply(history: list[dict[str, str]]) -> str:
    """
    history: list of {"role": str, "content": str} (without timestamps)
    Returns the full assistant reply as a string.
    """
    ensure_loaded()
    assert _tokenizer is not None and _model is not None

    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    prompt_str = cast(
        str,
        _tokenizer.apply_chat_template(  # pyright: ignore[reportUnknownMemberType]
            messages,
            tokenize=False,
            add_generation_prompt=True,
        ),
    )

    inputs = _tokenizer(
        prompt_str,
        return_tensors="pt",
        add_special_tokens=False,
    )

    input_ids: torch.Tensor = inputs["input_ids"]
    input_len = input_ids.shape[1]

    output_ids: torch.Tensor = cast(Any, _model).generate(
        input_ids,
        max_new_tokens=256,
        do_sample=True,
        temperature=0.7,
        top_p=0.9,
        repetition_penalty=1.1,
        pad_token_id=cast(int | None, _tokenizer.eos_token_id),  # pyright: ignore[reportUnknownMemberType]
    )

    new_tokens = output_ids[0][input_len:]
    return cast(str, _tokenizer.decode(new_tokens, skip_special_tokens=True)).strip()  # pyright: ignore[reportUnknownMemberType]


def generate_stream(history: list[dict[str, str]]) -> Iterator[str]:
    """
    history: list of {"role": str, "content": str} (without timestamps)
    Yields assistant reply tokens one by one.
    """
    ensure_loaded()
    assert _tokenizer is not None and _model is not None

    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    prompt_str = cast(
        str,
        _tokenizer.apply_chat_template(  # pyright: ignore[reportUnknownMemberType]
            messages,
            tokenize=False,
            add_generation_prompt=True,
        ),
    )

    inputs = _tokenizer(
        prompt_str,
        return_tensors="pt",
        add_special_tokens=False,
    )

    streamer = TextIteratorStreamer(
        cast(AutoTokenizer, _tokenizer),
        skip_prompt=True,
        skip_special_tokens=True,
    )

    generation_kwargs: dict[str, Any] = {
        **inputs,
        "streamer": streamer,
        "max_new_tokens": 256,
        "do_sample": True,
        "temperature": 0.7,
        "top_p": 0.9,
        "repetition_penalty": 1.1,
        "pad_token_id": cast(int | None, _tokenizer.eos_token_id),  # pyright: ignore[reportUnknownMemberType]
    }

    thread = threading.Thread(target=cast(Any, _model).generate, kwargs=generation_kwargs)
    thread.start()

    yield from streamer

    thread.join()
