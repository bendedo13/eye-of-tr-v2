from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np
from PIL import Image


@dataclass(frozen=True)
class PHash:
    value: int


def compute_phash(image_bytes: bytes, *, hash_size: int = 8, highfreq_factor: int = 4) -> PHash:
    img = Image.open(io_bytes(image_bytes)).convert("L")
    size = hash_size * highfreq_factor
    img = img.resize((size, size), Image.Resampling.LANCZOS)
    pixels = np.asarray(img, dtype=np.float32)
    dct = _dct_2d(pixels)
    dct_lowfreq = dct[:hash_size, :hash_size]
    med = np.median(dct_lowfreq[1:, 1:])
    diff = dct_lowfreq > med
    v = 0
    for bit in diff.flatten().tolist():
        v = (v << 1) | (1 if bit else 0)
    return PHash(int(v))


def compute_ahash(image_bytes: bytes, *, hash_size: int = 8) -> PHash:
    img = Image.open(io_bytes(image_bytes)).convert("L")
    img = img.resize((hash_size, hash_size), Image.Resampling.LANCZOS)
    pixels = np.asarray(img, dtype=np.float32)
    avg = float(np.mean(pixels))
    diff = pixels > avg
    v = 0
    for bit in diff.flatten().tolist():
        v = (v << 1) | (1 if bit else 0)
    return PHash(int(v))


def compute_dhash(image_bytes: bytes, *, hash_size: int = 8) -> PHash:
    img = Image.open(io_bytes(image_bytes)).convert("L")
    img = img.resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = np.asarray(img, dtype=np.float32)
    diff = pixels[:, 1:] > pixels[:, :-1]
    v = 0
    for bit in diff.flatten().tolist():
        v = (v << 1) | (1 if bit else 0)
    return PHash(int(v))


def hamming_distance(a: PHash, b: PHash) -> int:
    x = int(a.value) ^ int(b.value)
    return int(x.bit_count())


def similarity_percent_from_hamming(dist: int, *, bits: int = 64) -> float:
    dist = max(0, min(bits, int(dist)))
    return float(max(0.0, min(100.0, 100.0 * (1.0 - (dist / float(bits))))))


def io_bytes(b: bytes):
    import io

    return io.BytesIO(b)


def _dct_1d(x: np.ndarray) -> np.ndarray:
    n = x.shape[0]
    out = np.zeros_like(x, dtype=np.float32)
    factor = math.pi / float(n)
    for k in range(n):
        s = 0.0
        for i in range(n):
            s += float(x[i]) * math.cos((i + 0.5) * k * factor)
        c = math.sqrt(1.0 / n) if k == 0 else math.sqrt(2.0 / n)
        out[k] = float(c * s)
    return out


def _dct_2d(a: np.ndarray) -> np.ndarray:
    tmp = np.apply_along_axis(_dct_1d, 1, a)
    return np.apply_along_axis(_dct_1d, 0, tmp)
