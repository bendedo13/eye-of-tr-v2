#!/bin/bash

# FaceSeek Admin Panel Deployment Script
# VPS'e admin panel güncellemelerini deploy eder

set -e

echo "=========================================="
echo "FaceSeek Admin Panel VPS Deployment"
echo "=========================================="

# VPS Bilgileri
VPS_IP="46.4.123.77"
VPS_USER="root"
PROJECT_DIR="/opt/faceseek"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

echo ""
echo "📍 VPS Bilgileri:"
echo "   IP: $VPS_IP"
echo "   Proje Dizini: $PROJECT_DIR"
echo ""

# SSH komutları
echo "🔄 Adım 1: Git güncellemelerini çek..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
cd /opt/faceseek
git fetch origin
git checkout claude/interesting-ellis
git pull origin claude/interesting-ellis
echo "✅ Git güncellemeleri tamamlandı"
EOF

echo ""
echo "🔄 Adım 2: Frontend'i build et..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
cd /opt/faceseek/frontend
npm install
npm run build
echo "✅ Frontend build tamamlandı"
EOF

echo ""
echo "🔄 Adım 3: Frontend servisini yeniden başlat..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
systemctl restart faceseek-frontend
sleep 2
systemctl status faceseek-frontend
echo "✅ Frontend servisi yeniden başlatıldı"
EOF

echo ""
echo "🔄 Adım 4: Backend servisini kontrol et..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
systemctl status faceseek-backend
echo "✅ Backend servisi çalışıyor"
EOF

echo ""
echo "🔄 Adım 5: Nginx'i yeniden yükle..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
nginx -t
systemctl reload nginx
echo "✅ Nginx yeniden yüklendi"
EOF

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "=========================================="
echo ""
echo "Admin Panel Erişim Adresleri:"
echo "  🇹🇷 Türkçe: https://46.4.123.77/tr/admin"
echo "  🇬🇧 İngilizce: https://46.4.123.77/en/admin"
echo ""
echo "Admin Giriş Bilgileri:"
echo "  Email: admin@faceseek.io"
echo "  API Key: (Lütfen .env dosyasından kontrol et)"
echo ""
echo "Yeni Admin Sayfaları:"
echo "  ✅ Kullanıcı Yönetimi"
echo "  ✅ Ödeme Yönetimi"
echo "  ✅ Blog Yönetimi"
echo "  ✅ Denetim Günlükleri"
echo "  ✅ Banka Transferleri"
echo "  ✅ Referanslar"
echo "  ✅ Medya Yönetimi"
echo "  ✅ Misafir Talepleri"
echo "  ✅ Fiyatlandırma"
echo "  ✅ Yasal İçerik"
echo "  ✅ Ana Sayfa Medyası"
echo "  ✅ İletişim"
echo "  ✅ Destek Biletleri"
echo ""
echo "=========================================="
