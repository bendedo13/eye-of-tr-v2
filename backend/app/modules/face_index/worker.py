"""Face Index Worker - Redis queue consumer that processes crawl jobs.

Run as a separate process:
    python -m app.modules.face_index.worker
"""
import asyncio
import json
import logging
import sys
import os
from pathlib import Path

# Add backend dir to path for imports
backend_dir = str(Path(__file__).resolve().parents[3])
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.core.config import settings
from app.db.database import SessionLocal, get_engine, Base

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, "INFO"),
    format="%(asctime)s [WORKER] %(name)s %(levelname)s %(message)s",
)
logger = logging.getLogger("face_index.worker")

QUEUE_KEY = "fi:job_queue"
CONCURRENT_WORKERS = 10  # Max parallel jobs
MAX_RETRIES = 3  # Auto-retry failed jobs


async def process_job(job_id: int):
    from app.modules.face_index.crawler import run_crawl_job
    db = SessionLocal()
    try:
        await run_crawl_job(job_id, db)
    except Exception as e:
        logger.error(f"Job {job_id} error: {e}", exc_info=True)
    finally:
        db.close()


async def _auto_retry_failed(job_id: int):
    """Re-enqueue a failed job if retry count allows."""
    from app.modules.face_index.models import FaceCrawlJob
    db = SessionLocal()
    try:
        job = db.query(FaceCrawlJob).filter(FaceCrawlJob.id == job_id).first()
        if not job or job.status != "failed":
            return

        fail_count = db.query(FaceCrawlJob).filter(
            FaceCrawlJob.source_id == job.source_id,
            FaceCrawlJob.status == "failed",
        ).count()

        if fail_count <= MAX_RETRIES:
            new_job = FaceCrawlJob(source_id=job.source_id, status="queued",
                                   message=f"auto-retry #{fail_count}")
            db.add(new_job)
            db.commit()
            db.refresh(new_job)
            await enqueue_job(new_job.id)
            logger.info(f"Auto-retry: job {new_job.id} for source {job.source_id} (attempt {fail_count})")
    finally:
        db.close()


async def worker_loop():
    """Main worker loop: listen to Redis queue and process jobs concurrently."""
    import redis.asyncio as aioredis

    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.error("REDIS_URL not configured. Worker cannot start without Redis.")
        return

    logger.info(f"Face Index Worker starting, {CONCURRENT_WORKERS} concurrent, listening on {QUEUE_KEY}")
    r = aioredis.from_url(redis_url, decode_responses=True)

    try:
        await r.ping()
        logger.info("Connected to Redis")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return

    # Ensure DB tables exist
    from app.modules.face_index.models import FaceSource, FaceCrawlJob, FaceImage, IndexedFace
    Base.metadata.create_all(bind=get_engine())

    semaphore = asyncio.Semaphore(CONCURRENT_WORKERS)
    active_tasks: set = set()

    async def _run_with_semaphore(jid: int):
        async with semaphore:
            logger.info(f"Processing job {jid}")
            await process_job(jid)
            logger.info(f"Job {jid} done")
            await _auto_retry_failed(jid)

    while True:
        try:
            msg = await r.blpop(QUEUE_KEY, timeout=5)
            if msg is None:
                active_tasks = {t for t in active_tasks if not t.done()}
                continue
            _, payload_str = msg
            payload = json.loads(payload_str)
            job_id = payload.get("job_id")
            if job_id:
                task = asyncio.create_task(_run_with_semaphore(int(job_id)))
                active_tasks.add(task)
                active_tasks = {t for t in active_tasks if not t.done()}
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker loop error: {e}", exc_info=True)
            await asyncio.sleep(2)

    if active_tasks:
        await asyncio.gather(*active_tasks, return_exceptions=True)

    await r.aclose()
    logger.info("Worker stopped")


async def enqueue_job(job_id: int):
    """Push a job to the Redis queue."""
    import redis.asyncio as aioredis

    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.warning("REDIS_URL not set, running job inline")
        await process_job(job_id)
        return

    r = aioredis.from_url(redis_url, decode_responses=True)
    try:
        await r.rpush(QUEUE_KEY, json.dumps({"job_id": job_id}))
        logger.info(f"Enqueued job {job_id}")
    finally:
        await r.aclose()


def main():
    logger.info("=" * 50)
    logger.info("FACESEEK FACE INDEX WORKER")
    logger.info("=" * 50)
    try:
        asyncio.run(worker_loop())
    except KeyboardInterrupt:
        logger.info("Worker interrupted")


if __name__ == "__main__":
    main()
