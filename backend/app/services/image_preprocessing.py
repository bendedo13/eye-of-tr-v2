from __future__ import annotations

import logging
from io import BytesIO
from typing import Tuple

import numpy as np
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)


def preprocess_image_bytes(image_bytes: bytes, *, size: int = 512) -> Tuple[bytes, int, int]:
    im = Image.open(BytesIO(image_bytes))
    im = ImageOps.exif_transpose(im)
    im = im.convert("RGB")
    im = ImageOps.fit(im, (size, size), method=Image.Resampling.LANCZOS)

    out = BytesIO()
    im.save(out, format="JPEG", quality=92, optimize=True)
    data = out.getvalue()
    return data, size, size


def to_grayscale_array(image_bytes: bytes, *, size: int) -> np.ndarray:
    im = Image.open(BytesIO(image_bytes))
    im = ImageOps.exif_transpose(im)
    im = im.convert("L")
    im = ImageOps.fit(im, (size, size), method=Image.Resampling.LANCZOS)
    arr = np.asarray(im, dtype=np.float32)
    return arr
