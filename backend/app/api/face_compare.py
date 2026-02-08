"""
Yüz Benzerlik Karşılaştırma Endpoint'i

YASAL UYUMLULUK:
- Biyometrik veritabanı OLUŞTURULMAZ
- Embedding'ler ASLA diske yazılmaz
- Tüm embedding'ler RAM'de işlenir ve yanıt sonrası silinir
- Sistem kimlik tespiti YAPMAZ, yalnızca benzerlik yüzdesi döner
- Kullanıcı, yüklediği fotoğrafın kendisine ait olduğunu onaylamalıdır
"""

import io
import logging
from typing import Annotated

import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.services.embedding_service import EmbeddingError, get_embedder

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/face", tags=["Face Compare"])

MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE  # 10MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


class FaceCompareResult(BaseModel):
    similarity_percent: float
    disclaimer: str


class FaceCompareResponse(BaseModel):
    status: str
    results: list[FaceCompareResult]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """İki normalize embedding vektörü arasında kosinüs benzerliği hesapla."""
    dot = float(np.dot(a, b))
    # Vektörler zaten normalize, ama güvenlik için:
    norm_a = float(np.linalg.norm(a))
    norm_b = float(np.linalg.norm(b))
    if norm_a < 1e-12 or norm_b < 1e-12:
        return 0.0
    sim = dot / (norm_a * norm_b)
    # [-1, 1] aralığını [0, 100] yüzdeye çevir
    return round(max(0.0, min(100.0, (sim + 1.0) / 2.0 * 100.0)), 2)


async def _read_upload(upload: UploadFile) -> bytes:
    """Yüklenen dosyayı oku ve doğrula."""
    if upload.content_type and upload.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Desteklenmeyen dosya tipi: {upload.content_type}. Kabul edilen: JPG, PNG, WebP, HEIC",
        )
    data = await upload.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dosya boyutu çok büyük. Maksimum: {MAX_FILE_SIZE // (1024*1024)}MB",
        )
    if len(data) < 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dosya çok küçük veya bozuk.",
        )
    return data


@router.post("/compare", response_model=FaceCompareResponse)
async def compare_faces(
    source: UploadFile = File(..., description="Karşılaştırılacak kaynak yüz görseli"),
    targets: list[UploadFile] = File(..., description="Karşılaştırılacak hedef görseller (maks 5)"),
    consent: str = Form(..., description="Kullanıcı onayı: 'true' olmalı"),
    current_user: User = Depends(get_current_user),
):
    """
    İki veya daha fazla görsel arasında yüz benzerlik karşılaştırması yapar.

    - Kaynak görsel ile hedef görseller arasında kosinüs benzerliği hesaplar
    - Sonuçlar yüzde olarak döner (0-100)
    - Tüm embedding'ler istek sonrası RAM'den silinir
    - Kullanıcı onayı zorunludur

    YASAL NOT: Bu endpoint kimlik tespiti YAPMAZ.
    Yalnızca matematiksel benzerlik yüzdesi hesaplar.
    """
    # Onay kontrolü
    if consent.lower() != "true":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı onayı gereklidir. consent='true' olmalıdır.",
        )

    # Hedef sayısı kontrolü
    if len(targets) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maksimum 5 hedef görsel karşılaştırılabilir.",
        )

    if len(targets) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="En az 1 hedef görsel gereklidir.",
        )

    # Kredi kontrolü
    if current_user.credits < 1:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Yetersiz kredi. Lütfen kredi satın alın.",
        )

    embedder = get_embedder()
    source_embedding = None
    target_embeddings = []
    results = []

    try:
        # Kaynak görselden embedding çıkar
        source_bytes = await _read_upload(source)
        try:
            source_result = embedder.embed(source_bytes)
            source_embedding = source_result.vector
        except EmbeddingError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Kaynak görselde yüz bulunamadı: {str(e)}",
            )
        finally:
            # Kaynak bytes'ları temizle
            del source_bytes

        # Hedef görsellerden embedding çıkar ve karşılaştır
        for i, target_file in enumerate(targets):
            target_bytes = None
            target_vec = None
            try:
                target_bytes = await _read_upload(target_file)
                try:
                    target_result = embedder.embed(target_bytes)
                    target_vec = target_result.vector
                    target_embeddings.append(target_vec)

                    similarity = cosine_similarity(source_embedding, target_vec)
                    results.append(FaceCompareResult(
                        similarity_percent=similarity,
                        disclaimer="Bu sonuç matematiksel benzerlik yüzdesidir, kimlik tespiti değildir.",
                    ))
                except EmbeddingError:
                    results.append(FaceCompareResult(
                        similarity_percent=0.0,
                        disclaimer="Bu görselde yüz tespit edilemedi.",
                    ))
            finally:
                # Her iterasyonda belleği temizle
                if target_bytes is not None:
                    del target_bytes
                if target_vec is not None:
                    del target_vec

        # Kredi düş
        from app.db.database import SessionLocal
        db = SessionLocal()
        try:
            db_user = db.query(User).filter(User.id == current_user.id).first()
            if db_user:
                db_user.credits = max(0, db_user.credits - 1)
                db.commit()
        finally:
            db.close()

        logger.info(f"Yüz karşılaştırma tamamlandı: user={current_user.id}, hedef_sayısı={len(targets)}")

        return FaceCompareResponse(
            status="success",
            results=results,
        )

    finally:
        # Tüm embedding'leri RAM'den temizle (YASAL ZORUNLULUK)
        if source_embedding is not None:
            source_embedding.fill(0)
            del source_embedding
        for emb in target_embeddings:
            if emb is not None:
                emb.fill(0)
        target_embeddings.clear()
        del target_embeddings
        del results  # results zaten response'a kopyalandı
