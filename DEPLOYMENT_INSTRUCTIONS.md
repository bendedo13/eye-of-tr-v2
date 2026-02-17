# Admin Panel 404 Fix - Final Deployment Instructions

## 🎯 Yapılacaklar

1. Lokal değişiklikleri commit et
2. GitHub'a push et
3. VPS'te deployment script'ini çalıştır
4. Test et

---

## 📝 Yapılan Değişiklikler

### Admin Credentials Güncellendi
- **Eski:** `admin@faceseek.io` / `faceseek-admin-2026`
- **Yeni:** `admin@face-seek.com` / `Benalan.1`

### Düzeltilen Dosyalar
1. `frontend/app/[locale]/admin/page.tsx` - useEffect dependencies düzeltildi
2. `frontend/app/[locale]/admin/login/page.tsx` - Placeholder güncellendi
3. `frontend/app/[locale]/admin/scraping/page.tsx` - Locale kullanımı düzeltildi
4. `frontend/app/[locale]/admin/notifications/page.tsx` - Locale kullanımı düzeltildi
5. `frontend/__tests__/admin.test.mjs` - Test credentials güncellendi
6. `backend/main.py` - Default admin email ve password güncellendi
7. `backend/app/api/admin.py` - Fallback key güncellendi
8. `backend/app/api/admin_face_index.py` - Fallback key güncellendi
9. `backend/scripts/init_admin.py` - Default credentials güncellendi
10. `backend/scripts/create_admin_user.py` - Credentials güncellendi
11. `create_test_users.py` - Credentials güncellendi
12. `verify_auth_all.py` - Credentials güncellendi

---

## 🚀 Deployment Adımları

### Adım 1: Lokal Commit (Windows'ta yapılacak)

```powershell
# Git'e ekle
git add .

# Commit et
git commit -m "fix: admin panel 404 fix and credentials update

- Update admin credentials to admin@face-seek.com / Benalan.1
- Fix useEffect dependencies in admin dashboard
- Fix locale usage in scraping and notifications pages
- Update all admin-related scripts and tests
- Remove old admin credentials (admin@faceseek.io)
"

# Push et
git push origin main
```

### Adım 2: VPS'te Deployment

```bash
# VPS'e bağlan
ssh root@46.4.123.77

# Script'i çalıştır
cd /opt/faceseek
bash FINAL_ADMIN_FIX_DEPLOYMENT.sh
```

Script otomatik olarak:
- ✅ Git güncellemelerini çeker
- ✅ Backend .env'i günceller
- ✅ Database'de admin kullanıcısını günceller
- ✅ Frontend'i build eder
- ✅ Her iki servisi restart eder
- ✅ Test eder

### Adım 3: Manuel Test

```bash
# 1. Backend API test
curl --unix-socket /run/faceseek/backend.sock \
  http://localhost/api/admin/ping \
  -H 'x-admin-key: Benalan.1' \
  -H 'x-admin-email: admin@face-seek.com'

# Beklenen: {"status":"ok"}

# 2. Frontend test
curl -I https://face-seek.com/tr/admin/login
curl -I https://face-seek.com/tr/admin

# Beklenen: 200 OK veya 302/307 Redirect
```

### Adım 4: Tarayıcıda Test

1. `https://face-seek.com/tr/admin/login` aç
2. **Email:** `admin@face-seek.com`
3. **API Key:** `Benalan.1`
4. OTURUM AÇ butonuna tıkla
5. Dashboard'ın açıldığını kontrol et

---

## ⚠️ Sorun Devam Ederse

### Debug Adımları

```bash
# 1. Build log kontrol et
cat /tmp/frontend-build.log | grep -i admin

# 2. Route manifest kontrol et
cat /opt/faceseek/frontend/.next/routes-manifest.json | grep -i admin

# 3. Frontend log kontrol et
journalctl -u faceseek-frontend -n 100 --no-pager

# 4. Backend log kontrol et
journalctl -u faceseek-backend -n 100 --no-pager

# 5. Servis durumları
systemctl status faceseek-frontend --no-pager
systemctl status faceseek-backend --no-pager
```

### Rollback

```bash
# Backend .env rollback
cd /opt/faceseek/backend
cp .env.backup.* .env
systemctl restart faceseek-backend

# Frontend rollback
cd /opt/faceseek/frontend
git reset --hard HEAD~1
rm -rf .next
npm run build
systemctl restart faceseek-frontend
```

---

## ✅ Başarı Kriterleri

- [ ] Backend API ping çalışıyor (`{"status":"ok"}`)
- [ ] `/tr/admin/login` → 200 OK
- [ ] `/tr/admin` → 200 OK veya 302/307 Redirect
- [ ] `/en/admin/login` → 200 OK
- [ ] `/en/admin` → 200 OK veya 302/307 Redirect
- [ ] Login yapabiliyorum (admin@face-seek.com / Benalan.1)
- [ ] Dashboard açılıyor
- [ ] Admin sayfaları çalışıyor
- [ ] Logout çalışıyor
- [ ] Eski credentials çalışmıyor

---

## 📋 Checklist

### Lokal (Windows)
- [ ] Tüm dosyalar commit edildi
- [ ] GitHub'a push edildi

### VPS
- [ ] Git güncellemeleri çekildi
- [ ] Backend .env güncellendi
- [ ] Database admin kullanıcısı güncellendi
- [ ] Backend restart edildi
- [ ] Frontend build edildi
- [ ] Frontend restart edildi
- [ ] Backend API test edildi
- [ ] Frontend URL'leri test edildi

### Tarayıcı
- [ ] Login sayfası açılıyor
- [ ] Login yapabiliyorum
- [ ] Dashboard açılıyor
- [ ] Admin sayfaları çalışıyor
- [ ] Logout çalışıyor

---

## 🔐 Yeni Admin Bilgileri

**URL:** https://face-seek.com/tr/admin/login  
**Email:** admin@face-seek.com  
**API Key:** Benalan.1

---

**Hazırlayan:** Kiro AI  
**Tarih:** 17 Şubat 2026  
**Durum:** ✅ HAZIR - DEPLOYMENT BEKLİYOR
