# 🚀 Sosyal Medya Crew Deployment Rehberi

## ÖNEMLİ: Tüm Güncellemeler Tamamlandı!

Sistem %100 hazır. Şimdi VPS'e deploy edeceğiz.

## ADIM 1: VPS'e Bağlan

```bash
ssh root@46.4.123.77
# Şifre: Benalan.1
```

## ADIM 2: Deployment Script'ini İndir ve Çalıştır

```bash
cd /opt/faceseek

# Script'i GitHub'dan indir
curl -o deploy_social_crew.sh https://raw.githubusercontent.com/bendedo13/eye-of-tr-v2/main/deploy_social_crew.sh

# Çalıştırılabilir yap
chmod +x deploy_social_crew.sh

# Çalıştır
./deploy_social_crew.sh
```

## ADIM 3: Deployment Sonrası Kontroller

### 3.1 Servislerin Durumunu Kontrol Et

```bash
# Backend durumu
systemctl status faceseek-backend

# Worker durumu
systemctl status faceseek-worker

# Redis durumu
systemctl status redis
```

Hepsi "active (running)" olmalı.

### 3.2 Logları İzle

```bash
# Backend logları (yeni terminal)
journalctl -u faceseek-backend -f

# Worker logları (başka terminal)
journalctl -u faceseek-worker -f
```

Şu mesajları görmelisiniz:
- "Face Index scheduler started"
- "Loaded X scheduled crawl sources"
- "Worker started, listening on fi:job_queue"

### 3.3 Database'i Kontrol Et

```bash
# PostgreSQL'e bağlan
psql "postgresql+psycopg2://postgres.gynszzpebahqxyxprwrd:12436808068@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Source'ları listele
SELECT id, name, kind, is_enabled, schedule_enabled, total_faces_indexed FROM fi_sources;

# Çıkış
\q
```

4 source görmelisiniz:
- Instagram Popular
- Twitter Trending
- Facebook Official
- TikTok Official

## ADIM 4: İlk Test Crawl'ı Başlat

### 4.1 Manuel Test (Opsiyonel)

```bash
cd /opt/faceseek/backend
source venv/bin/activate
python test_social_crawlers.py
```

Beklenen çıktı:
```
✅ Instagram: PASS
✅ Twitter: PASS
✅ Facebook: PASS
✅ TikTok: PASS
```

### 4.2 İlk Gerçek Crawl Job'ı Başlat

```bash
cd /opt/faceseek/backend
source venv/bin/activate
python << 'EOF'
from app.db.database import SessionLocal
from app.modules.face_index.models import FaceSource, FaceCrawlJob
from app.modules.face_index.worker import enqueue_job
import asyncio

db = SessionLocal()

# Instagram source'u al
source = db.query(FaceSource).filter(FaceSource.name == "Instagram Popular").first()

if source:
    # Yeni job oluştur
    job = FaceCrawlJob(source_id=source.id, status="queued")
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Job'ı kuyruğa ekle
    asyncio.run(enqueue_job(job.id))
    
    print(f"✅ Job {job.id} başlatıldı!")
    print(f"   Source: {source.name}")
    print(f"   URL: {source.base_url}")
else:
    print("❌ Instagram source bulunamadı!")

db.close()
EOF
```

### 4.3 Job'ın İlerlemesini İzle

```bash
# Job durumunu kontrol et
psql "$DATABASE_URL" -c "SELECT id, source_id, status, pages_crawled, images_downloaded, faces_indexed, message, created_at FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 5;"
```

Status değişimleri:
1. `queued` → Job kuyruğa eklendi
2. `running` → Worker job'ı işliyor
3. `completed` → Job başarıyla tamamlandı
4. `failed` → Hata oluştu (otomatik retry yapılır)

## ADIM 5: Otomatik Crawl'ları İzle

Scheduler her 30 dakikada bir otomatik olarak yeni job'lar oluşturacak.

### 5.1 Scheduler Loglarını İzle

```bash
journalctl -u faceseek-backend -f | grep -i "scheduler\|crawl"
```

Şu mesajları göreceksiniz:
```
Face Index scheduler started
Loaded 4 scheduled crawl sources
Scheduled source 1 with cron '*/30 * * * *'
Creating scheduled job for source: Instagram Popular
Job 123 enqueued
```

### 5.2 İstatistikleri Kontrol Et

```bash
# Source istatistikleri
psql "$DATABASE_URL" -c "SELECT name, kind, total_images_found, total_faces_indexed, last_crawl_at, last_crawl_status FROM fi_sources;"

# Son job'lar
psql "$DATABASE_URL" -c "SELECT id, source_id, status, pages_crawled, images_downloaded, faces_indexed, created_at FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 10;"

# Toplam yüz sayısı
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_faces FROM fi_indexed_faces;"
```

## ADIM 6: Admin Panel'den Kontrol Et

1. Tarayıcıda aç: https://www.face-seek.com/tr/admin/login
2. Admin credentials ile giriş yap
3. "Face Index" sayfasına git
4. Source'ları ve job'ları gör

## BEKLENEN SONUÇLAR

### İlk 1 Saat:
- 4 platform × 1 crawl = 4 job
- Her job ~50-100 yüz
- Toplam: 200-400 yüz

### İlk 24 Saat:
- 4 platform × 48 crawl = 192 job
- Ortalama 50 yüz/job
- Toplam: 8,000-10,000 yüz

### İlk Hafta:
- Günlük 8,000-10,000 yüz
- Haftalık: 56,000-70,000 yüz
- Dataset: ~14-17 GB

## SORUN GİDERME

### Worker Çalışmıyor

```bash
# Worker'ı yeniden başlat
systemctl restart faceseek-worker

# Logları kontrol et
journalctl -u faceseek-worker -n 50
```

### Job'lar Failed Oluyor

```bash
# Failed job'ların detaylarını gör
psql "$DATABASE_URL" -c "SELECT id, source_id, status, message, error_log FROM fi_crawl_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;"

# Proxy'leri kontrol et
psql "$DATABASE_URL" -c "SELECT * FROM fi_proxies WHERE is_active = true;"
```

### Instagram Login Hatası

```bash
# Session dosyasını sil (yeniden login için)
rm -rf /opt/faceseek/backend/data/ig_sessions/*

# Backend'i yeniden başlat
systemctl restart faceseek-backend
```

### Redis Bağlantı Hatası

```bash
# Redis'i kontrol et
systemctl status redis

# Redis'i yeniden başlat
systemctl restart redis

# Backend ve Worker'ı yeniden başlat
systemctl restart faceseek-backend
systemctl restart faceseek-worker
```

## OPTİMİZASYON (İsteğe Bağlı)

### Worker Count'u Artır

```bash
# worker.py dosyasını düzenle
nano /opt/faceseek/backend/app/modules/face_index/worker.py

# CONCURRENT_WORKERS = 10 → 50 yap

# Worker'ı yeniden başlat
systemctl restart faceseek-worker
```

### Daha Fazla Source Ekle

```bash
psql "$DATABASE_URL" << 'EOF'
-- Popüler Instagram hesapları
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
VALUES 
('Instagram Cristiano', 'instagram', 'https://www.instagram.com/cristiano/', true, '0 */2 * * *', true, 20),
('Instagram Selena', 'instagram', 'https://www.instagram.com/selenagomez/', true, '15 */2 * * *', true, 20),
('Instagram Kylie', 'instagram', 'https://www.instagram.com/kyliejenner/', true, '30 */2 * * *', true, 20);
EOF
```

## MONITORING KOMUTLARI

```bash
# Sistem durumu (tek komut)
echo "Backend: $(systemctl is-active faceseek-backend)"
echo "Worker: $(systemctl is-active faceseek-worker)"
echo "Redis: $(systemctl is-active redis)"

# İstatistikler (tek komut)
psql "$DATABASE_URL" << 'EOF'
SELECT 
    (SELECT COUNT(*) FROM fi_sources WHERE is_enabled = true) as active_sources,
    (SELECT COUNT(*) FROM fi_crawl_jobs WHERE status = 'running') as running_jobs,
    (SELECT COUNT(*) FROM fi_crawl_jobs WHERE status = 'completed') as completed_jobs,
    (SELECT COUNT(*) FROM fi_indexed_faces) as total_faces,
    (SELECT SUM(total_faces_indexed) FROM fi_sources) as total_indexed;
EOF

# Disk kullanımı
du -sh /opt/faceseek/backend/dataset
du -sh /opt/faceseek/backend/faiss
```

## BAŞARILI DEPLOYMENT KONTROL LİSTESİ

- [ ] Backend servisi çalışıyor
- [ ] Worker servisi çalışıyor
- [ ] Redis servisi çalışıyor
- [ ] 4 source database'de mevcut
- [ ] Test crawl başarılı
- [ ] İlk gerçek job başlatıldı
- [ ] Scheduler logları görünüyor
- [ ] Admin panel'den Face Index sayfası açılıyor

## DESTEK

Herhangi bir sorun olursa:

1. Logları kontrol et:
   ```bash
   journalctl -u faceseek-backend -n 100
   journalctl -u faceseek-worker -n 100
   ```

2. Database'i kontrol et:
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM fi_crawl_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;"
   ```

3. Servisleri yeniden başlat:
   ```bash
   systemctl restart faceseek-backend
   systemctl restart faceseek-worker
   systemctl restart redis
   ```

---

**Hazırlayan:** Kiro AI  
**Tarih:** 13 Şubat 2026  
**Durum:** ✅ Deployment hazır
