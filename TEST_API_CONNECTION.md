# 🧪 API CONNECTION TEST GUIDE

Bu rehber, frontend ve backend arasındaki bağlantıyı test etmek için kullanılır.

---

## 1. BACKEND TEST (Doğrudan Backend)

### Local Development:
```bash
# Health check
curl http://localhost:8000/health

# Register endpoint test
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "device_id": "test-device-123"
  }'
```

### Production (VPS):
```bash
# Via Unix socket
curl --unix-socket /run/faceseek/backend.sock \
  http://localhost/api/health

# Via nginx (HTTPS)
curl -k https://face-seek.com/api/health

# Register test via nginx
curl -k -X POST https://face-seek.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#",
    "device_id": "test-device-123"
  }'
```

---

## 2. FRONTEND TEST (Browser)

### Development:
1. Open browser: http://localhost:3000
2. Open DevTools (F12) → Network tab
3. Go to: http://localhost:3000/register
4. Fill form and submit
5. Check Network tab:
   - Request URL should be: `http://localhost:3000/api/auth/register`
   - Status should be: `200 OK` or `400 Bad Request` (not 404)

### Production:
1. Open browser: https://face-seek.com
2. Open DevTools (F12) → Network tab
3. Go to: https://face-seek.com/register
4. Fill form and submit
5. Check Network tab:
   - Request URL should be: `https://face-seek.com/api/auth/register`
   - Status should be: `200 OK` or `400 Bad Request` (not 404)

---

## 3. NEXT.JS REWRITE TEST

### Check if rewrites are working:

**Development:**
```bash
# Start frontend
cd frontend
npm run dev

# In another terminal, test the proxy
curl http://localhost:3000/api/health
# Should return: {"status":"healthy",...}
```

**Production:**
```bash
# On VPS
curl http://localhost:3000/api/health
# Should return: {"status":"healthy",...}
```

---

## 4. CORS TEST

### Check CORS headers:

```bash
# Development
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  http://localhost:8000/api/auth/register \
  -v

# Production
curl -H "Origin: https://face-seek.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://face-seek.com/api/auth/register \
  -v
```

**Expected headers:**
```
Access-Control-Allow-Origin: https://face-seek.com
Access-Control-Allow-Methods: POST, GET, OPTIONS, ...
Access-Control-Allow-Headers: Content-Type, ...
```

---

## 5. COMMON ISSUES & SOLUTIONS

### Issue: 404 NOT FOUND

**Possible causes:**
1. Next.js rewrite not working
2. Backend not running
3. Nginx misconfigured
4. Wrong API_BASE_URL

**Solutions:**
```bash
# Check Next.js config
cat frontend/next.config.mjs
# Should have: destination: `${apiUrl}/api/:path*`

# Check environment variables
cat frontend/.env.local
# Should have: NEXT_PUBLIC_API_BASE_URL=/api

# Check backend is running
curl http://localhost:8000/health  # Development
curl --unix-socket /run/faceseek/backend.sock http://localhost/api/health  # Production

# Check nginx config
cat /etc/nginx/sites-enabled/face-seek.com
# Should have: proxy_pass http://unix:/run/faceseek/backend.sock;
```

---

### Issue: CORS Error

**Possible causes:**
1. Backend CORS_ORIGINS not including production domain
2. Preflight request failing

**Solutions:**
```bash
# Check backend CORS config
cat backend/.env
# Should have: CORS_ORIGINS=http://localhost:3000,...,https://face-seek.com

# Restart backend
systemctl restart faceseek-backend  # Production
# or
python backend/main.py  # Development
```

---

### Issue: Connection Timeout

**Possible causes:**
1. Backend not responding
2. Firewall blocking
3. Wrong URL

**Solutions:**
```bash
# Check backend logs
journalctl -u faceseek-backend -n 50  # Production
# or
tail -f backend/logs/app.log  # Development

# Check if backend is listening
ss -tlnp | grep 8000  # Development
ss -tlnp | grep unix  # Production (Unix socket)

# Test direct connection
curl -v http://localhost:8000/health
```

---

## 6. AUTOMATED TEST SCRIPT

Save as `test_api.sh`:

```bash
#!/bin/bash

echo "🧪 Testing API Connection..."
echo ""

# Test 1: Backend health
echo "1️⃣ Testing backend health..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi
echo ""

# Test 2: Next.js proxy
echo "2️⃣ Testing Next.js proxy..."
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Next.js proxy is working"
else
    echo "❌ Next.js proxy failed"
fi
echo ""

# Test 3: Register endpoint
echo "3️⃣ Testing register endpoint..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "username": "testuser'$(date +%s)'",
    "password": "Test123!@#",
    "device_id": "test-device-'$(date +%s)'"
  }')

if echo "$RESPONSE" | grep -q "verification_required"; then
    echo "✅ Register endpoint is working"
else
    echo "❌ Register endpoint failed"
    echo "Response: $RESPONSE"
fi
echo ""

echo "✅ All tests completed!"
```

Run with:
```bash
chmod +x test_api.sh
./test_api.sh
```

---

## 7. PRODUCTION DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Backend `.env` has correct `CORS_ORIGINS` (includes production domain)
- [ ] Frontend `.env.local` has `NEXT_PUBLIC_API_BASE_URL=/api`
- [ ] Frontend `.env.local` has `SERVER_API_URL=http://unix:/run/faceseek/backend.sock`
- [ ] Nginx config proxies `/api/*` to Unix socket
- [ ] Backend is running and listening on Unix socket
- [ ] Frontend is built with production env
- [ ] All services restarted after config changes
- [ ] Test registration from browser (not 404)
- [ ] Check browser DevTools Network tab (no CORS errors)

---

**Last Updated:** 2026-02-06  
**Status:** Ready for testing
