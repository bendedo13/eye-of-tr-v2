# FaceSeek Tam Sistem Geliştirme Planı

## 📋 KULLANICI İSTEKLERİ

1. **Dataset Geri Getirme:** +20MB indekslenmiş yüz veritabanı
2. **Sosyal Medya Crew Otomasyonu:** Günde 20,000+ yüz indirme
3. **InsightFace Embedding:** Otomatik yüz tanıma ve embedding
4. **Veritabanı Eşleştirme:** Kullanıcı search'te local DB kullanımı
5. **Admin Panel İyileştirme:** Tüm sayfalar tam çalışır
6. **Fiyatlandırma Düzeltme:** Admin'den fiyat yönetimi

## 🎯 GELİŞTİRME AŞAMALARI

### AŞAMA 1: Dataset & Face Index Sistemi (ÖNCELİK 1)
**Durum:** Sistem mevcut ama optimize edilmeli

**Yapılacaklar:**
1. ✅ FAISS index sistemi zaten var (`backend/app/modules/face_index/`)
2. ✅ InsightFace embedding zaten entegre
3. ❌ Dataset boyutunu artır (20MB+ hedef)
4. ❌ Otomatik crawl scheduler'ı aktifleştir
5. ❌ Proxy rotation sistemi ekle
6. ❌ Rate limiting optimize et

**Dosyalar:**
- `backend/app/modules/face_index/worker.py` - Worker sistemi
- `backend/app/modules/face_index/crawler.py` - Crawler
- `backend/app/modules/face_index/scheduler.py` - Scheduler
- `backend/app/modules/face_index/vector_store.py` - FAISS index
- `backend/app/services/embedding_service.py` - InsightFace

### AŞAMA 2: Sosyal Medya Crew Otomasyonu (ÖNCELİK 1)
**Durum:** Temel yapı var ama tam otomatik değil

**Yapılacaklar:**
1. ❌ Instagram scraper optimize et
2. ❌ Twitter/X scraper ekle
3. ❌ Facebook scraper ekle
4. ❌ TikTok scraper ekle
5. ❌ Günlük 20k+ yüz hedefi için scheduler
6. ❌ Concurrent worker sayısını artır (10 → 50)
7. ❌ Proxy pool yönetimi
8. ❌ Auto-retry mekanizması

**Dosyalar:**
- `backend/app/modules/face_index/social_crawlers.py` - Sosyal medya scrapers
- `backend/app/modules/face_index/worker.py` - Worker pool
- `backend/app/modules/face_index/proxy_manager.py` - Proxy yönetimi

### AŞAMA 3: Admin Panel İyileştirmeleri (ÖNCELİK 2)
**Durum:** Temel sayfalar var ama eksikler var

**Yapılacaklar:**
1. ✅ Dashboard istatistikleri çalışıyor
2. ❌ Face Index yönetim sayfası ekle
3. ❌ Crawler kontrol paneli
4. ❌ Proxy yönetim arayüzü
5. ❌ Fiyatlandırma yönetimi
6. ❌ Real-time crawler durumu
7. ❌ Dataset istatistikleri

**Dosyalar:**
- `frontend/app/[locale]/admin/face-index/page.tsx` - YENİ
- `frontend/app/[locale]/admin/pricing/page.tsx` - GÜNCELLENECEK
- `frontend/lib/adminApi.ts` - API fonksiyonları zaten var

### AŞAMA 4: Kullanıcı Search İyileştirmesi (ÖNCELİK 2)
**Durum:** External API'ler kullanılıyor, local DB entegrasyonu eksik

**Yapılacaklar:**
1. ❌ Local FAISS index'i search'e entegre et
2. ❌ Waterfall search: Local → External
3. ❌ Similarity threshold ayarları
4. ❌ Search sonuçlarında kaynak göster
5. ❌ Local DB öncelik ver (hızlı + ücretsiz)

**Dosyalar:**
- `backend/app/api/face_search.py` - Search endpoint
- `backend/app/services/search_service.py` - Search logic
- `backend/app/services/faiss_service.py` - FAISS search

### AŞAMA 5: Fiyatlandırma Sistemi (ÖNCELİK 3)
**Durum:** LemonSqueezy entegrasyonu var, admin yönetimi eksik

**Yapılacaklar:**
1. ❌ Admin'den plan oluşturma
2. ❌ Admin'den fiyat güncelleme
3. ❌ Plan aktif/pasif yapma
4. ❌ Özel indirim kodları
5. ❌ Banka transferi yönetimi

**Dosyalar:**
- `backend/app/api/pricing.py` - Pricing API
- `frontend/app/[locale]/admin/pricing/page.tsx` - Admin UI

## 📊 MEVCUT SİSTEM DURUMU

### ✅ ÇALIŞAN SİSTEMLER:
- FastAPI backend
- Next.js frontend
- PostgreSQL/SQLite database
- FAISS vector store
- InsightFace embedding
- Redis queue
- Admin authentication
- User authentication
- Payment system (LemonSqueezy)
- Bank transfer workflow
- Email notifications
- Audit logging

### ❌ EKSİK/GELİŞTİRİLMESİ GEREKEN:
- Otomatik crawler scheduler
- Sosyal medya scrapers
- Proxy rotation
- Admin face index UI
- Local DB search integration
- Pricing management UI
- Real-time monitoring

## 🚀 UYGULAMA SIRASI

### Hemen Yapılacaklar (1-2 saat):
1. Face Index admin sayfası oluştur
2. Crawler scheduler'ı aktifleştir
3. Worker concurrent limit artır
4. Local DB search entegrasyonu

### Kısa Vadede (1 gün):
1. Sosyal medya scrapers optimize et
2. Proxy pool sistemi kur
3. Pricing admin UI
4. Real-time monitoring

### Orta Vadede (1 hafta):
1. 20k+ yüz/gün hedefine ulaş
2. Dataset 20MB+ yap
3. Tüm admin sayfaları tamamla
4. Production optimizasyonları

## 💾 DATASET HEDEFI

**Mevcut:** ~13,767 yüz (ekran görüntüsünden)
**Hedef:** 100,000+ yüz (20MB+)

**Strateji:**
- Instagram: 50k yüz
- Twitter: 20k yüz
- Facebook: 15k yüz
- TikTok: 10k yüz
- Web scraping: 5k yüz

**Günlük Hedef:** 20,000 yeni yüz
**Süre:** 5 gün içinde 100k'ya ulaş

## 🔧 TEKNİK DETAYLAR

### Worker Konfigürasyonu:
```python
CONCURRENT_WORKERS = 50  # 10'dan artır
MAX_RETRIES = 3
BATCH_SIZE = 100
RATE_LIMIT_RPM = 60  # Request per minute
```

### Scheduler Konfigürasyonu:
```python
# Her 30 dakikada bir çalış
CRON_SCHEDULE = "*/30 * * * *"
# Günde 48 çalışma = 48 * 500 = 24,000 yüz/gün
```

### FAISS Index:
```python
EMBEDDING_DIM = 512  # InsightFace
INDEX_TYPE = "IndexFlatL2"  # L2 distance
SIMILARITY_THRESHOLD = 0.6
TOP_K = 10
```

## 📝 NOTLAR

- Mevcut kod yapısı çok iyi, sadece optimize edilmeli
- Tüm temel sistemler zaten var
- Admin API'leri hazır, sadece UI eksik
- Face index sistemi production-ready
- Proxy sistemi var ama kullanılmıyor

## ⚠️ DİKKAT EDİLECEKLER

1. **Kodlara zarar verme:** Mevcut çalışan sistemlere dokunma
2. **Backward compatibility:** Eski API'leri kırma
3. **Database migrations:** Dikkatli yap
4. **Rate limiting:** IP ban yeme
5. **Proxy rotation:** Sürekli değiştir
6. **Error handling:** Her yerde try-catch
7. **Logging:** Her işlemi logla

---

**Hazırlayan:** Kiro AI  
**Tarih:** 13 Şubat 2026  
**Durum:** Plan hazır, uygulama başlıyor
