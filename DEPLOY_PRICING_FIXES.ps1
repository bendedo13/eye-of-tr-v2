# Pricing and Credit Fixes Deployment Script (PowerShell)
# This script deploys the pricing updates and AlanSearch credit fix

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Pricing and Credit Fixes Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\app\main.py")) {
    Write-Host "Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Backing up current code..." -ForegroundColor Yellow
$backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item "backend\app\api\pricing.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "backend\app\api\auth.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "backend\app\api\alan_search.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "backend\app\api\admin.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "backend\app\models\pricing.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "backend\app\services\pricing_service.py" "$backupDir\" -ErrorAction SilentlyContinue
Copy-Item "frontend\app\[locale]\admin\pricing\page.tsx" "$backupDir\" -ErrorAction SilentlyContinue
Write-Host "✓ Backup created in $backupDir" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Checking Python syntax..." -ForegroundColor Yellow
python -m py_compile backend\app\api\pricing.py
python -m py_compile backend\app\api\auth.py
python -m py_compile backend\app\api\alan_search.py
python -m py_compile backend\app\api\admin.py
python -m py_compile backend\app\models\pricing.py
python -m py_compile backend\app\services\pricing_service.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Python syntax check failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Python syntax check passed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend build failed" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Frontend build successful" -ForegroundColor Green
Set-Location ..
Write-Host ""

Write-Host "Step 4: Committing changes to git..." -ForegroundColor Yellow
git add .
git commit -m "feat: Update pricing values and fix AlanSearch credit initialization

- Update basic_monthly: 299 TRY / 14.99 USD
- Update credit_pack: 59.99 TRY / 2.99 USD
- Add database-backed pricing management with admin UI
- Fix AlanSearch credit initialization bug for new users
- Add admin pricing management page
- Implement PricingService with database overrides
- Add admin API endpoints for pricing management"
Write-Host "✓ Changes committed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Pushing to repository..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Git push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Pushed to repository" -ForegroundColor Green
Write-Host ""

Write-Host "Step 6: Deploying to VPS..." -ForegroundColor Yellow
Write-Host "Connecting to VPS and deploying..."

$sshScript = @"
cd /root/eye-of-tr-v2

echo 'Pulling latest changes...'
git pull origin main

echo 'Running database migrations...'
cd backend
source venv/bin/activate
alembic upgrade head

echo 'Restarting backend service...'
sudo systemctl restart eye-backend

echo 'Building and restarting frontend...'
cd ../frontend
npm run build
sudo systemctl restart eye-frontend

echo 'Checking service status...'
sudo systemctl status eye-backend --no-pager | head -10
sudo systemctl status eye-frontend --no-pager | head -10

echo 'Deployment complete!'
"@

ssh root@95.214.27.46 $sshScript

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ VPS deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ VPS deployment successful" -ForegroundColor Green
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test the pricing page: https://face-seek.com/tr/pricing"
Write-Host "2. Test admin pricing management: https://face-seek.com/tr/admin/pricing"
Write-Host "3. Register a new user and test AlanSearch credit"
Write-Host "4. Verify pricing values are correct (299 TRY / 14.99 USD for monthly)"
Write-Host ""
Write-Host "Rollback instructions (if needed):"
Write-Host "1. cd $backupDir"
Write-Host "2. Copy files back to their original locations"
Write-Host "3. Run: git reset --hard HEAD~1"
Write-Host "4. Run: git push origin main --force"
Write-Host "5. SSH to VPS and run: cd /root/eye-of-tr-v2 && git pull && sudo systemctl restart eye-backend eye-frontend"
