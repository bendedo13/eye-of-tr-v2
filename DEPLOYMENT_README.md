# Eye of Truth - Windows Server Deployment Suite

Complete PowerShell deployment automation for Eye of Truth project on Windows Server with Docker Compose.

🚀 **Quick Start**: `.\deploy-to-server.ps1`

---

## 📋 What's Included

### Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| **deploy-to-server.ps1** | Initial full deployment setup | `.\deploy-to-server.ps1` |
| **deploy-update.ps1** | Quick update with latest code | `.\deploy-update.ps1` |
| **manage-deployment.ps1** | Daily operations & maintenance | `.\manage-deployment.ps1 [command]` |
| **backup-scheduler.ps1** | Automated backups & health checks | `.\backup-scheduler.ps1 [action]` |

### Documentation

| Document | Content |
|----------|---------|
| **DEPLOYMENT_GUIDE.md** | Complete deployment instructions & troubleshooting |
| **README.md** (this file) | Quick reference guide |

---

## 🚀 Quick Start

### 1️⃣ First Time Setup
```powershell
# Run as Administrator
cd C:\Users\Asus\Desktop\eye-of-tr-v2
.\deploy-to-server.ps1
```

This will:
- ✅ Verify Docker, Git, SSH
- ✅ Clone GitHub repository
- ✅ Create `.env` configuration
- ✅ Build Docker images
- ✅ Start all 6 services

**Expected time**: 5-10 minutes (mostly image building)

### 2️⃣ Update to Latest Code
```powershell
cd C:\projects\eye-of-tr-v2
.\deploy-update.ps1
```

**Expected time**: 2-3 minutes

### 3️⃣ Check Status
```powershell
.\manage-deployment.ps1 status
```

---

## 🎮 Common Commands

```powershell
# View running services
.\manage-deployment.ps1 status

# View logs (all services)
.\manage-deployment.ps1 logs

# View specific service logs
.\manage-deployment.ps1 logs-backend
.\manage-deployment.ps1 logs-frontend

# Health check of all services
.\manage-deployment.ps1 health

# Restart services
.\manage-deployment.ps1 restart
.\manage-deployment.ps1 restart backend    # specific service

# Backup database
.\manage-deployment.ps1 backup

# Restore from backup
.\manage-deployment.ps1 restore C:\backups\backup-file.sql

# Stop all services
.\manage-deployment.ps1 stop

# Start all services
.\manage-deployment.ps1 start
```

---

## 🔧 Manage Deployment Commands

```powershell
# Usage: .\manage-deployment.ps1 [command]

Commands:
  start              Start all services
  stop               Stop all services
  status             Show running containers
  logs [service]     View logs (optional: service name)
  logs-backend       Backend logs (last 50 lines)
  logs-frontend      Frontend logs (last 50 lines)
  restart [service]  Restart services (optional: specific service)
  rebuild            Rebuild containers and restart
  health             Check health of all services
  backup             Backup PostgreSQL database
  restore [file]     Restore from backup
  clean              Remove all containers and volumes

Examples:
  .\manage-deployment.ps1 start
  .\manage-deployment.ps1 logs backend
  .\manage-deployment.ps1 backup
```

---

## 📦 Backup & Maintenance

### Manual Backup
```powershell
.\manage-deployment.ps1 backup
# Saves to: C:\backups\eye-of-truth-backup-YYYY-MM-DD_HH-MM-SS.sql
```

### Restore from Backup
```powershell
.\manage-deployment.ps1 restore C:\backups\backup-file.sql
```

### Automated Backups (Task Scheduler)
```powershell
# Setup automatic daily backups + health checks
.\backup-scheduler.ps1 setup-scheduler

# This creates tasks:
# - Daily backup: 2:00 AM
# - Health check: Every 6 hours
# - Weekly maintenance: Sunday 3:00 AM
```

### Manual Maintenance
```powershell
# Just backup
.\backup-scheduler.ps1 daily-backup

# Just health check
.\backup-scheduler.ps1 health-check

# Full maintenance suite
.\backup-scheduler.ps1 full-maintenance

# Cleanup old logs (>30 days)
.\backup-scheduler.ps1 cleanup-logs
```

---

## 🌐 Service URLs

Once running, access services at:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend API** | http://localhost:8000 | REST API |
| **Health Check** | http://localhost:8000/health | API status |
| **Metrics** | http://localhost:8000/metrics | Prometheus format |
| **Prometheus** | http://localhost:9090 | Metrics database |
| **Grafana** | http://localhost:3001 | Metrics dashboard |

**Grafana login**: `admin` / `[GRAFANA_ADMIN_PASSWORD]` (from .env)

---

## ⚙️ Configuration

### Environment Variables (.env)

Located at: `C:\projects\eye-of-tr-v2\.env`

**Edit these required values:**
```env
PUBLIC_BASE_URL=https://your-domain.com
SECRET_KEY=<openssl rand -hex 32>
POSTGRES_PASSWORD=<secure_password>
SMTP_PASS=<email_password>
GRAFANA_ADMIN_PASSWORD=<secure_password>
```

See `DEPLOYMENT_GUIDE.md` for complete reference.

---

## 📊 Monitor Services

### View Container Status
```powershell
docker-compose ps
```

### View Live Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last N lines
docker-compose logs --tail=50
```

### Health Check Dashboard
```powershell
.\manage-deployment.ps1 health
```

Checks:
- Backend API (`/health` endpoint)
- Frontend web server
- Prometheus metrics
- Grafana dashboard

---

## 🐛 Troubleshooting

### Services Won't Start
```powershell
# Check logs
docker-compose logs

# Restart Docker
Restart-Service Docker

# Check port conflicts
netstat -ano | findstr ":3000\|:8000\|:5432\|:6379"
```

### Backend API Not Responding
```powershell
# View backend logs
docker-compose logs backend --tail=100

# Check database connection
docker-compose exec postgres psql -U faceseek -c "SELECT 1;"
```

### Frontend Can't Connect to Backend
```powershell
# Check frontend logs
docker-compose logs frontend --tail=100

# Test API from container
docker-compose exec frontend curl http://backend:8000/health
```

### Database Issues
```powershell
# Connect to database
docker-compose exec postgres psql -U faceseek -d faceseek

# Check tables
docker-compose exec postgres psql -U faceseek -d faceseek -c "\dt"

# Restart database
docker-compose restart postgres
```

See `DEPLOYMENT_GUIDE.md` for more troubleshooting steps.

---

## 🔄 Update Workflow

### Option 1: Quick Update (Recommended)
```powershell
cd C:\projects\eye-of-tr-v2
.\deploy-update.ps1
```

### Option 2: Manual Update
```powershell
cd C:\projects\eye-of-tr-v2

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build --no-cache backend frontend
docker-compose up -d
```

### Option 3: Full Deployment
```powershell
.\deploy-to-server.ps1
```

---

## 🔐 Security Best Practices

1. **Secure .env file**
   - Keep credentials confidential
   - Don't commit to Git
   - Restrict file permissions

2. **Use HTTPS in Production**
   - Install SSL certificate
   - Update `PUBLIC_BASE_URL` to `https://`
   - Configure reverse proxy (Nginx/IIS)

3. **Regular Backups**
   - Setup automated daily backups
   - Test restore procedures
   - Store backups securely

4. **Monitor Services**
   - Check Grafana dashboards regularly
   - Monitor API metrics
   - Set up alerts

5. **Firewall Rules**
   - Allow only necessary ports (80, 443)
   - Restrict internal ports (5432, 6379)
   - Monitor unauthorized access attempts

---

## 📈 Production Checklist

- [ ] All .env values configured (especially secrets)
- [ ] SSH key added to GitHub Deploy Keys
- [ ] Docker and Docker Compose installed
- [ ] Initial deployment successful (all services running)
- [ ] Frontend accessible at http://server:3000
- [ ] Backend API responding at http://server:8000/health
- [ ] Database initialized and accessible
- [ ] Reverse proxy configured (Nginx/IIS)
- [ ] SSL/HTTPS certificate installed
- [ ] Firewall rules in place
- [ ] Automated backups configured
- [ ] Monitoring/Grafana accessible
- [ ] Admin credentials changed
- [ ] Domain DNS configured
- [ ] Disaster recovery plan tested

---

## 📚 Documentation

- **DEPLOYMENT_GUIDE.md** - Complete step-by-step guide
- **docker-compose.yml** - Service configuration
- **backend/requirements.txt** - Python dependencies
- **frontend/package.json** - Node.js dependencies

---

## 🆘 Support

**If deployment fails:**
1. Check logs: `docker-compose logs`
2. Review `DEPLOYMENT_GUIDE.md` troubleshooting section
3. Verify prerequisites: `docker --version`, `git --version`
4. Check GitHub SSH access: `ssh -T git@github.com`

**For development:**
- Backend docs: http://localhost:8000/docs (Swagger API)
- Frontend: Next.js development at http://localhost:3000

---

## 📝 Project Structure

```
eye-of-tr-v2/
├── deploy-to-server.ps1          ← Initial deployment
├── deploy-update.ps1             ← Code updates
├── manage-deployment.ps1          ← Daily operations
├── backup-scheduler.ps1           ← Automated backups
├── DEPLOYMENT_GUIDE.md            ← Complete guide
├── README.md                       ← This file
├── docker-compose.yml             ← Service definitions
├── backend/                        ← FastAPI Python backend
├── frontend/                       ← Next.js React frontend
├── infra/                          ← Monitoring (Prometheus, Grafana)
└── scripts/                        ← Utility scripts
```

---

## 🎯 Key Features

✅ Full Docker Compose deployment
✅ Automated initial setup
✅ Easy updates with latest code
✅ Production configurations
✅ Database backup & restore
✅ Health monitoring
✅ Service management
✅ Comprehensive logging
✅ Scheduled maintenance
✅ Grafana dashboards included

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| First deployment | `.\deploy-to-server.ps1` |
| Update code | `.\deploy-update.ps1` |
| Check status | `.\manage-deployment.ps1 status` |
| View logs | `docker-compose logs -f` |
| Backup | `.\manage-deployment.ps1 backup` |
| Health check | `.\manage-deployment.ps1 health` |
| Restart services | `.\manage-deployment.ps1 restart` |
| Stop services | `.\manage-deployment.ps1 stop` |
| Setup backups | `.\backup-scheduler.ps1 setup-scheduler` |

---

**Created**: 2026-02-08
**Compatible**: Windows Server with Docker & Docker Compose

For detailed instructions, see `DEPLOYMENT_GUIDE.md` 📖
