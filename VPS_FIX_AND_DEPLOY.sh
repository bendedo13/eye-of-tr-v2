#!/bin/bash

# VPS Fix and Deploy Script
# Run this on VPS: bash VPS_FIX_AND_DEPLOY.sh

echo "========================================="
echo "VPS Fix and Deployment"
echo "========================================="

cd /root/eye-of-tr-v2

# Fix divergent branches
echo "Step 1: Fixing git divergent branches..."
git config pull.rebase false
git pull origin main --no-rebase

# Check if virtual environment exists
echo "Step 2: Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    echo "Creating virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "Virtual environment exists"
fi

# Run database migrations
echo "Step 3: Running database migrations..."
cd backend
source venv/bin/activate
alembic upgrade head
cd ..

# Check systemd services
echo "Step 4: Checking systemd services..."
if systemctl list-units --full -all | grep -q "eye-backend.service"; then
    echo "Restarting eye-backend service..."
    sudo systemctl restart eye-backend
else
    echo "WARNING: eye-backend.service not found"
    echo "Starting backend manually..."
    cd backend
    source venv/bin/activate
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    echo $! > backend.pid
    cd ..
fi

# Build and restart frontend
echo "Step 5: Building frontend..."
cd frontend
npm install
npm run build

if systemctl list-units --full -all | grep -q "eye-frontend.service"; then
    echo "Restarting eye-frontend service..."
    sudo systemctl restart eye-frontend
else
    echo "WARNING: eye-frontend.service not found"
    echo "Starting frontend manually..."
    nohup npm start > frontend.log 2>&1 &
    echo $! > frontend.pid
fi

cd ..

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Check logs:"
echo "  Backend: tail -f backend/backend.log"
echo "  Frontend: tail -f frontend/frontend.log"
echo ""
echo "Check processes:"
echo "  ps aux | grep uvicorn"
echo "  ps aux | grep node"
