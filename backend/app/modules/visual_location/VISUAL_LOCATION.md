## FaceSeek – Görsel Benzerlik & Konum (Visual Similarity + Location)

Bu modül, kullanıcının yüklediği görseli:
- internet sağlayıcıları (mevcut `SearchService` üzerinden) ile eşleştirir,
- yerel bir indeks (pHash/aHash/dHash + ORB descriptor) ile matematiksel benzerlik skoru üretir,
- EXIF GPS varsa koordinat çıkarır,
- tüm süreci zorunlu kullanıcı onayı + kredi tüketimi + rate limit + spam kontrol ile korur.

### Amaç ve Sınırlar
- “İnternetteki tüm indeksli görseller” pratikte tek bir kaynaktan garanti edilemez; bu modül provider bazlı çalışır.
- Sonuçlar tahmindir, kesinlik içermez; zorunlu ibare API cevabına dahildir.
- Kullanıcı yüklemeleri kalıcı olarak saklanmaz. Provider araması için geçici bir dosya oluşturulup işlem sonunda silinir.

### Backend Endpoint
- `POST /api/visual-location/analyze`
  - `multipart/form-data`: `file`, `consent`, `device_id`
  - JWT zorunlu
  - 1 analiz = 1 kredi (kredi yoksa 402)

### Veri Kaynakları
- Web provider’ları: `app/services/search_service.py` (Bing/Yandex/Facecheck/EyeOfWeb ayarlarına göre)
- Yerel indeks (opsiyonel): `VISUAL_LOCATION_LOCAL_INDEX_PATH` env ile JSON indeks yolu
  - İndeks, hash + ORB descriptor saklar (referans dataset için)
- Web sayfa konum çıkarımı (opsiyonel/canary):
  - `VISUAL_LOCATION_WEB_LOCATION_ENABLED=true` veya `VISUAL_LOCATION_CANARY_PERCENT>0`
  - Eşleşme sayfalarından meta-tag / JSON-LD geo verisi parse edilir; opsiyonel GeoNames geocode uygulanır (`GEONAMES_USERNAME`)

### Çıktı
- `predicted_location`: ülke/şehir + (varsa) koordinat
- `confidence_0_1`: 0–1 arası güven
- `matches`: normalize edilmiş eşleşmeler (provider, url, skorlar)
- `compliance`: consent/credit/no-store gibi kurallara uygunluk özeti
  - `trace_id`: request trace id
  - `ab_variant`: A/B canary varyantı
- `location_sources`: konum çıkarımı kaynakları (exif/meta_tag/jsonld/geonames/local_index)
