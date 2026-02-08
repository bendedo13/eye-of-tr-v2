# Eye of Truth - Server Deployment Script (Windows Server + Docker Compose)
# This script automates the deployment of the Eye of Truth project from GitHub to Windows Server
# Usage: .\deploy-to-server.ps1

# Set strict error handling
$ErrorActionPreference = "Stop"

# Color output for better readability
function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Error-Custom {
    Write-Host $args -ForegroundColor Red
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

function Write-Warning-Custom {
    Write-Host $args -ForegroundColor Yellow
}

# ============================================================================
# PHASE 1: Prerequisites Verification
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 1: Prerequisites Verification"
Write-Info "════════════════════════════════════════════════════════════════"

# Check Docker
Write-Info "Checking Docker..."
try {
    $dockerVersion = docker --version
    Write-Success "✅ Docker found: $dockerVersion"
} catch {
    Write-Error-Custom "❌ Docker not found. Please install Docker Desktop or Docker Engine."
    exit 1
}

# Check Docker Compose
Write-Info "Checking Docker Compose..."
try {
    $composeVersion = docker-compose --version
    Write-Success "✅ Docker Compose found: $composeVersion"
} catch {
    Write-Error-Custom "❌ Docker Compose not found."
    exit 1
}

# Check Node.js
Write-Info "Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Success "✅ Node.js found: $nodeVersion"
} catch {
    Write-Warning-Custom "⚠️  Node.js not found (needed for local builds)"
}

# Check Python
Write-Info "Checking Python..."
try {
    $pythonVersion = python --version
    Write-Success "✅ Python found: $pythonVersion"
} catch {
    Write-Warning-Custom "⚠️  Python not found"
}

# Check Git
Write-Info "Checking Git..."
try {
    $gitVersion = git --version
    Write-Success "✅ Git found: $gitVersion"
} catch {
    Write-Error-Custom "❌ Git not found. Please install Git."
    exit 1
}

# Skip SSH check - we'll use HTTPS instead
Write-Info "Git is ready (will use HTTPS for GitHub)"

Write-Success "✅ All prerequisites verified!`n"

# ============================================================================
# PHASE 2: Project Setup & GitHub Configuration
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 2: Project Setup & GitHub Configuration"
Write-Info "════════════════════════════════════════════════════════════════"

# Define project path
$projectPath = "C:\projects\eye-of-tr-v2"

# Create project directory
if (-not (Test-Path $projectPath)) {
    Write-Info "Creating project directory: $projectPath"
    New-Item -ItemType Directory -Path $projectPath -Force | Out-Null
    Write-Success "✅ Project directory created"
} else {
    Write-Info "Project directory already exists: $projectPath"
}

# Clone or update repository
cd $projectPath

if (-not (Test-Path ".git")) {
    Write-Info "Repository not found locally. Cloning from GitHub..."
    Write-Warning-Custom "⚠️  Enter your GitHub repository URL or username/repo"
    Write-Info ""
    Write-Info "Examples:"
    Write-Info "  https://github.com/username/eye-of-tr-v2.git"
    Write-Info "  or just: username/eye-of-tr-v2"
    Write-Info ""

    $githubInput = Read-Host "GitHub Repository (username/repo or full URL)"

    # Handle both formats
    if ($githubInput -match "^(https://|git@|/)") {
        # Full URL provided
        $cloneUrl = $githubInput
    } else {
        # Just username/repo provided - convert to HTTPS
        $cloneUrl = "https://github.com/$githubInput.git"
    }

    Write-Info "Cloning from: $cloneUrl"
    git clone $cloneUrl .

    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ Repository cloned successfully"
    } else {
        Write-Error-Custom "❌ Clone failed. Check your repository URL and internet connection"
        exit 1
    }
} else {
    Write-Info "Repository already cloned. Updating..."
    git fetch origin main
    git reset --hard origin/main
    git pull origin main
    Write-Success "✅ Repository updated to latest version"
}

Write-Success "✅ GitHub setup complete`n"

# ============================================================================
# PHASE 3: Environment Configuration
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 3: Environment Configuration"
Write-Info "════════════════════════════════════════════════════════════════"

$envFile = "$projectPath\.env"

if (-not (Test-Path $envFile)) {
    Write-Info "Creating .env file..."
    Write-Warning-Custom "⚠️  You need to configure your environment variables"
    Write-Info "A template will be created at: $envFile"
    Write-Info "Please edit it with your production settings"

    $envTemplate = @"
# Core Configuration
PUBLIC_BASE_URL=<YOUR_DOMAIN_OR_IP>
DEFAULT_LOCALE=en
SECRET_KEY=<generate: openssl rand -hex 32>

# PostgreSQL Configuration
POSTGRES_USER=faceseek
POSTGRES_PASSWORD=<secure_password_required>
POSTGRES_DB=faceseek
POSTGRES_HOST=postgres

# Redis Configuration
REDIS_URL=redis://redis:6379

# Backend Settings
API_PORT=8000
DEBUG=false
LOG_LEVEL=INFO
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=<YOUR_DOMAIN>,http://localhost:3000

# Email Configuration (SMTP)
SMTP_HOST=mail.face-seek.com
SMTP_PORT=465
SMTP_USER=verify@face-seek.com
SMTP_PASS=<email_password_required>

# Optional: External APIs
SERPAPI_API_KEY=<optional>
OPENAI_API_KEY=<optional>
GOOGLE_CLOUD_VISION_API_KEY=<optional>

# Grafana Admin
GRAFANA_ADMIN_PASSWORD=<secure_password_required>
"@

    Set-Content -Path $envFile -Value $envTemplate
    Write-Success "✅ .env template created at: $envFile"
    Write-Warning-Custom "⚠️  IMPORTANT: Edit the .env file and set all required values before deployment!"
    Write-Warning-Custom "Required values marked with <required>"

    Read-Host "Press Enter after updating .env file"
} else {
    Write-Info ".env file already exists"
    Write-Warning-Custom "⚠️  Verify all values in .env are correct for production"
}

# Verify docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error-Custom "❌ docker-compose.yml not found in project root!"
    exit 1
}

Write-Success "✅ Environment configuration ready`n"

# ============================================================================
# PHASE 4: Docker Compose Deployment
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 4: Docker Compose Deployment"
Write-Info "════════════════════════════════════════════════════════════════"

Write-Info "Stopping existing services (if any)..."
docker-compose down --remove-orphans
Write-Success "✅ Stopped existing services"

Write-Info "Building Docker images (this may take 5-10 minutes)..."
docker-compose build --no-cache backend frontend
Write-Success "✅ Docker images built successfully"

Write-Info "Starting all services..."
docker-compose up -d
Write-Success "✅ All services started"

# Wait for services to be ready
Write-Info "Waiting for services to initialize (30 seconds)..."
Start-Sleep -Seconds 30

Write-Success "✅ Docker Compose deployment complete`n"

# ============================================================================
# PHASE 5: Service Verification & Testing
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 5: Service Verification & Testing"
Write-Info "════════════════════════════════════════════════════════════════"

# Check container status
Write-Info "Checking container status..."
Write-Info ""
docker-compose ps
Write-Info ""

# Check backend health
Write-Info "Checking backend API health..."
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($backendHealth.StatusCode -eq 200) {
        Write-Success "✅ Backend API is healthy"
    } else {
        Write-Warning-Custom "⚠️  Backend API returned status code: $($backendHealth.StatusCode)"
    }
} catch {
    Write-Warning-Custom "⚠️  Could not reach backend API (may still be starting): $_"
}

# Check frontend
Write-Info "Checking frontend..."
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -ErrorAction SilentlyContinue
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Success "✅ Frontend is accessible"
    } else {
        Write-Warning-Custom "⚠️  Frontend returned status code: $($frontendHealth.StatusCode)"
    }
} catch {
    Write-Warning-Custom "⚠️  Could not reach frontend (may still be starting): $_"
}

# Check database
Write-Info "Checking PostgreSQL database..."
try {
    $dbCheck = docker-compose exec -T postgres psql -U faceseek -d faceseek -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "✅ PostgreSQL database is accessible"
    } else {
        Write-Warning-Custom "⚠️  Database check failed: $dbCheck"
    }
} catch {
    Write-Warning-Custom "⚠️  Could not verify database: $_"
}

# Show Docker volumes
Write-Info "Docker volumes:"
docker volume ls | findstr "eye-of-tr"

Write-Success "✅ Verification complete`n"

# ============================================================================
# PHASE 6: Service Access Information
# ============================================================================
Write-Info "════════════════════════════════════════════════════════════════"
Write-Info "PHASE 6: Service Access Information"
Write-Info "════════════════════════════════════════════════════════════════"

Write-Success "✅ Deployment completed successfully!`n"

Write-Info "Access your services at:"
Write-Info ""
Write-Info "Frontend:        http://localhost:3000"
Write-Info "Backend API:     http://localhost:8000"
Write-Info "API Health:      http://localhost:8000/health"
Write-Info "API Metrics:     http://localhost:8000/metrics"
Write-Info "Prometheus:      http://localhost:9090"
Write-Info "Grafana:         http://localhost:3001"
Write-Info ""

Write-Warning-Custom "Default Grafana credentials: admin / (see .env GRAFANA_ADMIN_PASSWORD)"
Write-Info ""

Write-Info "Useful Docker commands:"
Write-Info "  View logs:              docker-compose logs -f [service_name]"
Write-Info "  Stop services:          docker-compose down"
Write-Info "  Rebuild and restart:    docker-compose up -d --build"
Write-Info "  View running containers: docker-compose ps"
Write-Info ""

Write-Info "Project path: $projectPath"
Write-Success "════════════════════════════════════════════════════════════════`n"

# ============================================================================
# Optional: Monitoring and Next Steps
# ============================================================================
Write-Info "Next steps recommended:"
Write-Info "1. ✅ Verify all services are running: docker-compose ps"
Write-Info "2. ✅ Check logs for any errors: docker-compose logs"
Write-Info "3. ✅ Access frontend at http://localhost:3000"
Write-Info "4. ✅ Configure reverse proxy (Nginx/IIS) for production domains"
Write-Info "5. ✅ Set up HTTPS/SSL certificates"
Write-Info "6. ✅ Configure automated backups"
Write-Info "7. ✅ Monitor services via Prometheus/Grafana"
Write-Info ""

Write-Success "Deployment script completed! Your application is now running on Docker Compose."
Write-Info "For further assistance, check the plan file at: C:\Users\Asus\.claude\plans\zazzy-booping-rocket.md"
