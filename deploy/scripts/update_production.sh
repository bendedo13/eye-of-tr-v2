#!/bin/bash
# Production Update Script for FaceSeek
# Run this on VPS after pushing changes to GitHub

set -e  # Exit on error

echo "🚀 FaceSeek Production Update Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/faceseek"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}📂 Navigating to project directory...${NC}"
cd "$PROJECT_DIR" || exit 1

echo -e "${YELLOW}📥 Pulling latest changes from GitHub...${NC}"
git pull origin main

echo -e "${YELLOW}🔧 Updating frontend environment...${NC}"
if [ -f "$FRONTEND_DIR/.env.production" ]; then
    cp "$FRONTEND_DIR/.env.production" "$FRONTEND_DIR/.env.local"
    echo -e "${GREEN}✅ Environment variables updated${NC}"
else
    echo -e "${RED}⚠️  Warning: .env.production not found, using existing .env.local${NC}"
fi

echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
npm install --production

echo -e "${YELLOW}🏗️  Building frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

echo -e "${YELLOW}🐍 Updating backend dependencies...${NC}"
cd "$BACKEND_DIR"
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    deactivate
    echo -e "${GREEN}✅ Backend dependencies updated${NC}"
else
    echo -e "${RED}⚠️  Warning: Virtual environment not found${NC}"
fi

echo -e "${YELLOW}🔄 Restarting services...${NC}"

systemctl restart faceseek-backend
sleep 2
if systemctl is-active --quiet faceseek-backend; then
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${RED}❌ Backend failed to start!${NC}"
    journalctl -u faceseek-backend -n 20
    exit 1
fi

systemctl restart faceseek-frontend
sleep 2
if systemctl is-active --quiet faceseek-frontend; then
    echo -e "${GREEN}✅ Frontend restarted${NC}"
else
    echo -e "${RED}❌ Frontend failed to start!${NC}"
    journalctl -u faceseek-frontend -n 20
    exit 1
fi

systemctl reload nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx failed to reload!${NC}"
    nginx -t
    exit 1
fi

echo ""
echo -e "${GREEN}======================================"
echo "✅ Deployment completed successfully!"
echo "======================================${NC}"
echo ""
echo "🔍 Service Status:"
systemctl status faceseek-backend --no-pager -l | head -n 3
systemctl status faceseek-frontend --no-pager -l | head -n 3
systemctl status nginx --no-pager -l | head -n 3
echo ""
echo "🌐 Site: https://face-seek.com"
echo "🔐 Admin: https://face-seek.com/admin/login"
echo ""
echo "📋 To view logs:"
echo "  Backend:  journalctl -u faceseek-backend -f"
echo "  Frontend: journalctl -u faceseek-frontend -f"
echo "  Nginx:    tail -f /var/log/nginx/error.log"
echo ""
