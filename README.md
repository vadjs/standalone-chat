# Standalone Chat

A standalong chat application with a Python FastAPI backend and a Next.js (React) frontend.

Capable to use any lightweight model from Hugging Face.

Currently configured to run `SmolLM2-360M-Instruct` which is capable of running on CPU.

## Requirements

- Docker and Docker Compose


## Quick Start

```bash
docker compose up --build
```

Then open `http://localhost:3000` in your browser.

API docs are available at `http://localhost:8000/docs`

## Stopping

```bash
docker compose down
```

## Technology Stack

LLM - SmolLM2-360M-Instruct
Inference engine - HuggingFace Transformers + PyTorch CPU
Backend API - Python 3.13, FastAPI, Uvicorn
Frontend - Next.js 16 (App Router), React 19


## Technical desisions

- **Use CPU for the inference** - to ensure the best compatibility across different environments without requiring GPU setup.
- **Don't use VLLM** - inustrial-grade inference uses VLLM for optimal performance. But it's higly dependent on the platfoem where it runs. Even the CPU inferce versions are differrent for x86 and Aplle Silicon.
- **Use Next.js** - this is de-facto standard for React applications novadays.
- **Use Tailwind CSS** - the most common CSS framework in React ecosystem.
- **No chat kits** - there are some open-source chat UI kits available (CopilotKit, LlamaIndex). This is more practical for the production usage. But the requirement is not to use such kits.


## Extra Features

- **Dark / light mode toggle** — persisted to `localStorage`. Default - system, based on `prefers-color-scheme`.
- **Conversation history** - conversations are stored in frontend state and persisted to `localStorage`.
- **Conversation sidebar** - like in ChatGPT
- **Thinking indicator** - animated three-dot bounce while the model generates a response.
- **Response streaming** - the backend streams the response instead of waiting for the full answer to be generated.
- **Hover UX** — message timestamps and copy-to-clipboard buttons appear on mouse hover.
- **Auto-resize input** — the message textarea grows up to 5 lines as you type.
- **Initial prompt chips** — few example questions are shown when starting a new conversation.
- **Error toast** — a banner shows backend errors and auto-dismisses after 5 seconds.

## Local Development (without Docker)

**Prerequisites:** 
- uv
- pnpm

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

```bash
# Frontend
cd frontend
pnpm i
pnpm dev
```

## Unit Tests

```bash
# Backend
cd backend
uv run pytest tests
``` 

```bash
# Frontend
cd frontend
pnpm test
```
