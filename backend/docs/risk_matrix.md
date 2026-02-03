## Risk Matrisi (Özet)

### R1 — “Tüm internet indeksli görseller” kapsamı
- Etki: Yüksek
- Olasılık: Yüksek
- Azaltım:
  - Provider kapsama/kalite metrikleri (coverage_proxy, quality_score)
  - Fallback stratejisi + cache
  - Kullanıcıya şeffaf limitation bildirimi (legal disclaimer + rapor alanları)

### R2 — Bing/Yandex reverse-image sınırlılığı
- Etki: Orta-Yüksek
- Olasılık: Yüksek
- Azaltım:
  - Bing Visual Search (reverse-image) ayrı provider olarak
  - Yandex reverse-image deneysel/feature-flag ile (varsayılan kapalı)
  - Reverse-image success-rate metrikleri + threshold bazlı alert

### R3 — Konum çıkarımı deterministik bağımlılığı
- Etki: Orta
- Olasılık: Orta
- Azaltım:
  - EXIF → meta-tag/JSON‑LD → GeoNames (opsiyonel) zinciri
  - A/B (canary) ile kontrollü rollout
  - Raporda “konum kaynakları” listesi

### R4 — Performans/latency hedefleri
- Etki: Yüksek
- Olasılık: Orta
- Azaltım:
  - Web sayfa fetch/parse yalnızca flag/canary ile
  - Düşük timeout ve sınırlı URL sayısı
  - Cache ile tekrar istek azaltma

