#!/bin/bash
# Deploy authentication fixes to VPS

set -e

echo "🚀 Deploying Authentication Fixes to VPS"
echo "=========================================="
echo ""

cd /opt/faceseek

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo ""
echo "🔧 Updating backend environment..."
# Check if CORS_ORIGINS is set correctly
if grep -q "CORS_ORIGINS.*face-seek.com" backend/.env; then
    echo "✅ CORS_ORIGINS already includes production domain"
else
    echo "⚠️  Adding production domain to CORS_ORIGINS..."
    # Backup existing .env
    cp backend/.env backend/.env.backup
    
    # Update or add CORS_ORIGINS
    if grep -q "^CORS_ORIGINS=" backend/.env; then
        sed -i 's|^CORS_ORIGINS=.*|CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://face-seek.com,https://www.face-seek.com|' backend/.env
    else
        echo "CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://face-seek.com,https://www.face-seek.com" >> backend/.env
    fi
    echo "✅ CORS_ORIGINS updated"
fi

echo ""
echo "🔧 Updating frontend environment..."
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://unix:/run/faceseek/backend.sock
NEXT_PUBLIC_SITE_URL=https://face-seek.com
EOF
echo "✅ Frontend environment updated"

echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --production 2>&1 | tail -n 5

echo ""
echo "🏗️  Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "✅ Frontend built successfully"

echo ""
echo "🔄 Restarting services..."
cd ..
systemctl restart faceseek-backend
sleep 3
systemctl restart faceseek-frontend
sleep 3
systemctl reload nginx

echo ""
echo "🔍 Checking service status..."
if systemctl is-active --quiet faceseek-backend; then
    echo "✅ Backend: Running"
else
    echo "❌ Backend: Failed"
    journalctl -u faceseek-backend -n 10
    exit 1
fi

if systemctl is-active --quiet faceseek-frontend; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Failed"
    journalctl -u faceseek-frontend -n 10
    exit 1
fi

if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Failed"
    exit 1
fi

echo ""
echo "🧪 Testing API endpoints..."

# Test 1: Health check via Unix socket
echo "1. Testing backend health (Unix socket)..."
if curl --unix-socket /run/faceseek/backend.sock http://localhost/api/health -s | grep -q "healthy"; then
    echo "   ✅ Backend health check passed"
else
    echo "   ❌ Backend health check failed"
fi

# Test 2: Health check via nginx
echo "2. Testing backend health (via nginx)..."
if curl -k https://face-seek.com/api/health -s | grep -q "healthy"; then
    echo "   ✅ Nginx proxy working"
else
    echo "   ❌ Nginx proxy failed"
fi

# Test 3: CORS headers
echo "3. Testing CORS headers..."
CORS_HEADER=$(curl -k -H "Origin: https://face-seek.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS \
  https://face-seek.com/api/auth/register \
  -s -I | grep -i "access-control-allow-origin")

if echo "$CORS_HEADER" | grep -q "face-seek.com"; then
    echo "   ✅ CORS headers correct"
else
    echo "   ⚠️  CORS headers may need verification"
    echo "   $CORS_HEADER"
fi

echo ""
echo "=========================================="
echo "✅ Deployment Completed Successfully!"
echo "=========================================="
echo ""
echo "🌐 Site: https://face-seek.com"
echo "📝 Register: https://face-seek.com/register"
echo "🔐 Admin: https://face-seek.com/admin/login"
echo ""
echo "📋 Next Steps:"
echo "  1. Test registration from browser"
echo "  2. Check browser DevTools Network tab"
echo "  3. Verify no 404 or CORS errors"
echo ""
