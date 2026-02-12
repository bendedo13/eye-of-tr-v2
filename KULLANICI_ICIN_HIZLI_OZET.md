# 🎯 Hızlı Özet - Sosyal Medya Crew Deployment

## ✅ TAMAMLANAN İŞLER

1. **Tüm Kod Güncellemeleri Yapıldı**
   - Instagram, Twitter, Facebook, TikTok crawler'ları hazır
   - Face detection ve embedding sistemi hazır
   - Worker ve scheduler sistemi hazır
   - Test script'leri hazır

2. **Konfigürasyon Tamamlandı**
   - Instagram credentials eklendi (benalper8x / Benalan.6)
   - Face Index ayarları yapıldı
   - FAISS ve InsightFace konfigürasyonu tamamlandı

3. **Deployment Script'i Hazır**
   - `deploy_social_crew.sh` GitHub'a yüklendi
   - Otomatik kurulum ve test içeriyor

## 🚀 ŞİMDİ YAPILACAKLAR (VPS'te)

### 1. VPS'e Bağlan
```bash
ssh root@46.4.123.77
# Şifre: Benalan.1
```

### 2. Deployment Script'ini Çalıştır
```bash
cd /opt/faceseek

# Script'i indir
curl -o deploy_social_crew.sh https://raw.githubusercontent.com/bendedo13/eye-of-tr-v2/main/deploy_social_crew.sh

# Çalıştırılabilir yap
chmod +x deploy_social_crew.sh

# Çalıştır
./deploy_social_crew.sh
```

### 3. Sonuçları Kontrol Et

Script otomatik olarak:
- ✅ Backend'i güncelleyecek
- ✅ Dependencies kuracak (instaloader, insightface, faiss)
- ✅ Worker servisini başlatacak
- ✅ Crawler'ları test edecek
- ✅ İlk source'ları database'e ekleyecek
- ✅ Sistem durumunu gösterecek

### 4. İlk Crawl'ı Başlat

Script tamamlandıktan sonra:

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
else:
    print("❌ Source bulunamadı!")

db.close()
EOF
```

### 5. İlerleyi İzle

```bash
# Worker logları
journalctl -u faceseek-worker -f

# Job durumu
psql "$DATABASE_URL" -c "SELECT id, status, pages_crawled, images_downloaded, faces_indexed FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 5;"
```

## 📊 BEKLENEN SONUÇLAR

- **İlk 1 saat:** 200-400 yüz
- **İlk 24 saat:** 8,000-10,000 yüz
- **İlk hafta:** 56,000-70,000 yüz

## 📖 DETAYLI REHBERİ OKU

Daha fazla bilgi için: `DEPLOYMENT_GUIDE_TR.md`

---

**Durum:** ✅ Sistem hazır, deployment bekliyor  
**Tarih:** 13 Şubat 2026
