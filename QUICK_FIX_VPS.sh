#!/bin/bash

# Quick Fix for VPS
# Run on VPS: bash QUICK_FIX_VPS.sh

echo "========================================="
echo "Quick Fix - Restarting Services"
echo "========================================="

cd /root/eye-of-tr-v2

# Stop all processes
echo "Stopping all processes..."
pkill -f uvicorn
pkill -f "next start"
pkill -f "node"
sleep 2

# Start backend
echo "Starting backend..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
echo "Backend PID: $!"
sleep 3

# Check backend
echo "Testing backend..."
curl -s http://localhost:8000/api/health
echo ""

# Start frontend
echo "Starting frontend..."
cd ../frontend
nohup npm start > ../frontend.log 2>&1 &
echo "Frontend PID: $!"
sleep 5

# Check frontend
echo "Testing frontend..."
curl -s http://localhost:3000 | head -c 100
echo ""

# Show status
echo ""
echo "========================================="
echo "Services Status:"
echo "========================================="
ps aux | grep -E "uvicorn|next start" | grep -v grep

echo ""
echo "Check logs:"
echo "  tail -f /root/eye-of-tr-v2/backend.log"
echo "  tail -f /root/eye-of-tr-v2/frontend.log"
