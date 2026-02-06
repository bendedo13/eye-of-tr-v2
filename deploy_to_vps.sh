#!/bin/bash
set -e

cd /opt/faceseek
git pull origin main

cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://unix:/run/faceseek/backend.sock
NEXT_PUBLIC_SITE_URL=https://face-seek.com
ENVEOF

cd frontend
npm install --production
npm run build
cd ..

systemctl restart faceseek-backend
sleep 2
systemctl restart faceseek-frontend
sleep 2
systemctl reload nginx

echo ""
echo "=== SERVICE STATUS ==="
systemctl is-active faceseek-backend && echo "Backend: OK" || echo "Backend: FAILED"
systemctl is-active faceseek-frontend && echo "Frontend: OK" || echo "Frontend: FAILED"
systemctl is-active nginx && echo "Nginx: OK" || echo "Nginx: FAILED"

echo ""
echo "=== API TEST ==="
curl --unix-socket /run/faceseek/backend.sock http://localhost/api/admin/ping -H 'x-admin-key: faceseek-admin-2026' -s

echo ""
echo ""
echo "DEPLOYMENT COMPLETE!"
echo "Site: https://face-seek.com"
echo "Admin: https://face-seek.com/admin/login"
echo "  Email: admin@faceseek.io"
echo "  API Key: faceseek-admin-2026"
