"""Veritabanı bağlantısı ve session."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

_engine = None
_engine_url = None
_sessionmaker = None
_session_url = None


def _build_engine(url: str):
    connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
    return create_engine(
        url,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3000,
    )


def get_engine():
    """Get or recreate engine when DATABASE_URL changes."""
    global _engine, _engine_url
    url = settings.DATABASE_URL
    if _engine is None or _engine_url != url:
        _engine = _build_engine(url)
        _engine_url = url
    return _engine


def _get_sessionmaker():
    global _sessionmaker, _session_url
    url = settings.DATABASE_URL
    if _sessionmaker is None or _session_url != url:
        _sessionmaker = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
        _session_url = url
    return _sessionmaker


def SessionLocal():
    return _get_sessionmaker()()


Base = declarative_base()


def get_db():
    """Dependency: her istek için DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
