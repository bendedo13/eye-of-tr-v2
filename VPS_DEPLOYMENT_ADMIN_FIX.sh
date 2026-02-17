#!/bin/bash

# Admin Panel 404 Fix - VPS Deployment Script
# Tarih: 17 Şubat 2026

set -e  # Exit on error

echo "=========================================="
echo "Admin Panel 404 Fix - VPS Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Mevcut dizini kontrol et
echo -e "${YELLOW}[1/10] Dizin kontrolü...${NC}"
if [ ! -d "/opt/faceseek/frontend" ]; then
    echo -e "${RED}HATA: /opt/faceseek/frontend dizini bulunamadı!${NC}"
    exit 1
fi
cd /opt/faceseek/frontend
echo -e "${GREEN}✓ Dizin: $(pwd)${NC}"
echo ""

# 2. Mevcut branch kontrol et
echo -e "${YELLOW}[2/10] Git branch kontrolü...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${GREEN}✓ Mevcut branch: $CURRENT_BRANCH${NC}"
echo ""

# 3. Backup oluştur
echo -e "${YELLOW}[3/10] Backup oluşturuluyor...${NC}"
if [ -d ".next" ]; then
    BACKUP_DIR=".next.backup.$(date +%Y%m%d_%H%M%S)"
    cp -r .next "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup: $BACKUP_DIR${NC}"
else
    echo -e "${YELLOW}⚠ .next dizini bulunamadı, backup atlanıyor${NC}"
fi
echo ""

# 4. Git güncellemelerini çek
echo -e "${YELLOW}[4/10] Git güncellemeleri çekiliyor...${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Git güncellendi${NC}"
echo ""

# 5. Eski build'i temizle
echo -e "${YELLOW}[5/10] Eski build temizleniyor...${NC}"
rm -rf .next
rm -rf node_modules/.cache
echo -e "${GREEN}✓ Build temizlendi${NC}"
echo ""

# 6. Dependencies kontrol et
echo -e "${YELLOW}[6/10] Dependencies kontrol ediliyor...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies yüklendi${NC}"
echo ""

# 7. Yeni build oluştur
echo -e "${YELLOW}[7/10] Yeni build oluşturuluyor...${NC}"
npm run build 2>&1 | tee build.log
echo -e "${GREEN}✓ Build tamamlandı${NC}"
echo ""

# 8. Build çıktısını kontrol et
echo -e "${YELLOW}[8/10] Build çıktısı kontrol ediliyor...${NC}"
echo ""
echo "Admin route'ları:"
grep -i "admin" build.log | grep -E "├|└" || echo "Admin route bulunamadı!"
echo ""

# Admin route'larının doğru formatı kontrol et
if grep -q "\[locale\]/admin" build.log; then
    echo -e "${GREEN}✓ Admin route'ları doğru formatta: /[locale]/admin/*${NC}"
else
    echo -e "${RED}✗ UYARI: Admin route'ları yanlış formatta olabilir!${NC}"
    echo -e "${YELLOW}Build log'u kontrol edin: cat build.log${NC}"
fi
echo ""

# 9. Frontend servisini restart et
echo -e "${YELLOW}[9/10] Frontend servisi yeniden başlatılıyor...${NC}"
systemctl restart faceseek-frontend
sleep 3
echo -e "${GREEN}✓ Servis restart edildi${NC}"
echo ""

# 10. Servis durumunu kontrol et
echo -e "${YELLOW}[10/10] Servis durumu kontrol ediliyor...${NC}"
if systemctl is-active --quiet faceseek-frontend; then
    echo -e "${GREEN}✓ Servis çalışıyor${NC}"
    systemctl status faceseek-frontend --no-pager -n 5
else
    echo -e "${RED}✗ HATA: Servis çalışmıyor!${NC}"
    systemctl status faceseek-frontend --no-pager -n 20
    exit 1
fi
echo ""

# Test URL'leri
echo "=========================================="
echo "Test URL'leri:"
echo "=========================================="
echo ""
echo "1. Admin Login (TR): https://face-seek.com/tr/admin/login"
echo "2. Admin Dashboard (TR): https://face-seek.com/tr/admin"
echo "3. Admin Login (EN): https://face-seek.com/en/admin/login"
echo "4. Admin Dashboard (EN): https://face-seek.com/en/admin"
echo ""

# HTTP Status kontrol et
echo "=========================================="
echo "HTTP Status Kontrolü:"
echo "=========================================="
echo ""

echo -e "${YELLOW}Testing /tr/admin/login...${NC}"
STATUS_TR_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin/login)
if [ "$STATUS_TR_LOGIN" = "200" ]; then
    echo -e "${GREEN}✓ /tr/admin/login: $STATUS_TR_LOGIN OK${NC}"
else
    echo -e "${RED}✗ /tr/admin/login: $STATUS_TR_LOGIN (Beklenen: 200)${NC}"
fi

echo -e "${YELLOW}Testing /tr/admin...${NC}"
STATUS_TR_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin)
if [ "$STATUS_TR_ADMIN" = "200" ] || [ "$STATUS_TR_ADMIN" = "302" ]; then
    echo -e "${GREEN}✓ /tr/admin: $STATUS_TR_ADMIN OK${NC}"
else
    echo -e "${RED}✗ /tr/admin: $STATUS_TR_ADMIN (Beklenen: 200 veya 302)${NC}"
fi

echo -e "${YELLOW}Testing /en/admin/login...${NC}"
STATUS_EN_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin/login)
if [ "$STATUS_EN_LOGIN" = "200" ]; then
    echo -e "${GREEN}✓ /en/admin/login: $STATUS_EN_LOGIN OK${NC}"
else
    echo -e "${RED}✗ /en/admin/login: $STATUS_EN_LOGIN (Beklenen: 200)${NC}"
fi

echo -e "${YELLOW}Testing /en/admin...${NC}"
STATUS_EN_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin)
if [ "$STATUS_EN_ADMIN" = "200" ] || [ "$STATUS_EN_ADMIN" = "302" ]; then
    echo -e "${GREEN}✓ /en/admin: $STATUS_EN_ADMIN OK${NC}"
else
    echo -e "${RED}✗ /en/admin: $STATUS_EN_ADMIN (Beklenen: 200 veya 302)${NC}"
fi

echo ""
echo "=========================================="
echo "Deployment Tamamlandı!"
echo "=========================================="
echo ""
echo "Sonraki Adımlar:"
echo "1. Tarayıcıda https://face-seek.com/tr/admin/login adresini aç"
echo "2. Admin credentials ile giriş yap"
echo "3. Dashboard'a yönlendirildiğini kontrol et"
echo "4. Tüm admin sayfalarını test et"
echo ""
echo "Sorun devam ederse:"
echo "- Build log: cat build.log"
echo "- Servis log: journalctl -u faceseek-frontend -n 100"
echo "- Backup restore: mv $BACKUP_DIR .next"
echo ""
