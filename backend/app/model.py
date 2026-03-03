import threading
from collections.abc import Iterator

import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TextIteratorStreamer,
)

MODEL_ID = "HuggingFaceTB/SmolLM2-360M-Instruct"
SYSTEM_PROMPT = (
    "You are a helpful, friendly, and concise AI assistant. "
    "Answer clearly and truthfully. Keep responses focused and concise."
)

_lock = threading.Lock()
_tokenizer: AutoTokenizer | None = None
_model: AutoModelForCausalLM | None = None
_model_loaded = False


def _load() -> None:
    global _tokenizer, _model, _model_loaded
    print(f"[model] Loading {MODEL_ID} on CPU ...")
    _tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float32,
        low_cpu_mem_usage=True,
    )
    _model.eval()
    _model_loaded = True
    print("[model] Model ready.")


def ensure_loaded() -> None:
    global _model_loaded
    if not _model_loaded:
        with _lock:
            if not _model_loaded:  # double-checked locking
                _load()


def is_loaded() -> bool:
    return _model_loaded


def generate_reply(history: list[dict]) -> str:
    """
    history: list of {"role": str, "content": str} (without timestamps)
    Returns: assistant reply string
    """
    ensure_loaded()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    # Apply the model's built-in chat template.
    # add_generation_prompt=True appends the assistant turn prefix so the
    # model continues as the assistant, not as the user.
    prompt_str = _tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    # add_special_tokens=False because apply_chat_template already embeds
    # BOS/EOS; re-encoding with it True would duplicate the BOS token.
    inputs = _tokenizer(
        prompt_str,
        return_tensors="pt",
        add_special_tokens=False,
    )
    input_len = inputs["input_ids"].shape[-1]

    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=256,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1,
            pad_token_id=_tokenizer.eos_token_id,
        )

    # Decode only the newly generated tokens to strip the echoed prompt.
    new_tokens = output_ids[0][input_len:]
    return _tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


def generate_stream(history: list[dict]) -> Iterator[str]:
    """
    history: list of {"role": str, "content": str} (without timestamps)
    Yields assistant reply tokens one by one.
    """
    ensure_loaded()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

    prompt_str = _tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = _tokenizer(
        prompt_str,
        return_tensors="pt",
        add_special_tokens=False,
    )

    streamer = TextIteratorStreamer(
        _tokenizer,
        skip_prompt=True,
        skip_special_tokens=True,
    )

    generation_kwargs = {
        **inputs,
        "streamer": streamer,
        "max_new_tokens": 256,
        "do_sample": True,
        "temperature": 0.7,
        "top_p": 0.9,
        "repetition_penalty": 1.1,
        "pad_token_id": _tokenizer.eos_token_id,
    }

    thread = threading.Thread(
        target=_model.generate, kwargs=generation_kwargs
    )
    thread.start()

    for token in streamer:
        yield token

    thread.join()
