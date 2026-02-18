#!/bin/bash

# VPS Status Check Script
# Run on VPS: bash CHECK_VPS_STATUS.sh

echo "========================================="
echo "VPS Status Check"
echo "========================================="
echo ""

# Check if processes are running
echo "1. Checking Backend Process:"
if ps aux | grep -v grep | grep uvicorn > /dev/null; then
    echo "✓ Backend is running"
    ps aux | grep -v grep | grep uvicorn
else
    echo "✗ Backend is NOT running"
fi
echo ""

echo "2. Checking Frontend Process:"
if ps aux | grep -v grep | grep "next start" > /dev/null; then
    echo "✓ Frontend is running"
    ps aux | grep -v grep | grep "next start"
else
    echo "✗ Frontend is NOT running"
fi
echo ""

# Check ports
echo "3. Checking Ports:"
echo "Port 8000 (Backend):"
netstat -tlnp | grep :8000 || echo "✗ Port 8000 not listening"
echo "Port 3000 (Frontend):"
netstat -tlnp | grep :3000 || echo "✗ Port 3000 not listening"
echo ""

# Check API endpoints
echo "4. Testing API Endpoints:"
echo "Health check:"
curl -s http://localhost:8000/api/health || echo "✗ Health check failed"
echo ""
echo "Pricing plans:"
curl -s http://localhost:8000/api/pricing/plans | head -c 200
echo ""
echo ""

# Check logs
echo "5. Recent Backend Logs (last 30 lines):"
if [ -f "/root/eye-of-tr-v2/backend.log" ]; then
    tail -30 /root/eye-of-tr-v2/backend.log
else
    echo "✗ Backend log not found"
fi
echo ""

echo "6. Recent Frontend Logs (last 30 lines):"
if [ -f "/root/eye-of-tr-v2/frontend.log" ]; then
    tail -30 /root/eye-of-tr-v2/frontend.log
else
    echo "✗ Frontend log not found"
fi
echo ""

# Check nginx/reverse proxy
echo "7. Checking Nginx:"
if systemctl is-active --quiet nginx; then
    echo "✓ Nginx is running"
    nginx -t
else
    echo "✗ Nginx is not running"
fi
echo ""

echo "========================================="
echo "Status Check Complete"
echo "========================================="
