from __future__ import annotations

import re
from typing import Any


EMAIL_RE = re.compile(r"([a-zA-Z0-9_.+-])([a-zA-Z0-9_.+-]*)(@)([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)")
PHONE_RE = re.compile(r"(\+?\d[\d\-\s().]{6,}\d)")


def mask_email(s: str) -> str:
    def repl(m: re.Match) -> str:
        first = m.group(1)
        domain = m.group(4)
        return f"{first}***@{domain}"

    return EMAIL_RE.sub(repl, s)


def mask_phone(s: str) -> str:
    def repl(m: re.Match) -> str:
        raw = m.group(1)
        digits = re.sub(r"\D", "", raw)
        if len(digits) <= 4:
            return "***"
        return f"{digits[:2]}***{digits[-2:]}"

    return PHONE_RE.sub(repl, s)


def mask_pii(value: Any) -> Any:
    if isinstance(value, str):
        v = mask_email(value)
        v = mask_phone(v)
        return v
    if isinstance(value, list):
        return [mask_pii(x) for x in value]
    if isinstance(value, dict):
        return {k: mask_pii(v) for k, v in value.items()}
    return value

