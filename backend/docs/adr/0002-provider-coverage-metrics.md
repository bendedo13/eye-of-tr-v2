## ADR-0002: Provider Coverage, Quality Metrics, Fallback ve Caching

### Durum
Kabul edildi.

### Problem
“Tüm internet indeksli görseller” kapsamı garanti edilemez. Sağlayıcıların kapsama/başarı oranları değişkendir ve arıza/limit durumunda kullanıcı deneyimi ve güvenilirlik düşer. Tek sağlayıcıya bağımlılık sistem riskini artırır.

### Karar
- Sağlayıcı bazlı günlük metrikler DB’ye yazılır (attempts/successes/latency/match count, reverse-image success).
- Runtime (in-memory) metrikler live dashboard’a yansıtılır.
- Fallback stratejisi eklenir: Min sonuç eşiği sağlanana kadar sıradaki sağlayıcı denenir.
- Hash tabanlı sonuç önbelleği eklenir: aynı görsel tekrar yüklendiğinde provider çağrıları azaltılır.

### Uygulama
- DB metrik modeli: `ProviderDailyMetric`
- Metrik servisi: `ProviderMetricsService`
- Runtime metrikler: `runtime_metrics`
- Fallback/caching: `SearchService.waterfall_search(strategy="fallback")`
- Live dashboard: `/api/dashboard/live-stats` ekstra alanlar

### Sonuçlar
- Kapsama garanti edilemez; bunun yerine “coverage_proxy” ve “quality_score” ile şeffaf metrik sunulur.
- Fallback, tek sağlayıcı hatalarında sistem başarısını artırır.
- Caching, aynı görselin tekrar upload edilmesini azaltır (latency ve maliyet düşer).

