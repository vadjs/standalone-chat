from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import model
from app.routes.chat import router as chat_router
from app.routes.completions import router as completions_router
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    model.ensure_loaded()
    yield


app = FastAPI(title="Standlone Chat API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)
app.include_router(completions_router)


@app.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok", model_loaded=model.is_loaded())
