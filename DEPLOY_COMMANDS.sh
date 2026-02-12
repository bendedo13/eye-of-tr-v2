#!/bin/bash

# ============================================
# FaceSeek Admin Panel VPS Deployment
# ============================================

echo "=========================================="
echo "🚀 FaceSeek Admin Panel Deployment"
echo "=========================================="
echo ""

# Adım 1: Proje dizinine git
echo "📍 Adım 1: Proje dizinine git..."
cd /opt/faceseek
echo "✅ Proje dizini: $(pwd)"
echo ""

# Adım 2: Git güncellemelerini çek
echo "🔄 Adım 2: Git güncellemelerini çek..."
git fetch origin
git checkout claude/interesting-ellis
git pull origin claude/interesting-ellis
echo "✅ Git güncellemeleri tamamlandı"
echo ""

# Adım 3: Frontend'i build et
echo "🔄 Adım 3: Frontend'i build et..."
cd frontend
npm install
npm run build
echo "✅ Frontend build tamamlandı"
echo ""

# Adım 4: Frontend servisini yeniden başlat
echo "🔄 Adım 4: Frontend servisini yeniden başlat..."
cd /opt/faceseek
systemctl restart faceseek-frontend
sleep 2
echo "✅ Frontend servisi yeniden başlatıldı"
echo ""

# Adım 5: Nginx'i yeniden yükle
echo "🔄 Adım 5: Nginx'i yeniden yükle..."
nginx -t
systemctl reload nginx
echo "✅ Nginx yeniden yüklendi"
echo ""

# Adım 6: Servislerin durumunu kontrol et
echo "🔄 Adım 6: Servislerin durumunu kontrol et..."
echo ""
echo "Frontend Servisi:"
systemctl status faceseek-frontend --no-pager
echo ""
echo "Backend Servisi:"
systemctl status faceseek-backend --no-pager
echo ""
echo "Nginx Servisi:"
systemctl status nginx --no-pager
echo ""

# Adım 7: Deployment tamamlandı
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
echo "  ✅ Destek Biketleri"
echo ""
echo "=========================================="
