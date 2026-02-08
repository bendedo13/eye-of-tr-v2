# Eye of Truth - Automated Backup & Maintenance Script
# Run this daily for automated database backups
# Usage: .\backup-scheduler.ps1

param(
    [string]$Action = "daily-backup"
)

$ErrorActionPreference = "Stop"

# Configuration
$projectPath = "C:\projects\eye-of-tr-v2"
$backupDir = "C:\backups"
$logDir = "C:\logs"
$logFile = "$logDir\eye-of-truth-backup.log"
$maxBackupDays = 7  # Keep backups for 7 days

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

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Add-Content -Path $logFile
    Write-Info $Message
}

# Create backup and log directories
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Check if project exists
if (-not (Test-Path $projectPath)) {
    Write-Error-Custom "❌ Project not found at $projectPath"
    exit 1
}

Write-Log "═══════════════════════════════════════════════════════════"
Write-Log "Eye of Truth - Backup & Maintenance Started"

switch ($Action.ToLower()) {
    "daily-backup" {
        Write-Log "Running daily backup..."

        cd $projectPath

        # Check if Docker services are running
        $runningServices = docker-compose ps --services --filter "status=running" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Log "⚠️  Docker services not running, skipping backup"
            exit 0
        }

        # Backup database
        $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
        $backupFile = "$backupDir\eye-of-truth-db-backup-$timestamp.sql"

        Write-Log "Backing up database to: $backupFile"

        try {
            docker-compose exec -T postgres pg_dump -U faceseek -d faceseek 2>/dev/null > $backupFile

            if ($LASTEXITCODE -eq 0) {
                $backupSize = [math]::Round((Get-Item $backupFile).Length / 1MB, 2)
                Write-Log "✅ Database backup successful ($backupSize MB)"
            } else {
                Write-Log "❌ Backup failed"
            }
        } catch {
            Write-Log "❌ Backup error: $_"
        }

        # Also backup with gzip compression
        Write-Log "Creating compressed backup..."
        $compressedFile = "$backupDir\eye-of-truth-db-backup-$timestamp.sql.gz"

        try {
            docker run --rm -v eye-of-tr-v2_postgres_data:/data -v "$backupDir":/backup postgres:16-alpine `
                tar czf /backup/eye-of-truth-data-backup-$timestamp.tar.gz -C /data .

            if ($LASTEXITCODE -eq 0) {
                $compressedSize = [math]::Round((Get-Item "$backupDir\eye-of-truth-data-backup-$timestamp.tar.gz").Length / 1MB, 2)
                Write-Log "✅ Compressed backup successful ($compressedSize MB)"
            }
        } catch {
            Write-Log "⚠️  Compressed backup skipped: $_"
        }

        # Cleanup old backups (older than $maxBackupDays)
        Write-Log "Cleaning up old backups (keeping last $maxBackupDays days)..."
        $cutoffDate = (Get-Date).AddDays(-$maxBackupDays)

        Get-ChildItem $backupDir -Filter "*backup*" -ErrorAction SilentlyContinue | Where-Object {
            $_.LastWriteTime -lt $cutoffDate
        } | ForEach-Object {
            Write-Log "Removing old backup: $($_.Name)"
            Remove-Item $_.FullName -Force
        }

        Write-Log "✅ Backup completed"
    }

    "health-check" {
        Write-Log "Running health check..."

        cd $projectPath

        # Check container status
        Write-Log "Checking container status..."
        $containers = docker-compose ps --services 2>&1

        if ($containers.Count -eq 0) {
            Write-Log "⚠️  No containers running"
            exit 1
        }

        # Test API health
        Write-Log "Testing backend API..."
        try {
            $health = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($health.StatusCode -eq 200) {
                Write-Log "✅ Backend API healthy"
            } else {
                Write-Log "⚠️  Backend returned status: $($health.StatusCode)"
            }
        } catch {
            Write-Log "⚠️  Backend unreachable: $_"
        }

        # Test frontend
        Write-Log "Testing frontend..."
        try {
            $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
            if ($frontend.StatusCode -eq 200) {
                Write-Log "✅ Frontend accessible"
            } else {
                Write-Log "⚠️  Frontend returned status: $($frontend.StatusCode)"
            }
        } catch {
            Write-Log "⚠️  Frontend unreachable: $_"
        }

        # Database check
        Write-Log "Checking database..."
        try {
            $dbCheck = docker-compose exec -T postgres psql -U faceseek -d faceseek -c "SELECT 1;" 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ Database accessible"
            } else {
                Write-Log "❌ Database check failed"
            }
        } catch {
            Write-Log "❌ Database error: $_"
        }

        Write-Log "✅ Health check completed"
    }

    "cleanup-logs" {
        Write-Log "Cleaning up old logs..."
        $cutoffDate = (Get-Date).AddDays(-30)  # Keep logs for 30 days

        Get-ChildItem $logDir -Filter "*.log" -ErrorAction SilentlyContinue | Where-Object {
            $_.LastWriteTime -lt $cutoffDate
        } | ForEach-Object {
            Write-Log "Removing old log: $($_.Name)"
            Remove-Item $_.FullName -Force
        }

        Write-Log "✅ Log cleanup completed"
    }

    "full-maintenance" {
        Write-Log "Running full maintenance..."

        # Backup
        & $PSScriptRoot\backup-scheduler.ps1 -Action "daily-backup"

        # Health check
        & $PSScriptRoot\backup-scheduler.ps1 -Action "health-check"

        # Logs cleanup
        & $PSScriptRoot\backup-scheduler.ps1 -Action "cleanup-logs"

        # System cleanup
        Write-Log "Cleaning up Docker system..."
        docker system prune -f --filter "until=72h" 2>&1 | Add-Content -Path $logFile

        Write-Log "✅ Full maintenance completed"
    }

    "setup-scheduler" {
        Write-Info "Setting up Windows Task Scheduler..."
        Write-Info ""
        Write-Info "This will create scheduled tasks for:"
        Write-Info "  1. Daily backup at 2:00 AM"
        Write-Info "  2. Health check every 6 hours"
        Write-Info "  3. Weekly maintenance on Sunday at 3:00 AM"
        Write-Info ""

        # Daily backup task
        Write-Info "Creating daily backup task..."
        $backupAction = New-ScheduledTaskAction `
            -Execute "powershell.exe" `
            -Argument "-ExecutionPolicy Bypass -File `"$PSScriptRoot\backup-scheduler.ps1`" -Action daily-backup"

        $backupTrigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

        Register-ScheduledTask `
            -Action $backupAction `
            -Trigger $backupTrigger `
            -TaskName "Eye-of-Truth-Daily-Backup" `
            -Description "Daily backup of Eye of Truth database" `
            -RunLevel Highest `
            -Force 2>&1 | Out-Null

        Write-Success "✅ Daily backup task created (2:00 AM)"

        # Health check task (every 6 hours)
        Write-Info "Creating health check task..."
        $healthAction = New-ScheduledTaskAction `
            -Execute "powershell.exe" `
            -Argument "-ExecutionPolicy Bypass -File `"$PSScriptRoot\backup-scheduler.ps1`" -Action health-check"

        $healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddHours(1) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 999)

        Register-ScheduledTask `
            -Action $healthAction `
            -Trigger $healthTrigger `
            -TaskName "Eye-of-Truth-Health-Check" `
            -Description "Health check of Eye of Truth services" `
            -RunLevel Highest `
            -Force 2>&1 | Out-Null

        Write-Success "✅ Health check task created (every 6 hours)"

        # Weekly maintenance task
        Write-Info "Creating weekly maintenance task..."
        $maintenanceAction = New-ScheduledTaskAction `
            -Execute "powershell.exe" `
            -Argument "-ExecutionPolicy Bypass -File `"$PSScriptRoot\backup-scheduler.ps1`" -Action full-maintenance"

        $maintenanceTrigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 3:00AM

        Register-ScheduledTask `
            -Action $maintenanceAction `
            -Trigger $maintenanceTrigger `
            -TaskName "Eye-of-Truth-Weekly-Maintenance" `
            -Description "Weekly maintenance and cleanup" `
            -RunLevel Highest `
            -Force 2>&1 | Out-Null

        Write-Success "✅ Weekly maintenance task created (Sunday at 3:00 AM)"

        Write-Info ""
        Write-Success "✅ All scheduled tasks created successfully!"
        Write-Info ""
        Write-Info "View tasks in Task Scheduler:"
        Write-Info "  Control Panel → Administrative Tools → Task Scheduler"
        Write-Info "  Or search for: Task Scheduler"
        Write-Info ""
        Write-Info "View logs at: $logDir"
    }

    "help" {
        Write-Info "Eye of Truth - Backup & Maintenance Script"
        Write-Info ""
        Write-Info "Usage: .\backup-scheduler.ps1 [Action]"
        Write-Info ""
        Write-Info "Actions:"
        Write-Info "  daily-backup           - Backup database (removes backups older than 7 days)"
        Write-Info "  health-check           - Check health of all services"
        Write-Info "  cleanup-logs           - Remove logs older than 30 days"
        Write-Info "  full-maintenance       - Run all maintenance tasks"
        Write-Info "  setup-scheduler        - Setup Windows Task Scheduler (requires Admin)"
        Write-Info "  help                   - Show this help message"
        Write-Info ""
        Write-Info "Logs: $logFile"
        Write-Info "Backups: $backupDir"
        Write-Info ""
        Write-Info "Examples:"
        Write-Info "  .\backup-scheduler.ps1 daily-backup"
        Write-Info "  .\backup-scheduler.ps1 health-check"
        Write-Info "  .\backup-scheduler.ps1 setup-scheduler"
    }

    default {
        Write-Error-Custom "Unknown action: $Action"
        & $PSScriptRoot\backup-scheduler.ps1 -Action "help"
        exit 1
    }
}

Write-Log "═══════════════════════════════════════════════════════════"
