from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import search
import logging

# ... existing code ...

app = FastAPI(title="FaceSeek API")

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

# ... rest of code ...
