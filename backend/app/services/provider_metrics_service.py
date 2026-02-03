import datetime as dt
from typing import Any, Dict, List, Optional

from sqlalchemy import and_, func

from app.db.database import SessionLocal
from app.models.provider_metrics import ProviderDailyMetric


def _today_str() -> str:
    return dt.datetime.utcnow().strftime("%Y-%m-%d")


class ProviderMetricsService:
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
        day = _today_str()
        latency_ms = max(0, int(latency_ms))
        match_count = max(0, int(match_count))

        try:
            with SessionLocal() as db:
                row = (
                    db.query(ProviderDailyMetric)
                    .filter(and_(ProviderDailyMetric.day == day, ProviderDailyMetric.provider == provider))
                    .first()
                )
                if row is None:
                    row = ProviderDailyMetric(day=day, provider=provider)
                    db.add(row)

                row.attempts = int(row.attempts) + 1
                row.successes = int(row.successes) + (1 if success else 0)
                row.total_latency_ms = int(row.total_latency_ms) + latency_ms
                row.total_matches = int(row.total_matches) + match_count

                if reverse_image_used:
                    row.reverse_image_attempts = int(row.reverse_image_attempts) + 1
                    row.reverse_image_successes = int(row.reverse_image_successes) + (1 if reverse_image_success else 0)

                db.commit()
        except Exception:
            return

    def get_window_summary(self, *, days: int = 7) -> Dict[str, Any]:
        days = max(1, int(days))
        start = (dt.datetime.utcnow() - dt.timedelta(days=days - 1)).strftime("%Y-%m-%d")

        with SessionLocal() as db:
            rows = (
                db.query(
                    ProviderDailyMetric.provider.label("provider"),
                    func.sum(ProviderDailyMetric.attempts).label("attempts"),
                    func.sum(ProviderDailyMetric.successes).label("successes"),
                    func.sum(ProviderDailyMetric.total_latency_ms).label("total_latency_ms"),
                    func.sum(ProviderDailyMetric.total_matches).label("total_matches"),
                    func.sum(ProviderDailyMetric.reverse_image_attempts).label("reverse_image_attempts"),
                    func.sum(ProviderDailyMetric.reverse_image_successes).label("reverse_image_successes"),
                )
                .filter(ProviderDailyMetric.day >= start)
                .group_by(ProviderDailyMetric.provider)
                .all()
            )

        providers: List[Dict[str, Any]] = []
        for r in rows:
            attempts = int(r.attempts or 0)
            successes = int(r.successes or 0)
            total_latency_ms = int(r.total_latency_ms or 0)
            total_matches = int(r.total_matches or 0)
            ria = int(r.reverse_image_attempts or 0)
            ris = int(r.reverse_image_successes or 0)

            success_rate = (successes / attempts) if attempts > 0 else 0.0
            avg_latency_ms = (total_latency_ms / attempts) if attempts > 0 else 0.0
            avg_matches = (total_matches / attempts) if attempts > 0 else 0.0
            reverse_image_success_rate = (ris / ria) if ria > 0 else None

            coverage_proxy = float(max(0.0, min(1.0, success_rate * min(1.0, avg_matches / 5.0))))
            latency_score = float(max(0.0, min(1.0, 1.0 - (avg_latency_ms / 2000.0))))
            match_score = float(max(0.0, min(1.0, avg_matches / 10.0)))
            quality_score_0_100 = float(
                max(0.0, min(100.0, 100.0 * (0.55 * success_rate + 0.25 * coverage_proxy + 0.10 * match_score + 0.10 * latency_score)))
            )

            providers.append(
                {
                    "provider": str(r.provider),
                    "attempts": attempts,
                    "success_rate": float(success_rate),
                    "avg_latency_ms": float(avg_latency_ms),
                    "avg_matches": float(avg_matches),
                    "coverage_proxy": float(coverage_proxy),
                    "quality_score_0_100": float(quality_score_0_100),
                    "reverse_image_success_rate": reverse_image_success_rate,
                }
            )

        providers.sort(key=lambda x: x["quality_score_0_100"], reverse=True)
        return {"window_days": days, "providers": providers}


provider_metrics_service = ProviderMetricsService()
