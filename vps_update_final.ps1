# VPS Final Update Script - Deploy Authentication Fixes
$VPS_IP = "46.4.123.77"
$VPS_USER = "root"
$VPS_PASS = "mvdBIH368"

Write-Host "🚀 Deploying Authentication Fixes to VPS..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Create SSH commands
$commands = @"
set -e
cd /opt/faceseek || exit 1

echo '📥 Pulling latest changes from GitHub...'
git pull origin main

echo '🔧 Updating frontend environment...'
cat > frontend/.env.local << 'EOF'
# Production Environment Variables
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://unix:/run/faceseek/backend.sock
NEXT_PUBLIC_SITE_URL=https://face-seek.com
EOF

echo '📦 Installing frontend dependencies...'
cd frontend
npm install --production 2>&1 | tail -n 5

echo '🏗️  Building frontend...'
npm run build

if [ \$? -ne 0 ]; then
    echo '❌ Frontend build failed!'
    exit 1
fi

echo '✅ Frontend built successfully'

echo '🔄 Restarting services...'
systemctl restart faceseek-backend
sleep 2
systemctl restart faceseek-frontend
sleep 2
systemctl reload nginx

echo ''
echo '🔍 Checking service status...'
systemctl is-active faceseek-backend && echo '✅ Backend: Running' || echo '❌ Backend: Failed'
systemctl is-active faceseek-frontend && echo '✅ Frontend: Running' || echo '❌ Frontend: Failed'
systemctl is-active nginx && echo '✅ Nginx: Running' || echo '❌ Nginx: Failed'

echo ''
echo '🧪 Testing backend API...'
curl --unix-socket /run/faceseek/backend.sock http://localhost/api/admin/ping -H 'x-admin-key: faceseek-admin-2026' -s || echo 'API test failed'

echo ''
echo '✅ Deployment completed!'
echo ''
echo '🌐 Site: https://face-seek.com'
echo '🔐 Admin: https://face-seek.com/admin/login'
echo '   Email: admin@faceseek.io'
echo '   API Key: faceseek-admin-2026'
echo ''
"@

# Execute via SSH
$sshCommand = "sshpass -p '$VPS_PASS' ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP"
$commands | & $sshCommand "bash -s"

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "✅ VPS Update Completed!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test the following:" -ForegroundColor Yellow
Write-Host "  1. Admin Login: https://face-seek.com/admin/login" -ForegroundColor White
Write-Host "     Email: admin@faceseek.io" -ForegroundColor White
Write-Host "     API Key: faceseek-admin-2026" -ForegroundColor White
Write-Host ""
Write-Host "  2. User Registration: https://face-seek.com/register" -ForegroundColor White
Write-Host ""
Write-Host "  3. User Login: https://face-seek.com/login" -ForegroundColor White
Write-Host ""
