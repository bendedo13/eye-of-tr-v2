#!/bin/bash

# ============================================
# VPS DEPLOYMENT - Sosyal Medya Crew Sistemi
# ============================================

echo "🚀 FaceSeek Sosyal Medya Crew Deployment Başlıyor..."
echo ""

# 1. Backend'i Güncelle
echo "📦 1. Backend güncelleniyor..."
cd /opt/faceseek/backend
git fetch origin
git pull origin main

# 2. .env dosyasını kontrol et
echo ""
echo "🔍 2. .env dosyası kontrol ediliyor..."
if grep -q "IG_SESSION_ENABLED" .env; then
    echo "✅ Instagram credentials zaten mevcut"
else
    echo "⚠️  Instagram credentials eksik, ekleniyor..."
    cat >> .env << 'EOF'

# ============================================
# FACE INDEX & CRAWLER SETTINGS
# ============================================
# Face Embedder Backend (insightface or mock)
FACE_EMBEDDER_BACKEND=insightface
INSIGHTFACE_MODEL=buffalo_l
INSIGHTFACE_DET_THRESH=0.5
INSIGHTFACE_DET_SIZE_W=640
INSIGHTFACE_DET_SIZE_H=640
INSIGHTFACE_CTX_ID=-1

# FAISS Vector Store
FAISS_DIM=512
FACE_INDEX_SIMILARITY_THRESHOLD=0.6
FACE_INDEX_TOP_K_DEFAULT=10
FACE_INDEX_MIN_FACE_DET_SCORE=0.5
FACE_INDEX_MIN_IMAGE_SIZE=10240
FACE_INDEX_MAX_FACES_PER_IMAGE=10
FACE_INDEX_EMBEDDING_VERSION=1

# Crawler Settings
FACE_INDEX_CRAWLER_USER_AGENT=FaceSeek-Crawler/1.0
FACE_INDEX_CRAWLER_DEFAULT_RPM=60
FACE_INDEX_CRAWLER_CONCURRENT=10
FACE_INDEX_PROXY_ENABLED=true
FACE_INDEX_PROXY_TIMEOUT=15

# Instagram Authenticated Crawl
IG_SESSION_ENABLED=true
IG_SESSION_USERNAME=benalper8x
IG_SESSION_PASSWORD=Benalan.6
IG_SESSION_MAX_FOLLOWERS=500
IG_SESSION_RATE_LIMIT_SECONDS=2.0
EOF
    echo "✅ Instagram credentials eklendi"
fi

# 3. Dependencies kontrol et
echo ""
echo "📚 3. Dependencies kontrol ediliyor..."
source venv/bin/activate

# Instaloader kurulu mu kontrol et
if python -c "import instaloader" 2>/dev/null; then
    echo "✅ instaloader zaten kurulu"
else
    echo "📥 instaloader kuruluyor..."
    pip install instaloader
fi

# InsightFace kurulu mu kontrol et
if python -c "import insightface" 2>/dev/null; then
    echo "✅ insightface zaten kurulu"
else
    echo "📥 insightface kuruluyor..."
    pip install insightface onnxruntime
fi

# FAISS kurulu mu kontrol et
if python -c "import faiss" 2>/dev/null; then
    echo "✅ faiss zaten kurulu"
else
    echo "📥 faiss kuruluyor..."
    pip install faiss-cpu
fi

# 4. Session dizinini oluştur
echo ""
echo "📁 4. Session dizini oluşturuluyor..."
mkdir -p /opt/faceseek/backend/data/ig_sessions
chown -R root:root /opt/faceseek/backend/data
chmod 755 /opt/faceseek/backend/data/ig_sessions

# 5. Dataset dizinini oluştur
echo ""
echo "📁 5. Dataset dizini oluşturuluyor..."
mkdir -p /opt/faceseek/backend/dataset/faces
mkdir -p /opt/faceseek/backend/dataset/embeddings
mkdir -p /opt/faceseek/backend/faiss
chown -R root:root /opt/faceseek/backend/dataset
chown -R root:root /opt/faceseek/backend/faiss

# 6. Backend'i yeniden başlat
echo ""
echo "🔄 6. Backend yeniden başlatılıyor..."
systemctl restart faceseek-backend
sleep 3
systemctl status faceseek-backend --no-pager -n 5

# 7. Worker servisini oluştur/başlat
echo ""
echo "👷 7. Worker servisi kontrol ediliyor..."
if systemctl is-active --quiet faceseek-worker; then
    echo "✅ Worker zaten çalışıyor, yeniden başlatılıyor..."
    systemctl restart faceseek-worker
else
    echo "📝 Worker servisi oluşturuluyor..."
    cat > /etc/systemd/system/faceseek-worker.service << 'EOFSERVICE'
[Unit]
Description=FaceSeek Face Index Worker
After=network.target redis.service postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/faceseek/backend
Environment="PATH=/opt/faceseek/backend/venv/bin"
ExecStart=/opt/faceseek/backend/venv/bin/python -m app.modules.face_index.worker
Restart=always
RestartSec=10
StandardOutput=append:/var/log/faceseek/worker.log
StandardError=append:/var/log/faceseek/worker.log

[Install]
WantedBy=multi-user.target
EOFSERVICE

    systemctl daemon-reload
    systemctl enable faceseek-worker
    systemctl start faceseek-worker
    echo "✅ Worker servisi başlatıldı"
fi

sleep 2
systemctl status faceseek-worker --no-pager -n 5

# 8. Test crawler'ları
echo ""
echo "🧪 8. Crawler'lar test ediliyor..."
cd /opt/faceseek/backend
python test_social_crawlers.py

# 9. İlk source'ları ekle
echo ""
echo "📊 9. İlk source'lar ekleniyor..."
psql "$DATABASE_URL" << 'EOFSQL'
-- Instagram source (eğer yoksa ekle)
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
SELECT 'Instagram Popular', 'instagram', 'https://www.instagram.com/instagram/', true, '*/30 * * * *', true, 20
WHERE NOT EXISTS (SELECT 1 FROM fi_sources WHERE name = 'Instagram Popular');

-- Twitter source
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
SELECT 'Twitter Trending', 'twitter', 'https://x.com/twitter', true, '*/30 * * * *', true, 30
WHERE NOT EXISTS (SELECT 1 FROM fi_sources WHERE name = 'Twitter Trending');

-- Facebook source
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
SELECT 'Facebook Official', 'facebook', 'https://www.facebook.com/facebook', true, '*/30 * * * *', true, 20
WHERE NOT EXISTS (SELECT 1 FROM fi_sources WHERE name = 'Facebook Official');

-- TikTok source
INSERT INTO fi_sources (name, kind, base_url, is_enabled, schedule_cron, schedule_enabled, rate_limit_rpm)
SELECT 'TikTok Official', 'tiktok', 'https://www.tiktok.com/@tiktok', true, '*/30 * * * *', true, 20
WHERE NOT EXISTS (SELECT 1 FROM fi_sources WHERE name = 'TikTok Official');

-- Source'ları listele
SELECT id, name, kind, is_enabled, schedule_enabled, total_faces_indexed FROM fi_sources;
EOFSQL

# 10. Logları kontrol et
echo ""
echo "📋 10. Loglar kontrol ediliyor..."
echo ""
echo "Backend log (son 10 satır):"
journalctl -u faceseek-backend -n 10 --no-pager
echo ""
echo "Worker log (son 10 satır):"
journalctl -u faceseek-worker -n 10 --no-pager

echo ""
echo "============================================"
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "============================================"
echo ""
echo "📊 Sistem Durumu:"
echo "  - Backend: $(systemctl is-active faceseek-backend)"
echo "  - Worker: $(systemctl is-active faceseek-worker)"
echo "  - Redis: $(systemctl is-active redis)"
echo ""
echo "📈 Monitoring:"
echo "  - Backend logs: journalctl -u faceseek-backend -f"
echo "  - Worker logs: journalctl -u faceseek-worker -f"
echo "  - Job status: psql \$DATABASE_URL -c 'SELECT * FROM fi_crawl_jobs ORDER BY created_at DESC LIMIT 5;'"
echo ""
echo "🎯 Sonraki Adımlar:"
echo "  1. Admin panelden Face Index sayfasını kontrol et"
echo "  2. İlk crawl job'ını manuel başlat"
echo "  3. 30 dakika sonra otomatik crawl'ları izle"
echo ""
