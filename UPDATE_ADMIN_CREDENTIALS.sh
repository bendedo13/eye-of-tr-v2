#!/bin/bash

# Admin Credentials Update Script
# Yeni Bilgiler:
# Email: admin@face-seek.com
# Password/API Key: Benalan.1

set -e

echo "=========================================="
echo "Admin Credentials Update"
echo "=========================================="
echo ""
echo "Yeni Admin Bilgileri:"
echo "  Email: admin@face-seek.com"
echo "  API Key: Benalan.1"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Backend .env dosyasını güncelle
echo -e "${YELLOW}[1/5] Backend .env dosyası güncelleniyor...${NC}"
cd /opt/faceseek/backend

# .env dosyasını backup al
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Backup oluşturuldu${NC}"
fi

# ADMIN_EMAIL ve ADMIN_API_KEY'i güncelle
if [ -f ".env" ]; then
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
else
    echo -e "${RED}✗ .env dosyası bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen .env.example'dan kopyalayın:${NC}"
    echo "cp .env.example .env"
    exit 1
fi
echo ""

# 2. Database'de admin kullanıcısını güncelle
echo -e "${YELLOW}[2/5] Database'de admin kullanıcısı güncelleniyor...${NC}"
cd /opt/faceseek/backend

# Python script ile admin kullanıcısını güncelle
python3 << 'PYTHON_SCRIPT'
import sys
sys.path.insert(0, '/opt/faceseek/backend')

from app.db.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()

try:
    # Eski admin kullanıcılarını bul ve sil
    old_admins = db.query(User).filter(
        User.email.in_(['admin@faceseek.io', 'admin@example.com'])
    ).all()
    
    for old_admin in old_admins:
        print(f"Eski admin siliniyor: {old_admin.email}")
        db.delete(old_admin)
    
    # Yeni admin kullanıcısını kontrol et
    admin = db.query(User).filter(User.email == 'admin@face-seek.com').first()
    
    if admin:
        print(f"Admin mevcut, güncelleniyor: {admin.email}")
        admin.hashed_password = get_password_hash('Benalan.1')
        admin.role = 'admin'
        admin.tier = 'unlimited'
        admin.credits = 999999
    else:
        print("Yeni admin oluşturuluyor...")
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
    print("✓ Admin kullanıcısı başarıyla güncellendi")
    print(f"  Email: admin@face-seek.com")
    print(f"  Password: Benalan.1")
    
except Exception as e:
    print(f"✗ Hata: {e}")
    db.rollback()
    sys.exit(1)
finally:
    db.close()
PYTHON_SCRIPT

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database güncellendi${NC}"
else
    echo -e "${RED}✗ Database güncellenemedi!${NC}"
    exit 1
fi
echo ""

# 3. Backend servisini restart et
echo -e "${YELLOW}[3/5] Backend servisi yeniden başlatılıyor...${NC}"
systemctl restart faceseek-backend
sleep 2
if systemctl is-active --quiet faceseek-backend; then
    echo -e "${GREEN}✓ Backend servisi çalışıyor${NC}"
else
    echo -e "${RED}✗ Backend servisi başlatılamadı!${NC}"
    systemctl status faceseek-backend --no-pager -n 10
    exit 1
fi
echo ""

# 4. Frontend'i güncelle (git pull)
echo -e "${YELLOW}[4/5] Frontend güncelleniyor...${NC}"
cd /opt/faceseek/frontend

# Git güncellemelerini çek
git fetch origin
git pull origin main

# Build yap
rm -rf .next
npm run build

# Frontend servisini restart et
systemctl restart faceseek-frontend
sleep 2

if systemctl is-active --quiet faceseek-frontend; then
    echo -e "${GREEN}✓ Frontend servisi çalışıyor${NC}"
else
    echo -e "${RED}✗ Frontend servisi başlatılamadı!${NC}"
    systemctl status faceseek-frontend --no-pager -n 10
    exit 1
fi
echo ""

# 5. Test et
echo -e "${YELLOW}[5/5] Admin credentials test ediliyor...${NC}"

# Backend API test
echo "Backend API test..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    --unix-socket /run/faceseek/backend.sock \
    http://localhost/api/admin/ping \
    -H 'x-admin-key: Benalan.1' \
    -H 'x-admin-email: admin@face-seek.com')

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Backend API test başarılı (200 OK)${NC}"
else
    echo -e "${RED}✗ Backend API test başarısız ($RESPONSE)${NC}"
fi

# Frontend test
echo "Frontend test..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin/login)

if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ Frontend test başarılı (200 OK)${NC}"
else
    echo -e "${RED}✗ Frontend test başarısız ($RESPONSE)${NC}"
fi

echo ""
echo "=========================================="
echo "Admin Credentials Güncelleme Tamamlandı!"
echo "=========================================="
echo ""
echo "Yeni Giriş Bilgileri:"
echo "  URL: https://face-seek.com/tr/admin/login"
echo "  Email: admin@face-seek.com"
echo "  API Key: Benalan.1"
echo ""
echo "Test için:"
echo "  1. Tarayıcıda https://face-seek.com/tr/admin/login aç"
echo "  2. Email: admin@face-seek.com"
echo "  3. API Key: Benalan.1"
echo "  4. OTURUM AÇ butonuna tıkla"
echo ""
