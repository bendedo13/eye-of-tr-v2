import os

async def search(image_bytes: bytes):
    api_key = os.getenv("FACECHECK_API_KEY")

    if not api_key:
        return {
            "provider": "facecheck",
            "error": "API key not configured",
            "matches": []
        }

    return {
        "provider": "facecheck",
        "matches": []
    }
