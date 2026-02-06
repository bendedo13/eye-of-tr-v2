#!/bin/bash
# Test registration endpoint on VPS

echo "=== Testing Registration Endpoint ==="
echo ""

# Test 1: Via Unix Socket
echo "1. Testing via Unix Socket..."
curl --unix-socket /run/faceseek/backend.sock \
  http://localhost/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test1@example.com","username":"test1","password":"Test123!@#","device_id":"test-device-1"}' \
  -s | python3 -m json.tool

echo ""
echo ""

# Test 2: Via Nginx
echo "2. Testing via Nginx (HTTPS)..."
curl -k https://face-seek.com/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://face-seek.com" \
  -d '{"email":"test2@example.com","username":"test2","password":"Test123!@#","device_id":"test-device-2"}' \
  -s | python3 -m json.tool

echo ""
echo ""

# Test 3: Check CORS
echo "3. Testing CORS Headers..."
curl -k https://face-seek.com/api/auth/register \
  -X OPTIONS \
  -H "Origin: https://face-seek.com" \
  -H "Access-Control-Request-Method: POST" \
  -I -s | grep -i "access-control"

echo ""
echo "=== Tests Complete ==="
