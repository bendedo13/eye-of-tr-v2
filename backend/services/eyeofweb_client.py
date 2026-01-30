import requests
from core.config import EYE_OF_WEB_API_KEY, EYE_OF_WEB_ENDPOINT

def search_face(image_bytes: bytes):
    headers = {
        "Authorization": f"Bearer {EYE_OF_WEB_API_KEY}"
    }

    files = {
        "file": ("image.jpg", image_bytes, "image/jpeg")
    }

    response = requests.post(
        EYE_OF_WEB_ENDPOINT,
        headers=headers,
        files=files,
        timeout=30
    )

    response.raise_for_status()
    return response.json()
