# Eye of Truth - Quick Deployment Update Script
# For updating existing deployment with latest code
# Usage: .\deploy-update.ps1

$ErrorActionPreference = "Stop"

# Color output
function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

function Write-Error-Custom {
    Write-Host $args -ForegroundColor Red
}

# Set project path
$projectPath = "C:\projects\eye-of-tr-v2"

if (-not (Test-Path $projectPath)) {
    Write-Error-Custom "❌ Project not found at $projectPath"
    Write-Error-Custom "Run deploy-to-server.ps1 first for initial setup"
    exit 1
}

cd $projectPath

Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "Eye of Truth - Quick Update Deployment"
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info ""

# Step 1: Pull latest code
Write-Info "Step 1: Pulling latest code from GitHub..."
git fetch origin main
git reset --hard origin/main
git pull origin main
Write-Success "✅ Code updated"

# Step 2: Rebuild and restart
Write-Info "Step 2: Rebuilding containers with latest code..."
docker-compose down --remove-orphans
docker-compose build --no-cache backend frontend
docker-compose up -d

Write-Info "Step 3: Waiting for services to start (20 seconds)..."
Start-Sleep -Seconds 20

# Step 3: Verify
Write-Info "Step 4: Verifying deployment..."
docker-compose ps
Write-Info ""

# Health check
Write-Info "Checking backend health..."
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($health.StatusCode -eq 200) {
        Write-Success "✅ Backend API healthy"
    }
} catch {
    Write-Info "⚠️  Backend still initializing..."
}

Write-Success "✅ Update deployment complete!"
Write-Info ""
Write-Info "View logs: docker-compose logs -f"
Write-Info "Check status: docker-compose ps"
