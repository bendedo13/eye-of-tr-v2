#!/bin/bash

# VPS Admin Panel 404 Fix Deployment Script
# Bu script VPS'te çalıştırılmalıdır

echo "=========================================="
echo "Admin Panel 404 Fix Deployment"
echo "=========================================="
echo ""

# 1. Git güncellemelerini çek
echo "1. Git güncellemeleri çekiliyor..."
cd /opt/faceseek/frontend
git fetch origin
git pull origin main

# 2. Eski build'i temizle
echo ""
echo "2. Eski build temizleniyor..."
rm -rf .next

# 3. Yeni build oluştur
echo ""
echo "3. Yeni build oluşturuluyor..."
npm run build

# 4. Build sonuçlarını kontrol et
echo ""
echo "4. Build sonuçları kontrol ediliyor..."
echo "Admin sayfaları şu şekilde görünmeli:"
echo "  ● /[locale]/admin"
echo "  ● /[locale]/admin/login"
echo "  ● /[locale]/admin/users"
echo ""
echo "Eğer '○ /admin/login' gibi görünüyorsa, hala sorun var!"
echo ""

# 5. Frontend servisini yeniden başlat
echo "5. Frontend servisi yeniden başlatılıyor..."
systemctl restart faceseek-frontend

# 6. Servis durumunu kontrol et
echo ""
echo "6. Servis durumu kontrol ediliyor..."
systemctl status faceseek-frontend --no-pager -n 10

echo ""
echo "=========================================="
echo "Deployment tamamlandı!"
echo "=========================================="
echo ""
echo "Test için:"
echo "  https://face-seek.com/tr/admin/login"
echo "  https://face-seek.com/tr/admin"
echo ""
