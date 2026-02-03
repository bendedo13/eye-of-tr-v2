import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings


def _timestamp() -> str:
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S")


def _backup_sqlite(url: str, out_dir: Path) -> Path:
    parsed = urlparse(url)
    db_path = (parsed.path or "").lstrip("/")
    if not db_path:
        raise RuntimeError("SQLite path bulunamadı")
    if db_path.startswith("./") or db_path.startswith(".\\"):
        db_path = db_path[2:]
    src = Path(__file__).resolve().parents[1] / db_path
    if not src.exists():
        src = Path(db_path)
    if not src.exists():
        raise RuntimeError(f"DB dosyası bulunamadı: {src}")
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"sqlite_backup_{_timestamp()}.db"
    shutil.copy2(src, dst)
    return dst


def _backup_postgres(url: str, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    dst = out_dir / f"pg_backup_{_timestamp()}.dump"
    cmd = ["pg_dump", url, "-Fc", "-f", str(dst)]
    subprocess.run(cmd, check=True)
    return dst


def main() -> None:
    url = settings.DATABASE_URL
    out_dir = Path(os.environ.get("BACKUP_DIR") or (Path(__file__).resolve().parents[1] / "backups"))
    if url.startswith("sqlite"):
        dst = _backup_sqlite(url, out_dir)
        print(str(dst))
        return
    if url.startswith("postgres"):
        dst = _backup_postgres(url, out_dir)
        print(str(dst))
        return
    raise RuntimeError(f"Desteklenmeyen DB: {url}")


if __name__ == "__main__":
    main()

