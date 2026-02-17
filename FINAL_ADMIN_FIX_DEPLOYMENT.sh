#!/bin/bash

# FINAL Admin Panel 404 Fix + Credentials Update
# Bu script hem 404 sorununu hem de credentials'ı düzeltir

set -e

echo "=========================================="
echo "FINAL Admin Panel Fix & Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Bu script şunları yapacak:${NC}"
echo "1. Git güncellemelerini çekecek"
echo "2. Backend .env'i güncelleyecek"
echo "3. Database'de admin kullanıcısını güncelleyecek"
echo "4. Frontend'i build edecek"
echo "5. Her iki servisi restart edecek"
echo "6. Test edecek"
echo ""
read -p "Devam etmek için ENTER'a basın..."
echo ""

# 1. Git güncellemelerini çek
echo -e "${YELLOW}[1/7] Git güncellemeleri çekiliyor...${NC}"
cd /opt/faceseek/frontend
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Git güncellendi${NC}"
echo ""

# 2. Backend .env güncelle
echo -e "${YELLOW}[2/7] Backend .env güncelleniyor...${NC}"
cd /opt/faceseek/backend

if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Backup oluşturuldu${NC}"
    
    # ADMIN_EMAIL güncelle
    if grep -q "^ADMIN_EMAIL=" .env; then
        sed -i 's/^ADMIN_EMAIL=.*/ADMIN_EMAIL=admin@face-seek.com/' .env
        echo -e "${GREEN}✓ ADMIN_EMAIL güncellendi${NC}"
    else
        echo "ADMIN_EMAIL=admin@face-seek.com" >> .env
        echo -e "${GREEN}✓ ADMIN_EMAIL eklendi${NC}"
    fi
    
    # ADMIN_API_KEY güncelle
    if grep -q "^ADMIN_API_KEY=" .env; then
        sed -i 's/^ADMIN_API_KEY=.*/ADMIN_API_KEY=Benalan.1/' .env
        echo -e "${GREEN}✓ ADMIN_API_KEY güncellendi${NC}"
    else
        echo "ADMIN_API_KEY=Benalan.1" >> .env
        echo -e "${GREEN}✓ ADMIN_API_KEY eklendi${NC}"
    fi
    
    echo ""
    echo "Yeni .env değerleri:"
    grep "ADMIN_EMAIL\|ADMIN_API_KEY" .env
else
    echo -e "${RED}✗ .env dosyası bulunamadı!${NC}"
    exit 1
fi
echo ""

# 3. Database admin kullanıcısını güncelle
echo -e "${YELLOW}[3/7] Database admin kullanıcısı güncelleniyor...${NC}"
cd /opt/faceseek/backend

python3 << 'EOF'
import sys
sys.path.insert(0, '/opt/faceseek/backend')

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # Eski admin kullanıcılarını sil
    old_admins = db.query(User).filter(
        User.email.in_(['admin@faceseek.io', 'admin@example.com'])
    ).all()
    
    for old_admin in old_admins:
        print(f"  Siliniyor: {old_admin.email}")
        db.delete(old_admin)
    
    # Yeni admin kullanıcısını oluştur/güncelle
    admin = db.query(User).filter(User.email == 'admin@face-seek.com').first()
    
    if admin:
        print("  Admin güncelleniyor...")
        admin.hashed_password = get_password_hash('Benalan.1')
        admin.role = 'admin'
        admin.tier = 'unlimited'
        admin.credits = 999999
    else:
        print("  Yeni admin oluşturuluyor...")
        admin = User(
            email='admin@face-seek.com',
            username='Admin',
            hashed_password=get_password_hash('Benalan.1'),
            role='admin',
            tier='unlimited',
            credits=999999,
            referral_code='ADMIN001'
        )
        db.add(admin)
    
    db.commit()
    print("  ✓ Başarılı!")
    print(f"  Email: admin@face-seek.com")
    print(f"  Password: Benalan.1")
    
except Exception as e:
    print(f"  ✗ Hata: {e}")
    db.rollback()
    sys.exit(1)
finally:
    db.close()
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database güncellendi${NC}"
else
    echo -e "${RED}✗ Database güncellenemedi!${NC}"
    exit 1
fi
echo ""

# 4. Backend restart
echo -e "${YELLOW}[4/7] Backend servisi yeniden başlatılıyor...${NC}"
systemctl restart faceseek-backend
sleep 3

if systemctl is-active --quiet faceseek-backend; then
    echo -e "${GREEN}✓ Backend servisi çalışıyor${NC}"
else
    echo -e "${RED}✗ Backend servisi başlatılamadı!${NC}"
    systemctl status faceseek-backend --no-pager -n 10
    exit 1
fi
echo ""

# 5. Frontend build
echo -e "${YELLOW}[5/7] Frontend build ediliyor...${NC}"
cd /opt/faceseek/frontend

# Eski build'i temizle
rm -rf .next
rm -rf node_modules/.cache

# Build yap
npm run build 2>&1 | tee /tmp/frontend-build.log

# Build çıktısında admin route'larını kontrol et
echo ""
echo "Admin route'ları:"
grep -i "admin" /tmp/frontend-build.log | grep -E "├|└" || echo "  (Admin route bulunamadı)"
echo ""

# Admin route'larının doğru formatını kontrol et
if grep -q "\[locale\]/admin" /tmp/frontend-build.log; then
    echo -e "${GREEN}✓ Admin route'ları DOĞRU formatta: /[locale]/admin/*${NC}"
else
    echo -e "${RED}✗ UYARI: Admin route'ları yanlış formatta!${NC}"
    echo -e "${YELLOW}Build log: /tmp/frontend-build.log${NC}"
fi
echo ""

# 6. Frontend restart
echo -e "${YELLOW}[6/7] Frontend servisi yeniden başlatılıyor...${NC}"
systemctl restart faceseek-frontend
sleep 3

if systemctl is-active --quiet faceseek-frontend; then
    echo -e "${GREEN}✓ Frontend servisi çalışıyor${NC}"
else
    echo -e "${RED}✗ Frontend servisi başlatılamadı!${NC}"
    systemctl status faceseek-frontend --no-pager -n 10
    exit 1
fi
echo ""

# 7. Test
echo -e "${YELLOW}[7/7] Test ediliyor...${NC}"
echo ""

# Backend API test
echo "Backend API test..."
BACKEND_RESPONSE=$(curl -s --unix-socket /run/faceseek/backend.sock \
    http://localhost/api/admin/ping \
    -H 'x-admin-key: Benalan.1' \
    -H 'x-admin-email: admin@face-seek.com')

if echo "$BACKEND_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ Backend API: OK${NC}"
    echo "  Response: $BACKEND_RESPONSE"
else
    echo -e "${RED}✗ Backend API: FAILED${NC}"
    echo "  Response: $BACKEND_RESPONSE"
fi
echo ""

# Frontend URL testleri
echo "Frontend URL testleri..."

# Test 1: /tr/admin/login
STATUS_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin/login)
if [ "$STATUS_LOGIN" = "200" ]; then
    echo -e "${GREEN}✓ /tr/admin/login: $STATUS_LOGIN OK${NC}"
else
    echo -e "${RED}✗ /tr/admin/login: $STATUS_LOGIN (Beklenen: 200)${NC}"
fi

# Test 2: /tr/admin
STATUS_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin)
if [ "$STATUS_ADMIN" = "200" ] || [ "$STATUS_ADMIN" = "302" ] || [ "$STATUS_ADMIN" = "307" ]; then
    echo -e "${GREEN}✓ /tr/admin: $STATUS_ADMIN OK${NC}"
else
    echo -e "${RED}✗ /tr/admin: $STATUS_ADMIN (Beklenen: 200/302/307)${NC}"
fi

# Test 3: /en/admin/login
STATUS_EN_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin/login)
if [ "$STATUS_EN_LOGIN" = "200" ]; then
    echo -e "${GREEN}✓ /en/admin/login: $STATUS_EN_LOGIN OK${NC}"
else
    echo -e "${RED}✗ /en/admin/login: $STATUS_EN_LOGIN (Beklenen: 200)${NC}"
fi

# Test 4: /en/admin
STATUS_EN_ADMIN=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin)
if [ "$STATUS_EN_ADMIN" = "200" ] || [ "$STATUS_EN_ADMIN" = "302" ] || [ "$STATUS_EN_ADMIN" = "307" ]; then
    echo -e "${GREEN}✓ /en/admin: $STATUS_EN_ADMIN OK${NC}"
else
    echo -e "${RED}✗ /en/admin: $STATUS_EN_ADMIN (Beklenen: 200/302/307)${NC}"
fi

echo ""
echo "=========================================="
echo "Deployment Tamamlandı!"
echo "=========================================="
echo ""
echo "🔐 Yeni Admin Bilgileri:"
echo "  URL: https://face-seek.com/tr/admin/login"
echo "  Email: admin@face-seek.com"
echo "  API Key: Benalan.1"
echo ""
echo "📋 Test Sonuçları:"
echo "  Backend API: $(echo "$BACKEND_RESPONSE" | grep -q '"status":"ok"' && echo "✓ OK" || echo "✗ FAILED")"
echo "  /tr/admin/login: $STATUS_LOGIN"
echo "  /tr/admin: $STATUS_ADMIN"
echo "  /en/admin/login: $STATUS_EN_LOGIN"
echo "  /en/admin: $STATUS_EN_ADMIN"
echo ""
echo "📝 Loglar:"
echo "  Build log: /tmp/frontend-build.log"
echo "  Backend log: journalctl -u faceseek-backend -n 50"
echo "  Frontend log: journalctl -u faceseek-frontend -n 50"
echo ""

if [ "$STATUS_ADMIN" = "404" ]; then
    echo -e "${RED}⚠️  UYARI: /tr/admin hala 404 veriyor!${NC}"
    echo ""
    echo "Debug için:"
    echo "  1. Build log'u kontrol et: cat /tmp/frontend-build.log | grep admin"
    echo "  2. Route manifest kontrol et: cat /opt/faceseek/frontend/.next/routes-manifest.json | grep admin"
    echo "  3. Frontend log kontrol et: journalctl -u faceseek-frontend -n 100"
    echo ""
fi
