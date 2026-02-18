# VPS Deployment Instructions

## Current Status
- ✅ Local changes committed (commit: 55c5c94)
- ⏳ Push to GitHub pending (git command stuck)
- ⚠️ VPS has issues:
  - Divergent branches
  - Missing venv
  - Systemd services not found

## Quick Deploy (Copy-Paste to VPS)

### Option 1: SSH and Run Commands

```bash
# SSH to VPS
ssh root@95.214.27.46

# Navigate to project
cd /root/eye-of-tr-v2

# Fix git divergent branches
git config pull.rebase false
git fetch origin
git reset --hard origin/main

# Setup Python venv if missing
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run migrations
alembic upgrade head

# Start backend (if service doesn't exist)
pkill -f uvicorn
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

cd ../frontend

# Build and start frontend
npm install
npm run build
pkill -f "next start"
nohup npm start > ../frontend.log 2>&1 &

cd ..

# Check if running
ps aux | grep uvicorn
ps aux | grep "next start"

# Check logs
tail -f backend.log
tail -f frontend.log
```

### Option 2: Create Systemd Services (Recommended)

```bash
# SSH to VPS
ssh root@95.214.27.46

# Create backend service
cat > /etc/systemd/system/eye-backend.service << 'EOF'
[Unit]
Description=Eye of TR Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/eye-of-tr-v2/backend
Environment="PATH=/root/eye-of-tr-v2/backend/venv/bin"
ExecStart=/root/eye-of-tr-v2/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service
cat > /etc/systemd/system/eye-frontend.service << 'EOF'
[Unit]
Description=Eye of TR Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/eye-of-tr-v2/frontend
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and start services
systemctl daemon-reload
systemctl enable eye-backend
systemctl enable eye-frontend
systemctl start eye-backend
systemctl start eye-frontend

# Check status
systemctl status eye-backend
systemctl status eye-frontend
```

## Verification Steps

After deployment, test:

1. **Backend API:**
   ```bash
   curl http://localhost:8000/api/health
   curl http://localhost:8000/api/pricing/plans
   ```

2. **Frontend:**
   ```bash
   curl http://localhost:3000
   ```

3. **Admin Pricing Page:**
   - Visit: https://face-seek.com/tr/admin/pricing
   - Login with admin credentials
   - Verify pricing management UI works

4. **Test New User Registration:**
   - Register a new user
   - Check alan_search_credits = 1
   - Try AlanSearch (should work)

## Rollback (If Needed)

```bash
ssh root@95.214.27.46
cd /root/eye-of-tr-v2
git reset --hard HEAD~1
systemctl restart eye-backend eye-frontend
```

## Current Changes Summary

### Backend
- ✅ Pricing updated: 299 TRY / 14.99 USD
- ✅ PricingService with database overrides
- ✅ Admin pricing API endpoints
- ✅ AlanSearch credit fix

### Frontend
- ✅ Admin pricing management page
- ✅ Full CRUD functionality

### Database
- ✅ pricing_overrides table (will be created on first migration)
