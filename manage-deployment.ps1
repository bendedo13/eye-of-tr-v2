# Eye of Truth - Deployment Management Utility Script
# For routine operations: start, stop, view logs, check status
# Usage: .\manage-deployment.ps1 [start|stop|status|logs|restart|backup]

param(
    [string]$Action = "help"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success {
    Write-Host $args -ForegroundColor Green
}

function Write-Info {
    Write-Host $args -ForegroundColor Cyan
}

function Write-Error-Custom {
    Write-Host $args -ForegroundColor Red
}

function Write-Warning-Custom {
    Write-Host $args -ForegroundColor Yellow
}

$projectPath = "C:\projects\eye-of-tr-v2"

if (-not (Test-Path $projectPath)) {
    Write-Error-Custom "❌ Project not found at $projectPath"
    exit 1
}

cd $projectPath

# Validate docker-compose exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error-Custom "❌ docker-compose.yml not found!"
    exit 1
}

Write-Info "Eye of Truth - Deployment Management"
Write-Info "======================================"
Write-Info ""

switch ($Action.ToLower()) {
    "start" {
        Write-Info "Starting all services..."
        docker-compose up -d
        Write-Success "✅ Services started"
        docker-compose ps
    }

    "stop" {
        Write-Warning-Custom "Stopping all services..."
        docker-compose down
        Write-Success "✅ Services stopped"
    }

    "status" {
        Write-Info "Service Status:"
        Write-Info ""
        docker-compose ps
    }

    "logs" {
        $service = $args[1]
        if ($service) {
            Write-Info "Showing logs for: $service"
            docker-compose logs -f $service
        } else {
            Write-Info "Showing logs for all services (Ctrl+C to exit)..."
            docker-compose logs -f
        }
    }

    "logs-backend" {
        Write-Info "Backend logs (last 50 lines):"
        docker-compose logs backend --tail=50
    }

    "logs-frontend" {
        Write-Info "Frontend logs (last 50 lines):"
        docker-compose logs frontend --tail=50
    }

    "restart" {
        $service = $args[1]
        if ($service) {
            Write-Info "Restarting $service..."
            docker-compose restart $service
            Write-Success "✅ $service restarted"
        } else {
            Write-Info "Restarting all services..."
            docker-compose restart
            Write-Success "✅ All services restarted"
        }
    }

    "rebuild" {
        Write-Info "Rebuilding containers..."
        docker-compose build --no-cache
        Write-Info "Restarting services..."
        docker-compose up -d
        Write-Success "✅ Rebuild and restart complete"
    }

    "health" {
        Write-Info "Checking service health..."
        Write-Info ""

        # Backend
        Write-Info "Backend API:"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            Write-Success "  ✅ http://localhost:8000/health - Status: $($response.StatusCode)"
        } catch {
            Write-Error-Custom "  ❌ Backend unreachable"
        }

        # Frontend
        Write-Info "Frontend:"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            Write-Success "  ✅ http://localhost:3000 - Status: $($response.StatusCode)"
        } catch {
            Write-Error-Custom "  ❌ Frontend unreachable"
        }

        # Prometheus
        Write-Info "Prometheus:"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9090/-/healthy" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            Write-Success "  ✅ http://localhost:9090 - Status: $($response.StatusCode)"
        } catch {
            Write-Error-Custom "  ❌ Prometheus unreachable"
        }

        # Grafana
        Write-Info "Grafana:"
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            Write-Success "  ✅ http://localhost:3001 - Status: $($response.StatusCode)"
        } catch {
            Write-Error-Custom "  ❌ Grafana unreachable"
        }
    }

    "backup" {
        Write-Info "Backing up PostgreSQL database..."
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $backupDir = "C:\backups"

        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        }

        $backupFile = "$backupDir\eye-of-truth-backup-$timestamp.sql"

        Write-Info "Backup location: $backupFile"
        docker-compose exec -T postgres pg_dump -U faceseek -d faceseek > $backupFile

        Write-Success "✅ Database backup complete"
        Write-Info "Backup file size: $((Get-Item $backupFile).Length / 1MB) MB"
    }

    "restore" {
        $backupFile = $args[1]

        if (-not $backupFile) {
            Write-Error-Custom "Usage: .\manage-deployment.ps1 restore [backup-file-path]"
            Write-Info ""
            Write-Info "Available backups:"
            Get-ChildItem "C:\backups" -Filter "*backup*.sql" -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Info "  $_"
            }
            exit 1
        }

        if (-not (Test-Path $backupFile)) {
            Write-Error-Custom "Backup file not found: $backupFile"
            exit 1
        }

        Write-Warning-Custom "⚠️  This will REPLACE the current database!"
        $confirm = Read-Host "Continue? (yes/no)"

        if ($confirm -eq "yes") {
            Write-Info "Restoring database from: $backupFile"
            Get-Content $backupFile | docker-compose exec -T postgres psql -U faceseek -d faceseek
            Write-Success "✅ Database restored"
        } else {
            Write-Info "Restore cancelled"
        }
    }

    "clean" {
        Write-Warning-Custom "⚠️  This will remove all containers and volumes!"
        $confirm = Read-Host "Continue? (yes/no)"

        if ($confirm -eq "yes") {
            Write-Info "Removing containers and volumes..."
            docker-compose down -v
            Write-Success "✅ Cleanup complete"
        } else {
            Write-Info "Cleanup cancelled"
        }
    }

    "help" {
        Write-Info "Available commands:"
        Write-Info ""
        Write-Info "  start              - Start all services"
        Write-Info "  stop               - Stop all services"
        Write-Info "  status             - Show running containers"
        Write-Info "  restart [service]  - Restart services (optional: specify service)"
        Write-Info "  rebuild            - Rebuild containers and restart"
        Write-Info "  logs [service]     - View logs (optional: specify service)"
        Write-Info "  logs-backend       - View backend logs (last 50 lines)"
        Write-Info "  logs-frontend      - View frontend logs (last 50 lines)"
        Write-Info "  health             - Check health of all services"
        Write-Info "  backup             - Backup PostgreSQL database"
        Write-Info "  restore [file]     - Restore database from backup"
        Write-Info "  clean              - Remove all containers and volumes"
        Write-Info "  help               - Show this help message"
        Write-Info ""
        Write-Info "Examples:"
        Write-Info "  .\manage-deployment.ps1 start"
        Write-Info "  .\manage-deployment.ps1 logs backend"
        Write-Info "  .\manage-deployment.ps1 restart frontend"
        Write-Info "  .\manage-deployment.ps1 backup"
        Write-Info "  .\manage-deployment.ps1 health"
    }

    default {
        Write-Error-Custom "Unknown action: $Action"
        Write-Info "Run '.\manage-deployment.ps1 help' for available commands"
        exit 1
    }
}
