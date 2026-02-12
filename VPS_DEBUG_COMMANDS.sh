#!/bin/bash

echo "=========================================="
echo "VPS DEBUG - Admin 404 Analizi"
echo "=========================================="
echo ""

echo "1. Mevcut branch ve son commit:"
cd /opt/faceseek/frontend
git branch
git log --oneline -5
echo ""

echo "2. Admin dizinlerini kontrol et:"
ls -la app/ | grep admin
ls -la app/[locale]/ | grep admin
echo ""

echo "3. Admin page.tsx dosyalarını kontrol et:"
echo "--- app/[locale]/admin/page.tsx ---"
ls -la app/[locale]/admin/page.tsx 2>&1
echo ""
echo "--- app/[locale]/admin/login/page.tsx ---"
ls -la app/[locale]/admin/login/page.tsx 2>&1
echo ""

echo "4. Build dizinini kontrol et:"
ls -la .next/server/app/ | grep admin
echo ""
ls -la .next/server/app/[locale]/ | grep admin 2>&1
echo ""

echo "5. Son build çıktısını göster (son 100 satır):"
npm run build 2>&1 | tail -100
echo ""

echo "6. Frontend servis durumu:"
systemctl status faceseek-frontend --no-pager -n 20
echo ""

echo "=========================================="
echo "Debug tamamlandı"
echo "=========================================="
