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


async def process_job(job_id: int):
    from app.modules.face_index.crawler import run_crawl_job
    db = SessionLocal()
    try:
        await run_crawl_job(job_id, db)
    except Exception as e:
        logger.error(f"Job {job_id} error: {e}", exc_info=True)
    finally:
        db.close()


async def worker_loop():
    """Main worker loop: listen to Redis queue and process jobs."""
    import redis.asyncio as aioredis

    redis_url = settings.REDIS_URL
    if not redis_url:
        logger.error("REDIS_URL not configured. Worker cannot start without Redis.")
        return

    logger.info(f"Face Index Worker starting, listening on {QUEUE_KEY}")
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

    while True:
        try:
            msg = await r.blpop(QUEUE_KEY, timeout=5)
            if msg is None:
                continue
            _, payload_str = msg
            payload = json.loads(payload_str)
            job_id = payload.get("job_id")
            if job_id:
                logger.info(f"Processing job {job_id}")
                await process_job(int(job_id))
                logger.info(f"Job {job_id} done")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Worker loop error: {e}", exc_info=True)
            await asyncio.sleep(2)

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
