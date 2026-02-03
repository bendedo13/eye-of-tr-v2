from __future__ import annotations

import base64
from typing import Optional, Tuple

import cv2
import numpy as np


def compute_orb_descriptors(image_bytes: bytes, *, nfeatures: int = 600) -> Optional[np.ndarray]:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    orb = cv2.ORB_create(nfeatures=int(nfeatures))
    _kps, desc = orb.detectAndCompute(gray, None)
    if desc is None or not isinstance(desc, np.ndarray) or desc.size == 0:
        return None
    return desc.astype(np.uint8)


def orb_similarity_0_1(query_desc: Optional[np.ndarray], entry_desc: Optional[np.ndarray]) -> float:
    if query_desc is None or entry_desc is None:
        return 0.0
    if query_desc.size == 0 or entry_desc.size == 0:
        return 0.0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(query_desc, entry_desc)
    if not matches:
        return 0.0
    matches = sorted(matches, key=lambda m: m.distance)
    good = [m for m in matches if m.distance <= 50]
    denom = float(max(1, min(len(query_desc), len(entry_desc))))
    return float(max(0.0, min(1.0, len(good) / denom)))


def encode_desc_b64(desc: Optional[np.ndarray]) -> Optional[str]:
    if desc is None:
        return None
    raw = desc.tobytes()
    return base64.b64encode(raw).decode("ascii")


def decode_desc_b64(b64: Optional[str], *, rows: int) -> Optional[np.ndarray]:
    if not b64:
        return None
    raw = base64.b64decode(b64.encode("ascii"))
    arr = np.frombuffer(raw, dtype=np.uint8)
    if arr.size % 32 != 0:
        return None
    r = int(arr.size // 32)
    if rows and r != rows:
        pass
    return arr.reshape((r, 32))

