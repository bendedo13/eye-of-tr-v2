from adapters.eyeofweb_adapter import search as eyeofweb_search
from adapters.pimeyes import search as pimeyes_search
from adapters.facecheck import search as facecheck_search

async def run_search(image_bytes: bytes):
    results = []

    results.append(await eyeofweb_search(image_bytes))
    results.append(await pimeyes_search(image_bytes))
    results.append(await facecheck_search(image_bytes))

    return results
