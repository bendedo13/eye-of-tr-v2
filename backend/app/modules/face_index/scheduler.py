"""Scheduler for recurring crawl jobs using APScheduler."""
import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.modules.face_index.models import FaceSource, FaceCrawlJob
from app.modules.face_index.worker import enqueue_job

logger = logging.getLogger(__name__)

_scheduler = None


def get_scheduler():
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        _scheduler = AsyncIOScheduler()
        return _scheduler
    except ImportError:
        logger.warning("APScheduler not installed, scheduled crawls disabled")
        return None


def schedule_source(source_id: int, cron_expr: str):
    """Add a scheduled crawl for a source. cron_expr format: 'minute hour day month day_of_week'."""
    scheduler = get_scheduler()
    if not scheduler:
        return

    job_id = f"fi_crawl_{source_id}"

    # Remove existing job if any
    existing = scheduler.get_job(job_id)
    if existing:
        scheduler.remove_job(job_id)

    parts = cron_expr.strip().split()
    if len(parts) != 5:
        logger.error(f"Invalid cron expression: {cron_expr}")
        return

    minute, hour, day, month, day_of_week = parts

    async def _trigger():
        db = SessionLocal()
        try:
            source = db.query(FaceSource).filter(FaceSource.id == source_id, FaceSource.is_enabled == True).first()
            if not source:
                return

            # Check if last job failed and retry count
            last_job = db.query(FaceCrawlJob).filter(
                FaceCrawlJob.source_id == source_id
            ).order_by(FaceCrawlJob.created_at.desc()).first()

            if last_job and last_job.status == "running":
                logger.info(f"Source {source_id} already has a running job, skipping")
                return

            job = FaceCrawlJob(source_id=source.id, status="queued")
            db.add(job)
            db.commit()
            db.refresh(job)
            await enqueue_job(job.id)
            logger.info(f"Scheduled crawl triggered for source {source_id}, job {job.id}")
        finally:
            db.close()

    scheduler.add_job(
        _trigger,
        "cron",
        id=job_id,
        minute=minute,
        hour=hour,
        day=day,
        month=month,
        day_of_week=day_of_week,
        replace_existing=True,
    )
    logger.info(f"Scheduled source {source_id} with cron '{cron_expr}'")


def unschedule_source(source_id: int):
    scheduler = get_scheduler()
    if not scheduler:
        return
    job_id = f"fi_crawl_{source_id}"
    existing = scheduler.get_job(job_id)
    if existing:
        scheduler.remove_job(job_id)
        logger.info(f"Unscheduled source {source_id}")


def load_all_schedules():
    """Load all enabled schedules from DB. Call on startup."""
    db = SessionLocal()
    try:
        sources = db.query(FaceSource).filter(
            FaceSource.schedule_enabled == True,
            FaceSource.schedule_cron.isnot(None),
        ).all()
        for src in sources:
            schedule_source(src.id, src.schedule_cron)
        logger.info(f"Loaded {len(sources)} scheduled crawl sources")
    finally:
        db.close()


def start_scheduler():
    scheduler = get_scheduler()
    if scheduler and not scheduler.running:
        load_all_schedules()
        scheduler.start()
        logger.info("Face Index scheduler started")


def stop_scheduler():
    scheduler = get_scheduler()
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Face Index scheduler stopped")
