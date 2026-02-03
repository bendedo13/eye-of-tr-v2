import shutil
import subprocess
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings


def _restore_sqlite(url: str, backup_file: Path) -> None:
    parsed = urlparse(url)
    db_path = (parsed.path or "").lstrip("/")
    if not db_path:
        raise RuntimeError("SQLite path bulunamadı")
    if db_path.startswith("./") or db_path.startswith(".\\"):
        db_path = db_path[2:]
    dst = Path(__file__).resolve().parents[1] / db_path
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(backup_file, dst)


def _restore_postgres(url: str, backup_file: Path) -> None:
    cmd = ["pg_restore", "--clean", "--if-exists", "-d", url, str(backup_file)]
    subprocess.run(cmd, check=True)


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("backup_file")
    args = parser.parse_args()

    backup = Path(args.backup_file).resolve()
    if not backup.exists():
        raise SystemExit(f"Backup bulunamadı: {backup}")

    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        _restore_sqlite(url, backup)
        return
    if url.startswith("postgres"):
        _restore_postgres(url, backup)
        return
    raise RuntimeError(f"Desteklenmeyen DB: {url}")


if __name__ == "__main__":
    main()

