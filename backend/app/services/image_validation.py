from __future__ import annotations

import hashlib
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)


ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _looks_like_jpeg(data: bytes) -> bool:
    return len(data) >= 3 and data[0:3] == b"\xFF\xD8\xFF"


def _looks_like_png(data: bytes) -> bool:
    return len(data) >= 8 and data[0:8] == b"\x89PNG\r\n\x1a\n"


def _looks_like_webp(data: bytes) -> bool:
    return len(data) >= 12 and data[0:4] == b"RIFF" and data[8:12] == b"WEBP"


def _signature_ok(ext: str, data: bytes) -> bool:
    if ext in (".jpg", ".jpeg"):
        return _looks_like_jpeg(data)
    if ext == ".png":
        return _looks_like_png(data)
    if ext == ".webp":
        return _looks_like_webp(data)
    return False


def _pillow_can_open(data: bytes) -> bool:
    try:
        from io import BytesIO

        im = Image.open(BytesIO(data))
        im.verify()
        return True
    except Exception:
        return False


@dataclass(frozen=True)
class ValidatedImage:
    ext: str
    size_bytes: int
    sha256: str


def validate_image_upload(*, filename: str, content_type: Optional[str], data: bytes) -> ValidatedImage:
    if not data:
        raise ValueError("Boş dosya")

    if len(data) > settings.MAX_UPLOAD_SIZE:
        raise ValueError("Dosya boyutu limiti aşıldı")

    ext = Path(filename or "upload").suffix.lower() or ".jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Desteklenmeyen dosya formatı: {ext}")

    if not _signature_ok(ext, data):
        raise ValueError("Dosya imzası doğrulanamadı")

    if not _pillow_can_open(data):
        raise ValueError("Görsel doğrulanamadı")

    sha = hashlib.sha256(data).hexdigest()
    return ValidatedImage(ext=ext, size_bytes=len(data), sha256=sha)
