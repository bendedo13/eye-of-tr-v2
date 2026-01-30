import subprocess
import uuid
from pathlib import Path

EYE_OF_WEB_PATH = Path(r"C:/Users/Asus/Desktop/eye_of_web/src")

async def search(image_bytes: bytes):
    tmp_dir = Path("tmp")
    tmp_dir.mkdir(exist_ok=True)

    image_path = tmp_dir / f"{uuid.uuid4()}.jpg"

    with open(image_path, "wb") as f:
        f.write(image_bytes)

    try:
        process = subprocess.run(
            [
                "python",
                "run.py",
                "--image",
                str(image_path),
                "--json"
            ],
            cwd=EYE_OF_WEB_PATH,
            capture_output=True,
            text=True,
            timeout=180
        )

        if process.returncode != 0:
            return {
                "provider": "eyeofweb",
                "error": process.stderr,
                "matches": []
            }

        return {
            "provider": "eyeofweb",
            "matches": process.stdout
        }

    finally:
        if image_path.exists():
            image_path.unlink()
