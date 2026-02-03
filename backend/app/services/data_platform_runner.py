import asyncio
import json
from dataclasses import dataclass
from typing import Any, AsyncIterator, Dict, Optional

from datetime import timedelta

from sqlalchemy import delete, desc, func, select, update
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.data_platform import CrawlJob, DataSource, Document
from app.services.data_platform_pipeline import (
    _json_dumps,
    _json_loads,
    classify,
    crawl_api,
    crawl_website,
    detect_language_heuristic,
    now_utc,
    quality_score,
    redact_pii,
    url_hash,
)


class JobNotFound(Exception):
    pass


@dataclass
class JobEvent:
    type: str
    payload: Dict[str, Any]

    def to_sse(self) -> str:
        data = json.dumps({"type": self.type, "payload": self.payload}, ensure_ascii=False)
        return f"data: {data}\n\n"


class InMemoryJobBus:
    def __init__(self) -> None:
        self._queues: Dict[int, asyncio.Queue[JobEvent]] = {}

    def get_queue(self, job_id: int) -> asyncio.Queue[JobEvent]:
        if job_id not in self._queues:
            self._queues[job_id] = asyncio.Queue()
        return self._queues[job_id]

    async def publish(self, job_id: int, event: JobEvent) -> None:
        q = self.get_queue(job_id)
        await q.put(event)


job_bus = InMemoryJobBus()
_job_tasks: Dict[int, asyncio.Task] = {}


def _load_job_and_source(db: Session, job_id: int) -> tuple[CrawlJob, DataSource]:
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    if not job:
        raise JobNotFound()
    source = db.query(DataSource).filter(DataSource.id == job.source_id).first()
    if not source:
        raise JobNotFound()
    return job, source


def _apply_retention(db: Session, source: DataSource) -> None:
    retention = _json_loads(source.retention_config_json, {})
    max_docs = retention.get("max_documents_per_source")
    delete_older_days = retention.get("delete_older_than_days")

    if delete_older_days:
        cutoff = now_utc()
        cutoff = cutoff.replace(tzinfo=None) if cutoff.tzinfo else cutoff
        cutoff = cutoff - timedelta(days=int(delete_older_days))
        db.execute(
            delete(Document).where(
                Document.source_id == source.id,
                Document.last_seen_at < cutoff,
            )
        )

    if max_docs:
        keep = int(max_docs)
        ids = (
            db.query(Document.id)
            .filter(Document.source_id == source.id)
            .order_by(desc(Document.last_seen_at))
            .offset(keep)
            .all()
        )
        if ids:
            db.execute(delete(Document).where(Document.id.in_([r[0] for r in ids])))


async def _iterate_documents(source: DataSource, job: CrawlJob) -> AsyncIterator[Any]:
    crawl_cfg = _json_loads(source.crawl_config_json, {})
    override = _json_loads(job.strategy_override_json, {})
    if source.kind == "api":
        async for item in crawl_api(source.base_url, crawl_cfg, override):
            yield item
    else:
        async for item in crawl_website(source.base_url, crawl_cfg, override):
            yield item


async def run_job(job_id: int) -> None:
    db = SessionLocal()
    try:
        job, source = _load_job_and_source(db, job_id)
        if job.status in ("cancelled", "failed", "succeeded"):
            return

        if not job.consent_received:
            job.status = "failed"
            job.message = "Consent gerekli"
            job.finished_at = now_utc()
            db.commit()
            await job_bus.publish(job_id, JobEvent(type="error", payload={"message": job.message}))
            return

        job.status = "running"
        job.started_at = now_utc()
        job.message = None
        source.last_crawl_started_at = job.started_at
        source.last_crawl_status = "running"
        db.commit()
        await job_bus.publish(job_id, JobEvent(type="status", payload={"status": "running"}))

        transform_cfg = _json_loads(source.transform_config_json, {})
        classify_cfg = _json_loads(source.classify_config_json, {})

        redact = bool(transform_cfg.get("redact_pii", True))
        min_quality = transform_cfg.get("min_quality_score")

        batch = 0
        async for fetched in _iterate_documents(source, job):
            job.discovered_count += 1
            content_text = fetched.content_text or ""
            title = fetched.title

            if redact:
                content_text, changed = redact_pii(content_text)
                pii_redacted = changed
            else:
                pii_redacted = False

            lang = detect_language_heuristic(content_text)
            category, tags = classify(" ".join([title or "", content_text])[:8000], classify_cfg)
            q_score, q_flags = quality_score(title, content_text)

            if min_quality is not None and q_score < float(min_quality):
                job.skipped_count += 1
                if job.discovered_count % 25 == 0:
                    db.commit()
                continue

            h = url_hash(fetched.url)
            existing = (
                db.query(Document)
                .filter(
                    Document.owner_user_id == job.owner_user_id,
                    Document.source_id == source.id,
                    Document.url_hash == h,
                )
                .first()
            )

            if existing:
                existing.last_seen_at = now_utc()
                existing.title = title or existing.title
                existing.content_text = content_text
                existing.extracted_json = _json_dumps(fetched.extracted or {})
                existing.language = lang
                existing.category = category
                existing.tags_json = _json_dumps(tags)
                existing.quality_score = q_score
                existing.quality_flags_json = _json_dumps(q_flags)
                existing.pii_redacted = existing.pii_redacted or pii_redacted
                job.stored_count += 1
            else:
                doc = Document(
                    owner_user_id=job.owner_user_id,
                    source_id=source.id,
                    job_id=job.id,
                    url=fetched.url,
                    url_hash=h,
                    canonical_url=None,
                    title=title,
                    content_text=content_text,
                    raw_text=fetched.raw_text,
                    extracted_json=_json_dumps(fetched.extracted or {}),
                    language=lang,
                    category=category,
                    tags_json=_json_dumps(tags),
                    quality_score=q_score,
                    quality_flags_json=_json_dumps(q_flags),
                    pii_redacted=pii_redacted,
                )
                db.add(doc)
                job.stored_count += 1

            job.fetched_count += 1
            batch += 1
            if batch >= 25:
                batch = 0
                db.commit()
                await job_bus.publish(
                    job_id,
                    JobEvent(
                        type="progress",
                        payload={
                            "discovered": job.discovered_count,
                            "fetched": job.fetched_count,
                            "stored": job.stored_count,
                            "skipped": job.skipped_count,
                            "failed": job.failed_count,
                        },
                    ),
                )

        _apply_retention(db, source)
        job.status = "succeeded"
        job.finished_at = now_utc()
        source.last_crawl_finished_at = job.finished_at
        source.last_crawl_status = "succeeded"
        db.commit()
        await job_bus.publish(job_id, JobEvent(type="status", payload={"status": "succeeded"}))
        await job_bus.publish(
            job_id,
            JobEvent(
                type="summary",
                payload={
                    "discovered": job.discovered_count,
                    "fetched": job.fetched_count,
                    "stored": job.stored_count,
                    "skipped": job.skipped_count,
                    "failed": job.failed_count,
                },
            ),
        )
    except asyncio.CancelledError:
        try:
            job, source = _load_job_and_source(db, job_id)
            job.status = "cancelled"
            job.message = "İş iptal edildi"
            job.finished_at = now_utc()
            source.last_crawl_finished_at = job.finished_at
            source.last_crawl_status = "cancelled"
            db.commit()
        except Exception:
            pass
        raise
    except Exception as e:
        try:
            job, source = _load_job_and_source(db, job_id)
            job.status = "failed"
            job.message = str(e)[:500]
            job.finished_at = now_utc()
            source.last_crawl_finished_at = job.finished_at
            source.last_crawl_status = "failed"
            db.commit()
            await job_bus.publish(job_id, JobEvent(type="error", payload={"message": job.message}))
        except Exception:
            pass
    finally:
        db.close()
        _job_tasks.pop(job_id, None)


def start_job(job_id: int) -> bool:
    if job_id in _job_tasks and not _job_tasks[job_id].done():
        return False
    task = asyncio.create_task(run_job(job_id))
    _job_tasks[job_id] = task
    return True


def cancel_job(job_id: int) -> bool:
    t = _job_tasks.get(job_id)
    if not t:
        return False
    t.cancel()
    return True
