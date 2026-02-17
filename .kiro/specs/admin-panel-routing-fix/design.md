# Admin Panel 404 Sorunu - Production Fix Design

## Sorun

Production'da admin sayfaları 404 veriyor çünkü:
1. VPS'te build yapılmamış veya eski build kullanılıyor
2. Route'lar doğru oluşturulmamış

## Çözüm

### 1. VPS'te Build Kontrolü

VPS'e bağlanıp build durumunu kontrol et:

```bash
ssh root@46.4.123.77
cd /opt/faceseek/frontend

# Mevcut build'i kontrol et
ls -la .next/

# Build çıktısını kontrol et (eğer varsa)
cat .next/routes-manifest.json | grep admin
```

### 2. Temiz Build

Eski build'i tamamen temizleyip yeniden build et:

```bash
# Eski build'i sil
rm -rf .next
rm -rf node_modules/.cache

# Git güncellemelerini çek
git fetch origin
git pull origin main

# Dependencies kontrol et
npm install

# Yeni build oluştur
npm run build 2>&1 | tee build.log

# Build çıktısında admin route'larını kontrol et
grep -i "admin" build.log
```

### 3. Build Çıktısı Kontrolü

Build sonrası şu çıktıyı görmelisin:

```
✅ DOĞRU:
├ ● /[locale]/admin                    (dynamic)
├ ● /[locale]/admin/login              (dynamic)
├ ● /[locale]/admin/users              (dynamic)
├ ● /[locale]/admin/payments           (dynamic)
├ ● /[locale]/admin/scraping           (dynamic)
├ ● /[locale]/admin/notifications      (dynamic)

❌ YANLIŞ (Eğer böyle görünüyorsa sorun var):
├ ○ /admin                             (static - YANLIŞ!)
├ ○ /admin/login                       (static - YANLIŞ!)
```

### 4. Frontend Servisi Restart

```bash
# Servisi restart et
systemctl restart faceseek-frontend

# Durumu kontrol et
systemctl status faceseek-frontend

# Logları kontrol et
journalctl -u faceseek-frontend -n 100 --no-pager
```

### 5. Test

```bash
# Admin login sayfası
curl -I https://face-seek.com/tr/admin/login

# Admin dashboard
curl -I https://face-seek.com/tr/admin

# Beklenen: 200 OK veya 302 Redirect
# Alınan: 404 Not Found ise sorun devam ediyor
```

## Alternatif Çözüm: Manuel Route Kontrolü

Eğer build doğru ama hala 404 alıyorsan:

### 1. Next.js Config Kontrolü

```javascript
// frontend/next.config.mjs
export default withNextIntl(nextConfig);
```

### 2. Middleware Kontrolü

```typescript
// frontend/middleware.ts
export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

### 3. i18n Config Kontrolü

```typescript
// frontend/i18n.ts
export const locales = ['en', 'tr'] as const;
```

## Deployment Komutları (Tam Liste)

```bash
# 1. VPS'e bağlan
ssh root@46.4.123.77

# 2. Frontend dizinine git
cd /opt/faceseek/frontend

# 3. Mevcut durumu kaydet
cp -r .next .next.backup

# 4. Git güncellemelerini çek
git fetch origin
git pull origin main

# 5. Temiz build
rm -rf .next
rm -rf node_modules/.cache
npm install
npm run build

# 6. Build çıktısını kontrol et
# Admin route'larının /[locale]/admin/* formatında olduğunu doğrula

# 7. Servisi restart et
systemctl restart faceseek-frontend

# 8. Durumu kontrol et
systemctl status faceseek-frontend

# 9. Test et
curl -I https://face-seek.com/tr/admin/login
curl -I https://face-seek.com/tr/admin
```

## Sorun Devam Ederse

### Debug Adımları

1. **Build log kontrol et:**
```bash
cat build.log | grep -A 5 -B 5 "admin"
```

2. **Route manifest kontrol et:**
```bash
cat .next/routes-manifest.json | jq '.dynamicRoutes'
```

3. **Server log kontrol et:**
```bash
journalctl -u faceseek-frontend -n 200 --no-pager | grep -i "admin\|404\|error"
```

4. **Port kontrol et:**
```bash
netstat -tulpn | grep 3000
```

5. **Process kontrol et:**
```bash
ps aux | grep next
```

## Beklenen Sonuç

Build sonrası:
- ✅ `/tr/admin/login` → 200 OK (login sayfası)
- ✅ `/tr/admin` → 302 Redirect (login'e yönlendir) veya 200 OK (authenticated ise)
- ✅ `/en/admin/login` → 200 OK (login sayfası)
- ✅ `/en/admin` → 302 Redirect (login'e yönlendir) veya 200 OK (authenticated ise)
