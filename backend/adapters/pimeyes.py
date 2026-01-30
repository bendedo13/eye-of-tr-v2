import os

async def search(image_bytes: bytes):
    api_key = os.getenv("PIMEYES_API_KEY")

    if not api_key:
        return {
            "provider": "pimeyes",
            "error": "API key not configured",
            "matches": []
        }

    # İleride gerçek API çağrısı buraya gelecek
    return {
        "provider": "pimeyes",
        "matches": []
    }

