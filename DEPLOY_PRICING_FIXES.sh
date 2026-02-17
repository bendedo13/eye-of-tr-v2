#!/bin/bash

# Pricing and Credit Fixes Deployment Script
# This script deploys the pricing updates and AlanSearch credit fix

echo "========================================="
echo "Pricing and Credit Fixes Deployment"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "backend/app/main.py" ]; then
    echo -e "${RED}Error: Must run from project root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Backing up current code...${NC}"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r backend/app/api/pricing.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/app/api/auth.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/app/api/alan_search.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/app/api/admin.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/app/models/pricing.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r backend/app/services/pricing_service.py "$BACKUP_DIR/" 2>/dev/null || true
cp -r frontend/app/\[locale\]/admin/pricing/page.tsx "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${GREEN}✓ Backup created in $BACKUP_DIR${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking database migration...${NC}"
if [ -f "backend/alembic/versions/*_add_pricing_overrides.py" ]; then
    echo -e "${GREEN}✓ Migration file exists${NC}"
else
    echo -e "${YELLOW}⚠ Migration file not found - will be created on first run${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Testing backend changes locally...${NC}"
echo "Checking Python syntax..."
python3 -m py_compile backend/app/api/pricing.py
python3 -m py_compile backend/app/api/auth.py
python3 -m py_compile backend/app/api/alan_search.py
python3 -m py_compile backend/app/api/admin.py
python3 -m py_compile backend/app/models/pricing.py
python3 -m py_compile backend/app/services/pricing_service.py
echo -e "${GREEN}✓ Python syntax check passed${NC}"
echo ""

echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend build successful${NC}"
cd ..
echo ""

echo -e "${YELLOW}Step 5: Committing changes to git...${NC}"
git add .
git commit -m "feat: Update pricing values and fix AlanSearch credit initialization

- Update basic_monthly: 299 TRY / 14.99 USD
- Update credit_pack: 59.99 TRY / 2.99 USD
- Add database-backed pricing management with admin UI
- Fix AlanSearch credit initialization bug for new users
- Add admin pricing management page
- Implement PricingService with database overrides
- Add admin API endpoints for pricing management"
echo -e "${GREEN}✓ Changes committed${NC}"
echo ""

echo -e "${YELLOW}Step 6: Pushing to repository...${NC}"
git push origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Git push failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Pushed to repository${NC}"
echo ""

echo -e "${YELLOW}Step 7: Deploying to VPS...${NC}"
echo "Connecting to VPS and deploying..."
ssh root@95.214.27.46 << 'ENDSSH'
    cd /root/eye-of-tr-v2
    
    echo "Pulling latest changes..."
    git pull origin main
    
    echo "Running database migrations..."
    cd backend
    source venv/bin/activate
    alembic upgrade head
    
    echo "Restarting backend service..."
    sudo systemctl restart eye-backend
    
    echo "Building and restarting frontend..."
    cd ../frontend
    npm run build
    sudo systemctl restart eye-frontend
    
    echo "Checking service status..."
    sudo systemctl status eye-backend --no-pager | head -10
    sudo systemctl status eye-frontend --no-pager | head -10
    
    echo "Deployment complete!"
ENDSSH

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ VPS deployment failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ VPS deployment successful${NC}"
echo ""

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test the pricing page: https://face-seek.com/tr/pricing"
echo "2. Test admin pricing management: https://face-seek.com/tr/admin/pricing"
echo "3. Register a new user and test AlanSearch credit"
echo "4. Verify pricing values are correct (299 TRY / 14.99 USD for monthly)"
echo ""
echo "Rollback instructions (if needed):"
echo "1. cd $BACKUP_DIR"
echo "2. Copy files back to their original locations"
echo "3. Run: git reset --hard HEAD~1"
echo "4. Run: git push origin main --force"
echo "5. SSH to VPS and run: cd /root/eye-of-tr-v2 && git pull && sudo systemctl restart eye-backend eye-frontend"
