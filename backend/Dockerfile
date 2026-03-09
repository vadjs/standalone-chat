FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --no-install-project

COPY app/ ./app/

# HuggingFace model cache: contents are stored in the named Docker volume
# so weights are downloaded only on first run and reused thereafter.
ENV HF_HOME=/model_cache
ENV TRANSFORMERS_CACHE=/model_cache

# Activate the uv-managed venv
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# The health check start period accounts for the first-run model download.
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
