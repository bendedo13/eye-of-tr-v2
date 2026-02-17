# VPS'te Admin Panel 404 Düzeltme Komutları

## Hızlı Çözüm (Önerilen)

VPS'e bağlan ve şu komutları sırayla çalıştır:

```bash
# 1. VPS'e bağlan
ssh root@46.4.123.77

# 2. Frontend dizinine git
cd /opt/faceseek/frontend

# 3. Deployment script'ini çalıştır
bash VPS_DEPLOYMENT_ADMIN_FIX.sh
```

Script otomatik olarak:
- ✅ Backup oluşturur
- ✅ Git güncellemelerini çeker
- ✅ Eski build'i temizler
- ✅ Yeni build oluşturur
- ✅ Servisi restart eder
- ✅ Test eder

---

## Manuel Çözüm (Script yoksa)

Eğer script dosyası VPS'te yoksa, şu komutları manuel çalıştır:

```bash
# 1. VPS'e bağlan
ssh root@46.4.123.77

# 2. Frontend dizinine git
cd /opt/faceseek/frontend

# 3. Backup oluştur
cp -r .next .next.backup.$(date +%Y%m%d_%H%M%S)

# 4. Git güncellemelerini çek
git fetch origin
git pull origin main

# 5. Eski build'i tamamen temizle
rm -rf .next
rm -rf node_modules/.cache

# 6. Dependencies yükle
npm install

# 7. Yeni build oluştur (çıktıyı kaydet)
npm run build 2>&1 | tee build.log

# 8. Build çıktısında admin route'larını kontrol et
echo ""
echo "=== Admin Route'ları ==="
grep -i "admin" build.log | grep -E "├|└"
echo ""

# 9. Admin route'larının doğru formatını kontrol et
if grep -q "\[locale\]/admin" build.log; then
    echo "✓ Admin route'ları DOĞRU formatta: /[locale]/admin/*"
else
    echo "✗ UYARI: Admin route'ları YANLIŞ formatta!"
    echo "Build log'u kontrol et: cat build.log | grep admin"
fi

# 10. Frontend servisini restart et
systemctl restart faceseek-frontend

# 11. Servis durumunu kontrol et
systemctl status faceseek-frontend --no-pager -n 10

# 12. Test et
echo ""
echo "=== HTTP Status Test ==="
echo "TR Login: $(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin/login)"
echo "TR Admin: $(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/tr/admin)"
echo "EN Login: $(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin/login)"
echo "EN Admin: $(curl -s -o /dev/null -w "%{http_code}" https://face-seek.com/en/admin)"
echo ""
```

---

## Beklenen Sonuçlar

### Build Çıktısı (DOĞRU)

```
✅ DOĞRU:
Route (app)                              Size     First Load JS
├ ● /[locale]/admin                      1.2 kB         100 kB
├ ● /[locale]/admin/login                800 B          95 kB
├ ● /[locale]/admin/users                1.5 kB         102 kB
├ ● /[locale]/admin/payments             1.3 kB         101 kB
├ ● /[locale]/admin/scraping             2.1 kB         105 kB
├ ● /[locale]/admin/notifications        1.8 kB         103 kB
```

### Build Çıktısı (YANLIŞ - Eğer böyle görünüyorsa sorun var!)

```
❌ YANLIŞ:
Route (app)                              Size     First Load JS
├ ○ /admin                               1.2 kB         100 kB
├ ○ /admin/login                         800 B          95 kB
```

### HTTP Status Test (DOĞRU)

```
✅ DOĞRU:
TR Login: 200
TR Admin: 200 veya 302
EN Login: 200
EN Admin: 200 veya 302
```

### HTTP Status Test (YANLIŞ)

```
❌ YANLIŞ:
TR Login: 404
TR Admin: 404
EN Login: 404
EN Admin: 404
```

---

## Sorun Devam Ederse

### 1. Build Log Detaylı İnceleme

```bash
# Tüm admin route'larını göster
cat build.log | grep -i admin

# Build hatalarını göster
cat build.log | grep -i "error\|failed\|warning"

# Route manifest kontrol et
cat .next/routes-manifest.json | grep -i admin
```

### 2. Servis Log Kontrolü

```bash
# Son 100 satır log
journalctl -u faceseek-frontend -n 100 --no-pager

# Hata logları
journalctl -u faceseek-frontend -n 200 --no-pager | grep -i "error\|404\|failed"

# Real-time log takibi
journalctl -u faceseek-frontend -f
```

### 3. Port ve Process Kontrolü

```bash
# Port 3000 dinleniyor mu?
netstat -tulpn | grep 3000

# Next.js process çalışıyor mu?
ps aux | grep next

# Frontend servisi çalışıyor mu?
systemctl is-active faceseek-frontend
```

### 4. Nginx Konfigürasyonu (Eğer kullanılıyorsa)

```bash
# Nginx config kontrol et
nginx -t

# Nginx restart
systemctl restart nginx

# Nginx log
tail -f /var/log/nginx/error.log
```

---

## Rollback (Sorun çözülmezse)

```bash
# Eski build'i geri yükle
cd /opt/faceseek/frontend
rm -rf .next
mv .next.backup.* .next

# Servisi restart et
systemctl restart faceseek-frontend

# Test et
curl -I https://face-seek.com/tr/admin/login
```

---

## Test Checklist

Deployment sonrası şunları test et:

- [ ] `/tr/admin/login` → 200 OK (login sayfası açılıyor)
- [ ] `/en/admin/login` → 200 OK (login sayfası açılıyor)
- [ ] `/tr/admin` → 200 veya 302 (dashboard veya login'e yönlendirme)
- [ ] `/en/admin` → 200 veya 302 (dashboard veya login'e yönlendirme)
- [ ] Login yapabiliyorum
- [ ] Dashboard açılıyor
- [ ] Scraping sayfası açılıyor
- [ ] Notifications sayfası açılıyor
- [ ] Logout çalışıyor

---

## İletişim

Sorun devam ederse:
1. Build log'u paylaş: `cat build.log`
2. Servis log'u paylaş: `journalctl -u faceseek-frontend -n 100`
3. HTTP status sonuçlarını paylaş
