#!/bin/bash
set -e

# Configuration
APP_DIR="${1:-/opt/faceseek}" # Default to /opt/faceseek or use first argument

echo "========================================"
echo "🚀 FaceSeek VPS Update Script"
echo "Target Directory: $APP_DIR"
echo "========================================"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: Directory $APP_DIR does not exist."
    echo "Usage: ./update_vps.sh [path_to_app]"
    exit 1
fi

cd "$APP_DIR"

# 1. Pull latest changes
echo "📥 Pulling latest changes from Git..."
git fetch origin
git reset --hard origin/main
# Note: git pull might cause merge conflicts if files were modified on server. 
# git reset --hard ensures server matches repo exactly.

# 2. Check for Docker
if [ -f "docker-compose.yml" ] && docker compose version >/dev/null 2>&1; then
    if [ -n "$(docker compose ps -q)" ] || [ "$2" == "--docker" ]; then
        echo "🐳 Docker environment detected."
        echo "🔄 Rebuilding and restarting containers..."
        docker compose up -d --build
        echo "✅ Docker update complete!"
        exit 0
    fi
fi

# 3. Backend Update (Systemd)
echo "🛠️ Updating Backend (Standard)..."
cd backend

# Activate venv if exists
if [ -d "venv" ]; then
    echo "🔌 Activating virtual environment..."
    source venv/bin/activate
elif [ -d "../venv" ]; then
    source ../venv/bin/activate
fi

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🔄 Restarting Backend Service..."
# Try standard service names
if systemctl is-active --quiet faceseek-backend; then
    sudo systemctl restart faceseek-backend
    echo "✅ faceseek-backend restarted"
elif systemctl is-active --quiet backend; then
    sudo systemctl restart backend
    echo "✅ backend service restarted"
else
    echo "⚠️ Warning: Backend service not found or not running. Please restart manually."
fi

# 4. Frontend Update (Systemd)
echo "🛠️ Updating Frontend (Standard)..."
cd ../frontend

echo "📦 Installing Node dependencies..."
npm install

echo "🏗️ Building Next.js app..."
npm run build

echo "🔄 Restarting Frontend Service..."
if systemctl is-active --quiet faceseek-frontend; then
    sudo systemctl restart faceseek-frontend
    echo "✅ faceseek-frontend restarted"
elif systemctl is-active --quiet frontend; then
    sudo systemctl restart frontend
    echo "✅ frontend service restarted"
else
    echo "⚠️ Warning: Frontend service not found or not running. Please restart manually."
fi

echo "========================================"
echo "✅ Update successfully completed!"
echo "========================================"
