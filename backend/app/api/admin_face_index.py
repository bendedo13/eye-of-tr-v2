import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.modules.face_index.models import FaceSource, FaceCrawlJob, FaceImage, IndexedFace, ProxyServer
from app.modules.face_index.schemas import (
    SourceCreate, SourceUpdate, SourceOut, JobOut,
    FaceIndexConfig, FaceIndexStatus,
    ProxyCreate, ProxyOut, ProxyImport,
)
from app.modules.face_index.vector_store import get_face_index_store

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/face-index", tags=["admin-face-index"])


def _require_admin_key(request: Request):
    key = request.headers.get("x-admin-key", "")
    expected = settings.ADMIN_API_KEY or "Benalan.1"
    if key != expected:
        raise HTTPException(status_code=403, detail="Forbidden")


# ---- Status ----

@router.get("/status")
def get_status(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)

    total_sources = db.query(FaceSource).count()
    active_sources = db.query(FaceSource).filter(FaceSource.is_enabled == True).count()
    total_images = db.query(FaceImage).count()
    total_faces = db.query(IndexedFace).count()
    running_jobs = db.query(FaceCrawlJob).filter(FaceCrawlJob.status == "running").count()

    store = get_face_index_store()

    return FaceIndexStatus(
        total_faces=total_faces,
        total_images=total_images,
        total_sources=total_sources,
        active_sources=active_sources,
        running_jobs=running_jobs,
        index_size_mb=round(store.index_size_mb(), 2),
        embedding_model=f"insightface:{settings.INSIGHTFACE_MODEL}",
        embedding_version=int(getattr(settings, "FACE_INDEX_EMBEDDING_VERSION", 1)),
    )


# ---- Sources CRUD ----

@router.get("/sources")
def list_sources(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    sources = db.query(FaceSource).order_by(FaceSource.id.desc()).all()
    return [SourceOut.model_validate(s) for s in sources]


@router.post("/sources")
def create_source(request: Request, body: SourceCreate, db: Session = Depends(get_db)):
    _require_admin_key(request)
    src = FaceSource(
        name=body.name,
        kind=body.kind,
        base_url=body.base_url,
        is_enabled=body.is_enabled,
        crawl_config_json=body.crawl_config_json,
        rate_limit_rpm=body.rate_limit_rpm,
        rate_limit_concurrent=body.rate_limit_concurrent,
        schedule_cron=body.schedule_cron,
        schedule_enabled=body.schedule_enabled,
    )
    db.add(src)
    db.commit()
    db.refresh(src)

    # Register schedule if enabled
    if src.schedule_enabled and src.schedule_cron:
        try:
            from app.modules.face_index.scheduler import schedule_source
            schedule_source(src.id, src.schedule_cron)
        except Exception as e:
            logger.warning(f"Failed to schedule source {src.id}: {e}")

    return SourceOut.model_validate(src)


@router.patch("/sources/{source_id}")
def update_source(source_id: int, request: Request, body: SourceUpdate, db: Session = Depends(get_db)):
    _require_admin_key(request)
    src = db.query(FaceSource).filter(FaceSource.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(src, field, value)
    db.commit()
    db.refresh(src)

    # Update schedule
    if src.schedule_enabled and src.schedule_cron:
        try:
            from app.modules.face_index.scheduler import schedule_source
            schedule_source(src.id, src.schedule_cron)
        except Exception:
            pass
    else:
        try:
            from app.modules.face_index.scheduler import unschedule_source
            unschedule_source(src.id)
        except Exception:
            pass

    return SourceOut.model_validate(src)


@router.delete("/sources/{source_id}")
def delete_source(source_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    src = db.query(FaceSource).filter(FaceSource.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    # Unschedule
    try:
        from app.modules.face_index.scheduler import unschedule_source
        unschedule_source(source_id)
    except Exception:
        pass

    # Delete related records
    db.query(IndexedFace).filter(IndexedFace.source_id == source_id).delete()
    db.query(FaceImage).filter(FaceImage.source_id == source_id).delete()
    db.query(FaceCrawlJob).filter(FaceCrawlJob.source_id == source_id).delete()
    db.delete(src)
    db.commit()
    return {"status": "deleted", "source_id": source_id}


# ---- Crawl Jobs ----

@router.post("/sources/{source_id}/crawl")
async def trigger_crawl(source_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    src = db.query(FaceSource).filter(FaceSource.id == source_id).first()
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    # Check if already running
    running = db.query(FaceCrawlJob).filter(
        FaceCrawlJob.source_id == source_id,
        FaceCrawlJob.status.in_(["queued", "running"]),
    ).first()
    if running:
        raise HTTPException(status_code=409, detail="Crawl already in progress")

    job = FaceCrawlJob(source_id=source_id, status="queued")
    db.add(job)
    db.commit()
    db.refresh(job)

    # Enqueue
    try:
        from app.modules.face_index.worker import enqueue_job
        await enqueue_job(job.id)
    except Exception as e:
        logger.error(f"Failed to enqueue job: {e}")
        job.status = "failed"
        job.message = f"Queue error: {e}"
        db.commit()

    return JobOut.model_validate(job)


@router.get("/jobs")
def list_jobs(
    request: Request,
    source_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    _require_admin_key(request)
    q = db.query(FaceCrawlJob)
    if source_id:
        q = q.filter(FaceCrawlJob.source_id == source_id)
    if status:
        q = q.filter(FaceCrawlJob.status == status)
    jobs = q.order_by(FaceCrawlJob.id.desc()).limit(limit).all()
    return [JobOut.model_validate(j) for j in jobs]


@router.get("/jobs/{job_id}")
def get_job(job_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    job = db.query(FaceCrawlJob).filter(FaceCrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobOut.model_validate(job)


@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    job = db.query(FaceCrawlJob).filter(FaceCrawlJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("queued", "running"):
        raise HTTPException(status_code=400, detail="Job is not active")
    job.status = "cancelled"
    job.finished_at = datetime.now(timezone.utc)
    db.commit()
    return JobOut.model_validate(job)


# ---- Config ----

@router.get("/config")
def get_config(request: Request):
    _require_admin_key(request)
    return FaceIndexConfig(
        similarity_threshold=float(getattr(settings, "FACE_INDEX_SIMILARITY_THRESHOLD", 0.6)),
        top_k_default=int(getattr(settings, "FACE_INDEX_TOP_K_DEFAULT", 10)),
        min_face_det_score=float(getattr(settings, "FACE_INDEX_MIN_FACE_DET_SCORE", 0.5)),
        crawler_default_rpm=int(getattr(settings, "FACE_INDEX_CRAWLER_DEFAULT_RPM", 30)),
        crawler_concurrent=int(getattr(settings, "FACE_INDEX_CRAWLER_CONCURRENT", 3)),
        max_faces_per_image=int(getattr(settings, "FACE_INDEX_MAX_FACES_PER_IMAGE", 10)),
    )


# ---- Reindex ----

@router.post("/reindex")
async def reindex(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    store = get_face_index_store()
    await store.reset()

    faces = db.query(IndexedFace).order_by(IndexedFace.id).all()
    if not faces:
        return {"status": "empty", "reindexed": 0}

    # Re-embed would require loading all images again.
    # For now, just report that a full reindex needs the worker.
    return {
        "status": "reset",
        "message": "FAISS index cleared. Re-crawl sources to rebuild.",
        "faces_in_db": len(faces),
    }


# ---- Proxies CRUD ----

@router.get("/proxies")
def list_proxies(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    proxies = db.query(ProxyServer).order_by(ProxyServer.id.desc()).all()
    return [ProxyOut.model_validate(p) for p in proxies]


@router.post("/proxies")
def create_proxy(request: Request, body: ProxyCreate, db: Session = Depends(get_db)):
    _require_admin_key(request)
    proxy = ProxyServer(
        proxy_url=body.proxy_url,
        proxy_type=body.proxy_type,
        country=body.country,
        label=body.label,
        is_active=body.is_active,
    )
    db.add(proxy)
    db.commit()
    db.refresh(proxy)

    # Invalidate proxy manager cache
    from app.modules.face_index.proxy_manager import get_proxy_manager
    get_proxy_manager().invalidate_cache()

    return ProxyOut.model_validate(proxy)


@router.delete("/proxies/{proxy_id}")
def delete_proxy(proxy_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    proxy = db.query(ProxyServer).filter(ProxyServer.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    db.delete(proxy)
    db.commit()

    from app.modules.face_index.proxy_manager import get_proxy_manager
    get_proxy_manager().invalidate_cache()

    return {"status": "deleted", "proxy_id": proxy_id}


@router.post("/proxies/test")
async def test_proxies(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    from app.modules.face_index.proxy_manager import health_check_all
    result = await health_check_all(db)
    return {"status": "completed", **result}


@router.post("/proxies/import")
def import_proxies(request: Request, body: ProxyImport, db: Session = Depends(get_db)):
    _require_admin_key(request)
    lines = [line.strip() for line in body.proxies.strip().split("\n") if line.strip()]
    added = 0
    skipped = 0
    for line in lines:
        # Skip duplicates
        existing = db.query(ProxyServer).filter(ProxyServer.proxy_url == line).first()
        if existing:
            skipped += 1
            continue
        proxy = ProxyServer(
            proxy_url=line,
            proxy_type=body.proxy_type,
            is_active=True,
        )
        db.add(proxy)
        added += 1
    db.commit()

    from app.modules.face_index.proxy_manager import get_proxy_manager
    get_proxy_manager().invalidate_cache()

    return {"status": "imported", "added": added, "skipped": skipped, "total_lines": len(lines)}


@router.post("/proxies/reactivate")
def reactivate_proxies(request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    from app.modules.face_index.proxy_manager import get_proxy_manager
    pm = get_proxy_manager()
    count = pm.reactivate_all(db)
    return {"status": "reactivated", "count": count}


@router.patch("/proxies/{proxy_id}/toggle")
def toggle_proxy(proxy_id: int, request: Request, db: Session = Depends(get_db)):
    _require_admin_key(request)
    proxy = db.query(ProxyServer).filter(ProxyServer.id == proxy_id).first()
    if not proxy:
        raise HTTPException(status_code=404, detail="Proxy not found")
    proxy.is_active = not proxy.is_active
    if proxy.is_active:
        proxy.fail_count = 0
    db.commit()

    from app.modules.face_index.proxy_manager import get_proxy_manager
    get_proxy_manager().invalidate_cache()

    return {"status": "toggled", "proxy_id": proxy_id, "is_active": proxy.is_active}
