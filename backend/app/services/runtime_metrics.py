import time
import threading
from dataclasses import dataclass
from typing import Any, Dict


@dataclass
class ProviderRolling:
    attempts: int = 0
    successes: int = 0
    total_latency_ms: int = 0
    total_matches: int = 0
    reverse_image_attempts: int = 0
    reverse_image_successes: int = 0
    last_updated: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        attempts = int(self.attempts)
        successes = int(self.successes)
        ria = int(self.reverse_image_attempts)
        ris = int(self.reverse_image_successes)
        return {
            "attempts": attempts,
            "success_rate": float(successes / attempts) if attempts else 0.0,
            "avg_latency_ms": float(self.total_latency_ms / attempts) if attempts else 0.0,
            "avg_matches": float(self.total_matches / attempts) if attempts else 0.0,
            "reverse_image_success_rate": float(ris / ria) if ria else None,
            "last_updated_ts": self.last_updated,
        }


class RuntimeMetrics:
    def __init__(self):
        self._lock = threading.Lock()
        self._providers: Dict[str, ProviderRolling] = {}

    def record(
        self,
        *,
        provider: str,
        success: bool,
        latency_ms: int,
        match_count: int,
        reverse_image_used: bool,
        reverse_image_success: bool,
    ) -> None:
        provider = str(provider)
        latency_ms = max(0, int(latency_ms))
        match_count = max(0, int(match_count))
        with self._lock:
            r = self._providers.get(provider) or ProviderRolling()
            r.attempts += 1
            r.successes += 1 if success else 0
            r.total_latency_ms += latency_ms
            r.total_matches += match_count
            if reverse_image_used:
                r.reverse_image_attempts += 1
                r.reverse_image_successes += 1 if reverse_image_success else 0
            r.last_updated = time.time()
            self._providers[provider] = r

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {k: v.to_dict() for k, v in self._providers.items()}


runtime_metrics = RuntimeMetrics()
