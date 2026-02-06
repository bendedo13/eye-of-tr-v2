# 🚀 VPS MANUAL UPDATE GUIDE

**VPS IP:** 46.4.123.77  
**User:** root  
**Password:** mvdBIH368

---

## OPTION 1: Using SSH Client (Recommended)

### Step 1: Connect to VPS
```bash
ssh root@46.4.123.77
# Password: mvdBIH368
```

### Step 2: Run Update Commands
```bash
cd /opt/faceseek

# Pull latest changes
git pull origin main

# Update frontend environment
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://unix:/run/faceseek/backend.sock
NEXT_PUBLIC_SITE_URL=https://face-seek.com
EOF

# Install dependencies and build
cd frontend
npm install --production
npm run build

# Restart services
cd ..
systemctl restart faceseek-backend
sleep 2
systemctl restart faceseek-frontend
sleep 2
systemctl reload nginx

# Check status
systemctl status faceseek-backend --no-pager
systemctl status faceseek-frontend --no-pager
systemctl status nginx --no-pager

# Test API
curl --unix-socket /run/faceseek/backend.sock \
  http://localhost/api/admin/ping \
  -H 'x-admin-key: faceseek-admin-2026'
```

---

## OPTION 2: Using Automated Script

### On VPS, run:
```bash
cd /opt/faceseek
chmod +x deploy/scripts/update_production.sh
./deploy/scripts/update_production.sh
```

---

## ✅ VERIFICATION

After deployment, test these URLs:

### 1. Admin Login
- URL: https://face-seek.com/admin/login
- Email: `admin@faceseek.io`
- API Key: `faceseek-admin-2026`
- Expected: Should login and redirect to dashboard

### 2. User Registration
- URL: https://face-seek.com/register
- Fill in: email, username, password
- Expected: Should register successfully and auto-login

### 3. User Login
- URL: https://face-seek.com/login
- Use registered credentials
- Expected: Should login successfully

---

## 🔍 TROUBLESHOOTING

### If services fail to start:

```bash
# Check backend logs
journalctl -u faceseek-backend -n 50

# Check frontend logs
journalctl -u faceseek-frontend -n 50

# Check nginx logs
tail -f /var/log/nginx/error.log

# Check nginx config
nginx -t

# Check socket file
ls -la /run/faceseek/backend.sock
```

### If build fails:

```bash
cd /opt/faceseek/frontend

# Check Node version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next
npm run build
```

### If API returns 404:

```bash
# Test backend directly
curl --unix-socket /run/faceseek/backend.sock \
  http://localhost/api/health

# Check nginx config
cat /etc/nginx/sites-enabled/face-seek.com

# Reload nginx
systemctl reload nginx
```

---

## 📋 WHAT WAS FIXED

1. ✅ Removed duplicate `next.config.ts` (was conflicting)
2. ✅ Updated nginx config to use Unix socket
3. ✅ Fixed frontend environment variables for production
4. ✅ Clarified admin login (API key, not password)
5. ✅ Committed all changes to GitHub

---

## 🎯 EXPECTED RESULTS

After successful deployment:

- ✅ No "NOT FOUND" errors
- ✅ Admin login works with API key
- ✅ User registration works
- ✅ User login works
- ✅ All services running
- ✅ Frontend builds with 0 errors

---

## 📞 SUPPORT

If issues persist:
1. Check service logs (commands above)
2. Verify environment variables
3. Test backend API directly
4. Check nginx configuration

---

**Last Updated:** 2026-02-06  
**Status:** Ready for deployment
