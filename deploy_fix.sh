#!/bin/bash
set -e

# Update Code
cd /opt/faceseek
git fetch origin main
git reset --hard origin/main

# Install Dependencies (just in case)
/opt/faceseek/backend/venv/bin/pip install -r backend/requirements.txt --quiet
cd frontend
npm install --silent
npx next build
cd ..

# Fix DB
echo "Patching Database..."
set -a
source /etc/faceseek/backend.env
set +a

# Add missing columns
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS successful_searches INTEGER DEFAULT 0;"
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS total_searches INTEGER DEFAULT 0;"
psql $DATABASE_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS alan_search_credits INTEGER DEFAULT 1;"

# Restart services
echo "Restarting Services..."
systemctl restart faceseek-backend
systemctl restart nginx

echo "DEPLOY & DB PATCH COMPLETED SUCCESSFULLY"
