from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import search, location
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="EyeOfTR API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "Accept-Charset"],  # Türkçe charset desteği
)

# Routes
app.include_router(search.router)
app.include_router(location.router)


@app.get("/health")
async def health():
    return JSONResponse({"status": "ok"})
