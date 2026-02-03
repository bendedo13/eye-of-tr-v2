import asyncio
import json
import time
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.data_platform import CrawlJob, DataSource, Document
from app.models.user import User
from app.schemas.data_platform import (
    CrawlJobOut,
    CrawlJobStart,
    DataSourceCreate,
    DataSourceOut,
    DataSourceUpdate,
    DocumentOut,
    DocumentSearchResponse,
)
from app.services.data_platform_pipeline import _json_dumps, _json_loads
from app.services.data_platform_runner import JobNotFound, cancel_job, job_bus, start_job

router = APIRouter(prefix="/api/data-platform", tags=["data-platform"])

_search_cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
_search_cache_ttl_s = 15.0


def _cache_get(key: str) -> Optional[Dict[str, Any]]:
    now = time.monotonic()
    item = _search_cache.get(key)
    if not item:
        return None
    exp, payload = item
    if now >= exp:
        _search_cache.pop(key, None)
        return None
    return payload


def _cache_set(key: str, payload: Dict[str, Any]) -> None:
    _search_cache[key] = (time.monotonic() + _search_cache_ttl_s, payload)


def _source_to_out(src: DataSource) -> DataSourceOut:
    return DataSourceOut(
        id=src.id,
        owner_user_id=src.owner_user_id,
        name=src.name,
        kind=src.kind,
        base_url=src.base_url,
        is_enabled=src.is_enabled,
        crawl_config=_json_loads(src.crawl_config_json, {}),
        transform_config=_json_loads(src.transform_config_json, {}),
        classify_config=_json_loads(src.classify_config_json, {}),
        retention_config=_json_loads(src.retention_config_json, {}),
        last_crawl_started_at=src.last_crawl_started_at,
        last_crawl_finished_at=src.last_crawl_finished_at,
        last_crawl_status=src.last_crawl_status,
        created_at=src.created_at,
        updated_at=src.updated_at,
    )


def _job_to_out(job: CrawlJob) -> CrawlJobOut:
    return CrawlJobOut(
        id=job.id,
        owner_user_id=job.owner_user_id,
        source_id=job.source_id,
        status=job.status,
        message=job.message,
        consent_received=job.consent_received,
        policy_context=_json_loads(job.policy_context_json, {}),
        strategy_override=_json_loads(job.strategy_override_json, {}),
        started_at=job.started_at,
        finished_at=job.finished_at,
        discovered_count=job.discovered_count,
        fetched_count=job.fetched_count,
        stored_count=job.stored_count,
        skipped_count=job.skipped_count,
        failed_count=job.failed_count,
        created_at=job.created_at,
    )


def _doc_to_out(doc: Document) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        owner_user_id=doc.owner_user_id,
        source_id=doc.source_id,
        job_id=doc.job_id,
        url=doc.url,
        canonical_url=doc.canonical_url,
        title=doc.title,
        content_text=doc.content_text,
        extracted=_json_loads(doc.extracted_json, {}),
        language=doc.language,
        category=doc.category,
        tags=_json_loads(doc.tags_json, []),
        quality_score=doc.quality_score,
        quality_flags=_json_loads(doc.quality_flags_json, []),
        pii_redacted=doc.pii_redacted,
        first_seen_at=doc.first_seen_at,
        last_seen_at=doc.last_seen_at,
    )


@router.post("/sources", response_model=DataSourceOut, status_code=status.HTTP_201_CREATED)
def create_source(
    payload: DataSourceCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    src = DataSource(
        owner_user_id=user.id,
        name=payload.name,
        kind=payload.kind,
        base_url=payload.base_url,
        is_enabled=True,
        crawl_config_json=_json_dumps(payload.crawl_config),
        transform_config_json=_json_dumps(payload.transform_config),
        classify_config_json=_json_dumps(payload.classify_config),
        retention_config_json=_json_dumps(payload.retention_config),
    )
    db.add(src)
    db.commit()
    db.refresh(src)
    return _source_to_out(src)


@router.get("/sources", response_model=List[DataSourceOut])
def list_sources(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sources = (
        db.query(DataSource)
        .filter(DataSource.owner_user_id == user.id)
        .order_by(desc(DataSource.created_at))
        .all()
    )
    return [_source_to_out(s) for s in sources]


@router.patch("/sources/{source_id}", response_model=DataSourceOut)
def update_source(
    source_id: int,
    payload: DataSourceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    src = (
        db.query(DataSource)
        .filter(DataSource.id == source_id, DataSource.owner_user_id == user.id)
        .first()
    )
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")

    if payload.name is not None:
        src.name = payload.name
    if payload.base_url is not None:
        src.base_url = payload.base_url
    if payload.is_enabled is not None:
        src.is_enabled = payload.is_enabled
    if payload.crawl_config is not None:
        src.crawl_config_json = _json_dumps(payload.crawl_config)
    if payload.transform_config is not None:
        src.transform_config_json = _json_dumps(payload.transform_config)
    if payload.classify_config is not None:
        src.classify_config_json = _json_dumps(payload.classify_config)
    if payload.retention_config is not None:
        src.retention_config_json = _json_dumps(payload.retention_config)

    db.commit()
    db.refresh(src)
    return _source_to_out(src)


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_source(
    source_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    src = (
        db.query(DataSource)
        .filter(DataSource.id == source_id, DataSource.owner_user_id == user.id)
        .first()
    )
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(src)
    db.commit()
    return None


@router.post("/sources/{source_id}/jobs", response_model=CrawlJobOut, status_code=status.HTTP_201_CREATED)
async def start_crawl_job(
    source_id: int,
    payload: CrawlJobStart,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    src = (
        db.query(DataSource)
        .filter(DataSource.id == source_id, DataSource.owner_user_id == user.id)
        .first()
    )
    if not src:
        raise HTTPException(status_code=404, detail="Source not found")
    if not src.is_enabled:
        raise HTTPException(status_code=400, detail="Source disabled")
    if not payload.consent:
        raise HTTPException(status_code=400, detail="Consent required")

    job = CrawlJob(
        owner_user_id=user.id,
        source_id=src.id,
        status="queued",
        consent_received=True,
        policy_context_json=_json_dumps(payload.policy_context),
        strategy_override_json=_json_dumps(payload.strategy_override),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    started = start_job(job.id)
    if not started:
        raise HTTPException(status_code=409, detail="Job already running")
    return _job_to_out(job)


@router.get("/jobs", response_model=List[CrawlJobOut])
def list_jobs(
    source_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(CrawlJob).filter(CrawlJob.owner_user_id == user.id)
    if source_id is not None:
        q = q.filter(CrawlJob.source_id == source_id)
    jobs = q.order_by(desc(CrawlJob.created_at)).limit(200).all()
    return [_job_to_out(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=CrawlJobOut)
def get_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id, CrawlJob.owner_user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _job_to_out(job)


@router.post("/jobs/{job_id}/cancel", response_model=CrawlJobOut)
def cancel_crawl_job(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id, CrawlJob.owner_user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    cancel_job(job_id)
    return _job_to_out(job)


@router.get("/jobs/{job_id}/events")
async def stream_job_events(
    job_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id, CrawlJob.owner_user_id == user.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    queue = job_bus.get_queue(job_id)

    async def gen():
        yield "event: hello\ndata: {}\n\n"
        while True:
            try:
                ev = await asyncio.wait_for(queue.get(), timeout=15.0)
                yield ev.to_sse()
            except asyncio.TimeoutError:
                yield "event: ping\ndata: {}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/documents", response_model=DocumentSearchResponse)
def search_documents(
    q: Optional[str] = Query(default=None, max_length=300),
    source_id: Optional[int] = None,
    category: Optional[str] = Query(default=None, max_length=64),
    tags: Optional[List[str]] = Query(default=None),
    quality_min: Optional[float] = Query(default=None, ge=0, le=100),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=100000),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cache_key = json.dumps(
        {
            "u": user.id,
            "q": q,
            "source_id": source_id,
            "category": category,
            "tags": tags or [],
            "quality_min": quality_min,
            "limit": limit,
            "offset": offset,
        },
        ensure_ascii=False,
        separators=(",", ":"),
    )
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached

    filt = [Document.owner_user_id == user.id]
    if source_id is not None:
        filt.append(Document.source_id == source_id)
    if category:
        filt.append(Document.category == category)
    if quality_min is not None:
        filt.append(Document.quality_score >= quality_min)
    if q:
        like = f"%{q.strip()}%"
        filt.append(or_(Document.title.ilike(like), Document.content_text.ilike(like)))
    if tags:
        for t in tags:
            t = (t or "").strip()
            if not t:
                continue
            filt.append(Document.tags_json.ilike(f'%"{t}"%'))

    base = db.query(Document).filter(and_(*filt))
    total = base.count()
    rows = base.order_by(desc(Document.last_seen_at)).offset(offset).limit(limit).all()
    out = DocumentSearchResponse(total=total, items=[_doc_to_out(d) for d in rows]).model_dump()
    _cache_set(cache_key, out)
    return out


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return _doc_to_out(doc)


@router.post("/documents/{document_id}/purge", response_model=DocumentOut)
def purge_document(
    document_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_user_id == user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.title = None
    doc.content_text = ""
    doc.raw_text = None
    doc.extracted_json = "{}"
    doc.tags_json = "[]"
    doc.quality_flags_json = _json_dumps(["purged"])
    doc.quality_score = 0.0
    doc.pii_redacted = True
    db.commit()
    db.refresh(doc)
    return _doc_to_out(doc)


@router.get("/quality/summary")
def quality_summary(
    source_id: Optional[int] = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Document).filter(Document.owner_user_id == user.id)
    if source_id is not None:
        q = q.filter(Document.source_id == source_id)

    total = q.count()
    avg_score = q.with_entities(func.avg(Document.quality_score)).scalar() if total else None
    low = q.filter(Document.quality_score < 30).count() if total else 0
    no_title = q.filter(Document.quality_flags_json.ilike('%"no_title"%')).count() if total else 0
    too_short = q.filter(Document.quality_flags_json.ilike('%"too_short"%')).count() if total else 0

    return {
        "total": total,
        "avg_score": float(avg_score) if avg_score is not None else None,
        "low_quality_count": low,
        "flags": {"no_title": no_title, "too_short": too_short},
    }
