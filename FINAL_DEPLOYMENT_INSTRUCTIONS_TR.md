# 🎉 Sosyal Medya Crew Sistemi - Deployment Talimatları

## ✅ DURUM: HER ŞEY HAZIR!

Tüm kod güncellemeleri tamamlandı ve GitHub'a yüklendi. Şimdi VPS'e deploy edebilirsiniz.

## 📋 YAPILACAKLAR LİSTESİ

### ADIM 1: VPS'e Bağlan

Terminal'de şu komutu çalıştır:

```bash
ssh root@46.4.123.77
```

Şifre: `Benalan.1`

### ADIM 2: Deployment Script'ini İndir ve Çalıştır

VPS'e bağlandıktan sonra:

```bash
# Proje dizinine git
cd /opt/faceseek

# Deployment script'ini GitHub'dan indir
curl -o deploy_social_crew.sh https://raw.githubusercontent.com/bendedo13/eye-of-tr-v2/main/deploy_social_crew.sh

# Script'i çalıştırılabilir yap
chmod +x deploy_social_crew.sh

# Script'i çalıştır
./deploy_social_crew.sh
```

### ADIM 3: Script'in Çalışmasını İzle

Script otomatik olarak şunları yapacak:

1. ✅ Backend kodunu güncelleyecek (git pull)
2. ✅ .env dosyasını kontrol edecek (Instagram credentials)
3. ✅ Dependencies kuracak (instaloader, insightface, faiss)
4. ✅ Gerekli dizinleri oluşturacak
5. ✅ Backend'i yeniden başlatacak
6. ✅ Worker servisini oluşturup başlatacak
7. ✅ Crawler'ları test edecek
8. ✅ İlk source'ları database'e ekleyecek
9. ✅ Sistem durumunu gösterecek

### ADIM 4: Deployment Sonrası Kontrol

Script tamamlandığında şu çıktıyı göreceksiniz:

```
============================================
✅ DEPLOYMENT TAMAMLANDI!
============================================

📊 Sistem Durumu:
  - Backend: active
  - Worker: active
  - Redis: active
```

### ADIM 5: İlk Test Crawl'ı Başlat

```bash
cd /opt/faceseek/backend
source venv/bin/activate

python << 'EOF'
from app.db.database import SessionLocal
from app.modules.face_index.models import FaceSource, FaceCrawlJob
from app.modules.face_index.worker import enqueue_job
import asyncio

db = SessionLocal()
source = db.query(FaceSource).filter(FaceSource.name == "Instagram Popular").first()

if source:
    job = FaceCrawlJob(source_id=source.id, status="queued")
    db.add(job)
    db.commit()
    db.refresh(job)
    asyncio.run(enqueue_job(job.id))
    print(f"✅ Job {job.id} başlatıldı!")
    print(f"   Source: {source.name}")
    print(f"   URL: {source.base_url}")
else:
    print("❌ Instagram source bulunamadı!")

db.close()
EOF
```

### ADIM 6: Job'ın İlerlemesini İzle

Yeni bir terminal aç ve:

```bash
# Worker loglarını izle
journalctl -u faceseek-worker -f
```

Başka bir terminal'de:

```bash
# Job durumunu kontrol et
watch -n 5 'psql "$DATABASE_URL" -c "SELECT id, status, pages_crawled, images_downloaded, faces_indexed, message FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 5;"'
```

## 📊 BEKLENEN SONUÇLAR

### İlk 5 Dakika:
- Job status: `queued` → `running`
- Worker log: "Processing job X"
- Pages crawled: 1-5
- Images downloaded: 10-50

### İlk 30 Dakika:
- Job status: `completed`
- Images downloaded: 50-100
- Faces indexed: 30-80

### İlk 24 Saat:
- 4 platform × 48 crawl = 192 job
- Toplam yüz: 8,000-10,000
- Dataset boyutu: ~2-3 GB

## 🔍 MONITORING KOMUTLARI

### Sistem Durumu
```bash
systemctl status faceseek-backend
systemctl status faceseek-worker
systemctl status redis
```

### Loglar
```bash
# Backend logları
journalctl -u faceseek-backend -f

# Worker logları
journalctl -u faceseek-worker -f

# Son 100 satır
journalctl -u faceseek-worker -n 100
```

### Database İstatistikleri
```bash
# Source'ları listele
psql "$DATABASE_URL" -c "SELECT id, name, kind, is_enabled, total_faces_indexed FROM fi_sources;"

# Job'ları listele
psql "$DATABASE_URL" -c "SELECT id, source_id, status, pages_crawled, images_downloaded, faces_indexed, created_at FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 10;"

# Toplam yüz sayısı
psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_faces FROM fi_indexed_faces;"

# Platform bazında istatistikler
psql "$DATABASE_URL" -c "SELECT platform, COUNT(*) as count FROM fi_indexed_faces GROUP BY platform;"
```

## ⚠️ SORUN GİDERME

### Worker Çalışmıyor

```bash
# Worker'ı yeniden başlat
systemctl restart faceseek-worker

# Logları kontrol et
journalctl -u faceseek-worker -n 50

# Worker servis dosyasını kontrol et
cat /etc/systemd/system/faceseek-worker.service
```

### Job'lar Failed Oluyor

```bash
# Failed job'ların detaylarını gör
psql "$DATABASE_URL" -c "SELECT id, source_id, status, message, error_log FROM fi_crawl_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;"

# Backend loglarını kontrol et
journalctl -u faceseek-backend -n 100 | grep -i error
```

### Instagram Login Hatası

```bash
# Session dosyasını sil
rm -rf /opt/faceseek/backend/data/ig_sessions/*

# Backend'i yeniden başlat
systemctl restart faceseek-backend

# Logları izle
journalctl -u faceseek-backend -f | grep -i instagram
```

### Redis Bağlantı Hatası

```bash
# Redis'i kontrol et
systemctl status redis

# Redis'i yeniden başlat
systemctl restart redis

# Tüm servisleri yeniden başlat
systemctl restart faceseek-backend
systemctl restart faceseek-worker
```

## 🎯 BAŞARILI DEPLOYMENT KONTROL LİSTESİ

Deployment başarılı sayılır eğer:

- [ ] `systemctl status faceseek-backend` → active (running)
- [ ] `systemctl status faceseek-worker` → active (running)
- [ ] `systemctl status redis` → active (running)
- [ ] Database'de 4 source var (Instagram, Twitter, Facebook, TikTok)
- [ ] Test crawl başarılı (test_social_crawlers.py)
- [ ] İlk gerçek job başlatıldı
- [ ] Job status `queued` → `running` → `completed` oldu
- [ ] `fi_indexed_faces` tablosunda yüzler var
- [ ] Worker loglarında "Processing job" mesajları var
- [ ] Backend loglarında "Face Index scheduler started" var

## 📈 OPTİMİZASYON (İsteğe Bağlı)

Sistem stabil çalıştıktan sonra:

### 1. Worker Count'u Artır

```bash
nano /opt/faceseek/backend/app/modules/face_index/worker.py

# CONCURRENT_WORKERS = 10 → 50 yap

systemctl restart faceseek-worker
```

### 2. Daha Fazla Source Ekle

```bash
psql "$DATABASE_URL" << 'EOF'
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
VALUES 
('Instagram Cristiano', 'instagram', 'https://www.instagram.com/cristiano/', true, '0 */2 * * *', true, 20),
('Instagram Selena', 'instagram', 'https://www.instagram.com/selenagomez/', true, '15 */2 * * *', true, 20);
EOF
```

### 3. Rate Limit'i Artır

```bash
# Her source için rate_limit_rpm'i artır
psql "$DATABASE_URL" -c "UPDATE fi_sources SET rate_limit_rpm = 60 WHERE rate_limit_rpm = 20;"
```

## 📞 DESTEK

Herhangi bir sorun olursa:

1. **Logları kontrol et:**
   ```bash
   journalctl -u faceseek-backend -n 100
   journalctl -u faceseek-worker -n 100
   ```

2. **Database'i kontrol et:**
   ```bash
   psql "$DATABASE_URL" -c "SELECT * FROM fi_crawl_jobs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 5;"
   ```

3. **Servisleri yeniden başlat:**
   ```bash
   systemctl restart faceseek-backend
   systemctl restart faceseek-worker
   systemctl restart redis
   ```

4. **Test script'ini çalıştır:**
   ```bash
   cd /opt/faceseek/backend
   python test_social_crawlers.py
   ```

## 🎉 ÖZET

### Yapılanlar:
- ✅ Tüm crawler'lar hazır (Instagram, Twitter, Facebook, TikTok)
- ✅ Face detection ve embedding sistemi hazır
- ✅ Worker ve scheduler sistemi hazır
- ✅ Instagram authenticated crawl aktif
- ✅ Deployment script hazır
- ✅ Test script'leri hazır

### Yapılacaklar:
1. VPS'e bağlan
2. Deployment script'ini çalıştır
3. İlk test crawl'ı başlat
4. Sonuçları izle

### Beklenen Performans:
- **İlk gün:** 8,000-10,000 yüz
- **İlk hafta:** 56,000-70,000 yüz
- **İlk ay:** 240,000-300,000 yüz

---

**Hazırlayan:** Kiro AI  
**Tarih:** 13 Şubat 2026  
**Commit:** 5c22090  
**Durum:** ✅ Deployment hazır, VPS'te çalıştırılabilir

## 🚀 HEMEN BAŞLA!

```bash
ssh root@46.4.123.77
cd /opt/faceseek
curl -o deploy_social_crew.sh https://raw.githubusercontent.com/bendedo13/eye-of-tr-v2/main/deploy_social_crew.sh
chmod +x deploy_social_crew.sh
./deploy_social_crew.sh
```

İyi çalışmalar! 🎉
