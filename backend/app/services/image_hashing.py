from __future__ import annotations

import hashlib
from dataclasses import dataclass

import cv2
import numpy as np

from app.services.image_preprocessing import to_grayscale_array


def _bits_to_hex(bits: np.ndarray) -> str:
    flat = bits.astype(np.uint8).flatten().tolist()
    out = 0
    for b in flat:
        out = (out << 1) | int(b)
    width = int(np.ceil(len(flat) / 4))
    return f"{out:0{width}x}"


def _hex_to_int(h: str) -> int:
    return int(h, 16) if h else 0


def hamming_distance_hex(a: str, b: str) -> int:
    x = _hex_to_int(a) ^ _hex_to_int(b)
    return x.bit_count()


def similarity_from_hamming(distance: int, bit_count: int) -> float:
    if bit_count <= 0:
        return 0.0
    return max(0.0, min(1.0, 1.0 - (float(distance) / float(bit_count))))


@dataclass(frozen=True)
class DualHash:
    ahash: str
    phash: str


def compute_ahash(image_bytes: bytes, *, hash_size: int = 8) -> str:
    arr = to_grayscale_array(image_bytes, size=hash_size)
    avg = float(arr.mean())
    bits = (arr > avg).astype(np.uint8)
    return _bits_to_hex(bits)


def compute_phash(image_bytes: bytes, *, img_size: int = 32, hash_size: int = 8) -> str:
    arr = to_grayscale_array(image_bytes, size=img_size)
    dct = cv2.dct(arr)
    low = dct[:hash_size, :hash_size]
    med = float(np.median(low[1:, 1:]))
    bits = (low > med).astype(np.uint8)
    return _bits_to_hex(bits)


def compute_dual_hash(image_bytes: bytes) -> DualHash:
    return DualHash(ahash=compute_ahash(image_bytes), phash=compute_phash(image_bytes))


def stable_image_id(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()

