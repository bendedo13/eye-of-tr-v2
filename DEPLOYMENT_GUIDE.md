# Windows Server Production Deployment Guide
# Eye of Truth - Complete Deployment Instructions

## Quick Start

### 1. Initial Deployment (First Time)
```powershell
# Run from PowerShell as Administrator
cd C:\Users\Asus\Desktop\eye-of-tr-v2
.\deploy-to-server.ps1
```

This script will:
- ✅ Verify all prerequisites (Docker, Git, etc.)
- ✅ Clone your GitHub repository
- ✅ Create .env file template
- ✅ Build Docker images
- ✅ Start all services (PostgreSQL, Redis, Backend, Frontend, Prometheus, Grafana)
- ✅ Verify services are running

### 2. Update to Latest Code
```powershell
cd C:\projects\eye-of-tr-v2
.\deploy-update.ps1
```

This quickly pulls latest code and restarts services (~2-3 minutes)

### 3. Manage Running Services
```powershell
# Check status
.\manage-deployment.ps1 status

# View logs
.\manage-deployment.ps1 logs
.\manage-deployment.ps1 logs-backend
.\manage-deployment.ps1 logs-frontend

# Restart services
.\manage-deployment.ps1 restart

# Check health
.\manage-deployment.ps1 health

# Backup database
.\manage-deployment.ps1 backup

# Restore from backup
.\manage-deployment.ps1 restore C:\backups\backup-file.sql
```

---

## Prerequisites

Before running deployment, ensure your Windows Server has:

### Required
- **Docker Desktop** or **Docker Engine for Windows** (with Docker Compose)
- **Git** (for cloning repository)
- **SSH Key** (configured with GitHub)

### Optional but Recommended
- **Node.js 20+** (for local development/builds)
- **Python 3.11+** (for local backend development)

### Check Prerequisites
```powershell
docker --version
docker-compose --version
git --version
node --version
python --version
```

---

## Environment Configuration (.env)

The deployment script creates a `.env` file at: `C:\projects\eye-of-tr-v2\.env`

**Edit this file with your production settings:**

```env
# REQUIRED: Your server's domain or IP address
PUBLIC_BASE_URL=https://your-domain.com

# REQUIRED: Secure random string for JWT signing
# Generate: openssl rand -hex 32
SECRET_KEY=<your-generated-key>

# REQUIRED: PostgreSQL password (choose secure password)
POSTGRES_PASSWORD=<secure_password>

# REQUIRED: Email SMTP credentials
SMTP_PASS=<email_password>

# REQUIRED: Grafana admin password
GRAFANA_ADMIN_PASSWORD=<secure_password>

# Email configuration
SMTP_HOST=mail.face-seek.com
SMTP_PORT=465
SMTP_USER=verify@face-seek.com

# CORS origins (domains allowed to access API)
CORS_ORIGINS=https://your-domain.com,http://localhost:3000

# Optional: External API keys (if you have them)
OPENAI_API_KEY=<if-available>
SERPAPI_API_KEY=<if-available>
```

**⚠️ IMPORTANT**: Keep the .env file secure and private!

---

## Service Access After Deployment

Once running, your services are available at:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Web application (user interface) |
| **Backend API** | http://localhost:8000 | REST API server |
| **API Health Check** | http://localhost:8000/health | API status |
| **Metrics** | http://localhost:8000/metrics | Prometheus metrics |
| **Prometheus** | http://localhost:9090 | Metrics database |
| **Grafana** | http://localhost:3001 | Metrics visualization |
| **PostgreSQL** | localhost:5432 | Database (internal only) |
| **Redis** | localhost:6379 | Cache server (internal only) |

**For external/domain access:**
- Set up reverse proxy (Nginx or IIS)
- Configure SSL/HTTPS certificates
- Update `PUBLIC_BASE_URL` in .env

---

## Deployment Scripts Explained

### deploy-to-server.ps1 (Initial Setup)
- Creates project directory
- Clones GitHub repository
- Creates .env file template
- Builds Docker images
- Starts all services
- Verifies deployment
- **Best for**: First-time installation

### deploy-update.ps1 (Quick Updates)
- Pulls latest code from GitHub
- Rebuilds containers with new code
- Restarts services
- **Best for**: Regular code updates (~2-3 minutes)

### manage-deployment.ps1 (Routine Operations)
```powershell
# Examples:
.\manage-deployment.ps1 status              # View running services
.\manage-deployment.ps1 logs               # View all logs
.\manage-deployment.ps1 logs-backend       # View backend logs
.\manage-deployment.ps1 health             # Health check all services
.\manage-deployment.ps1 backup             # Database backup
.\manage-deployment.ps1 restart            # Restart all services
.\manage-deployment.ps1 restart frontend   # Restart specific service
.\manage-deployment.ps1 stop               # Stop all services
.\manage-deployment.ps1 clean              # Remove all containers (careful!)
```

---

## Common Tasks

### View Application Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services
```powershell
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Stop and remove containers (restart clean)
docker-compose down
docker-compose up -d
```

### Rebuild Containers
```powershell
# Rebuild and restart (when code changes)
docker-compose build --no-cache backend frontend
docker-compose up -d
```

### Check Database
```powershell
# Connect to PostgreSQL database
docker-compose exec postgres psql -U faceseek -d faceseek

# Useful SQL commands once connected:
# \dt                    - List all tables
# SELECT * FROM users;  - View users
# \g                    - Execute query
# \q                    - Exit
```

### Backup Database
```powershell
# Automated backup
.\manage-deployment.ps1 backup

# Manual backup
docker-compose exec -T postgres pg_dump -U faceseek -d faceseek > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U faceseek -d faceseek
```

### Monitor Performance
```
Access Grafana: http://localhost:3001
- Default login: admin / <your_GRAFANA_ADMIN_PASSWORD>
- View pre-built dashboards
- Monitor CPU, memory, API response times
```

---

## Production Recommended Setup

### 1. Reverse Proxy with Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. SSL/HTTPS Certificate
- Use Let's Encrypt (free): https://letsencrypt.org/
- Or your hosting provider's SSL service
- Update `PUBLIC_BASE_URL=https://your-domain.com` in .env

### 3. Automated Backups
```powershell
# Create Windows Task Scheduler job:
# Task: Daily database backup at 2:00 AM
# Action: PowerShell -ExecutionPolicy Bypass -Command "cd C:\projects\eye-of-tr-v2; .\manage-deployment.ps1 backup"
```

### 4. Monitoring & Alerts
- Monitor Prometheus metrics: http://domain.com/metrics
- Check Grafana dashboards: http://domain.com:3001
- Set up alerts for service failures

### 5. Firewall Rules
Allow inbound traffic on:
- **80** (HTTP)
- **443** (SSL/HTTPS)
Allow outbound for:
- GitHub (for git pull)
- SMTP (for email notifications)
- External APIs (if configured)

---

## Troubleshooting

### Services Won't Start
```powershell
# Check logs for errors
docker-compose logs

# Restart Docker daemon (if needed)
Restart-Service Docker

# Verify all ports are available
netstat -ano | findstr "3000\|8000\|5432\|6379"
```

### Backend API Not Responding
```powershell
# Check backend logs
docker-compose logs backend --tail=50

# Verify database connection
docker-compose exec postgres psql -U faceseek -c "SELECT 1;"

# Check if port 8000 is in use
netstat -ano | findstr ":8000"
```

### Frontend Can't Connect to API
```powershell
# Check frontend logs
docker-compose logs frontend --tail=50

# Verify API proxy configuration in frontend/next.config.mjs
# Make sure SERVER_API_URL is set to http://backend:8000

# Test API from frontend container
docker-compose exec frontend curl http://backend:8000/health
```

### Database Issues
```powershell
# Check PostgreSQL logs
docker-compose logs postgres --tail=50

# Connect to database and check
docker-compose exec postgres psql -U faceseek -d faceseek -c "SELECT COUNT(*) FROM users;"

# Restart database
docker-compose restart postgres
```

### Out of Disk Space
```powershell
# Check Docker disk usage
docker system df

# Clean up unused images/containers
docker system prune -a
```

---

## Recovery & Disaster Recovery

### Full System Restore
```powershell
# 1. Stop existing services
docker-compose down

# 2. Restore from database backup
cat backup.sql | docker-compose exec -T postgres psql -U faceseek

# 3. Restart
docker-compose up -d
```

### Update vs Rollback
```powershell
# View git history
git log --oneline -10

# Rollback to previous version
git reset --hard <commit-hash>
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Performance Tuning

### PostgreSQL
```powershell
# Check database size
docker-compose exec postgres psql -U faceseek -d faceseek -c "SELECT pg_size_pretty(pg_database_size('faceseek'));"

# Analyze tables
docker-compose exec postgres psql -U faceseek -d faceseek -c "ANALYZE;"
```

### Docker Resources
Edit `docker-compose.yml` to limit resource usage:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## Support & Documentation

- **Deployment Plan**: `C:\Users\Asus\.claude\plans\zazzy-booping-rocket.md`
- **Docker Documentation**: https://docs.docker.com/
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **GitHub Issues**: Report deployment issues on repository

---

## Checklist for Production Deployment

- [ ] All .env values configured (especially `PUBLIC_BASE_URL`, `SECRET_KEY`, `POSTGRES_PASSWORD`)
- [ ] SSH key added to GitHub Deploy Keys
- [ ] Docker and Docker Compose installed and working
- [ ] Initial deployment successful
- [ ] All 6 services running (status shows "Up")
- [ ] Frontend accessible at http://server:3000
- [ ] Backend API responding at http://server:8000/health
- [ ] Database initialized with tables
- [ ] Reverse proxy configured (Nginx/IIS)
- [ ] SSL/HTTPS certificate installed
- [ ] Firewall rules configured
- [ ] Automated backups scheduled
- [ ] Monitoring/Grafana accessible
- [ ] Admin credentials changed
- [ ] Domain DNS records updated

---

**Last Updated**: 2026-02-08
**Version**: 1.0
