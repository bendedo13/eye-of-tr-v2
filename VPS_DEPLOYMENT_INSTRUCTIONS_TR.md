# VPS Deployment Talimatları - Admin Panel

## 🚀 Hızlı Deployment

Admin panel güncellemelerini VPS'e deploy etmek için aşağıdaki adımları izleyin.

### Adım 1: VPS'e SSH ile Bağlan

```bash
ssh root@46.4.123.77
# Şifre: mvdBIH368
```

### Adım 2: Proje Dizinine Git

```bash
cd /opt/faceseek
```

### Adım 3: Git Güncellemelerini Çek

```bash
git fetch origin
git checkout claude/interesting-ellis
git pull origin claude/interesting-ellis
```

### Adım 4: Frontend'i Build Et

```bash
cd frontend
npm install
npm run build
```

### Adım 5: Frontend Servisini Yeniden Başlat

```bash
systemctl restart faceseek-frontend
```

### Adım 6: Nginx'i Yeniden Yükle

```bash
systemctl reload nginx
```

### Adım 7: Deployment'ı Doğrula

```bash
# Frontend servisi çalışıyor mu?
systemctl status faceseek-frontend

# Backend servisi çalışıyor mu?
systemctl status faceseek-backend

# Nginx çalışıyor mu?
systemctl status nginx
```

---

## 📋 Tüm Komutlar (Tek Seferde)

Aşağıdaki komutları kopyalayıp VPS'e yapıştırabilirsiniz:

```bash
cd /opt/faceseek && \
git fetch origin && \
git checkout claude/interesting-ellis && \
git pull origin claude/interesting-ellis && \
cd frontend && \
npm install && \
npm run build && \
systemctl restart faceseek-frontend && \
systemctl reload nginx && \
echo "✅ Deployment tamamlandı!"
```

---

## 🌐 Admin Panel Erişim

Deployment tamamlandıktan sonra admin paneline aşağıdaki adreslerden erişebilirsiniz:

### Türkçe
```
https://46.4.123.77/tr/admin
```

### İngilizce
```
https://46.4.123.77/en/admin
```

### Admin Giriş Bilgileri
- **Email**: admin@faceseek.io
- **API Key**: `.env` dosyasında `ADMIN_API_KEY` değerini kontrol edin

---

## ✅ Yeni Admin Sayfaları

Deployment sonrası aşağıdaki admin sayfaları kullanılabilir olacak:

### 👥 Kullanıcı Yönetimi
- Tüm kullanıcıları listele
- Kullanıcıları ara ve filtrele
- Kullanıcı kredilerini görüntüle
- Kullanıcı durumunu yönet

### 💳 Ödeme Yönetimi
- Tüm ödemeleri görüntüle
- Ödeme durumunu filtrele
- Ödeme geçmişini takip et

### 🏦 Banka Transferleri
- Transfer taleplerini yönet
- Transferleri onayla/reddet
- Transfer durumunu takip et

### 📝 Blog Yönetimi
- Blog yazıları oluştur/düzenle/sil
- Blog yazılarını ara
- Blog içeriğini yönet

### 📊 Denetim Günlükleri
- Sistem aktivitelerini izle
- Admin eylemlerini takip et
- Sistem değişikliklerini görüntüle

### 🎨 Medya Yönetimi
- Medya dosyalarını yükle
- Medya kütüphanesini yönet
- Medya varlıklarını organize et

### 💰 Fiyatlandırma
- Fiyatlandırma planlarını görüntüle
- Fiyatlandırma katmanlarını düzenle

### ⚙️ Sistem Ayarları
- Site ayarlarını yapılandır
- Bakım modunu aç/kapat

### 📧 İletişim
- Kullanıcılara e-posta gönder
- Bildirim gönder
- Kullanıcı gruplarını hedefle

### 🎫 Destek Biletleri
- Destek biletlerini yönet
- Müşteri taleplerini takip et

### 📄 Yasal İçerik
- Hizmet şartlarını yönet
- Gizlilik politikasını yönet
- Çerez politikasını yönet

### 🏠 Ana Sayfa Medyası
- Ana sayfa bannerlarını yönet
- Hero bölümlerini yapılandır

### 🎁 Referanslar
- Referans takibini görüntüle
- Referans ödüllerini yönet

### 👥 Misafir Talepleri
- Misafir banka transfer taleplerini görüntüle

---

## 🔍 Sorun Giderme

### Frontend Build Hatası
```bash
cd /opt/faceseek/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Servis Başlamıyor
```bash
# Log'ları kontrol et
journalctl -u faceseek-frontend -n 50 -f

# Servisi manuel olarak başlat
systemctl start faceseek-frontend
```

### Nginx Hatası
```bash
# Nginx konfigürasyonunu test et
nginx -t

# Nginx'i yeniden başlat
systemctl restart nginx
```

### Git Hatası
```bash
# Git durumunu kontrol et
git status

# Değişiklikleri sıfırla
git reset --hard origin/claude/interesting-ellis
```

---

## 📞 Destek

Deployment sırasında sorun yaşarsanız:

1. **Log'ları kontrol edin**:
   ```bash
   journalctl -u faceseek-frontend -n 100
   journalctl -u faceseek-backend -n 100
   ```

2. **Servislerin durumunu kontrol edin**:
   ```bash
   systemctl status faceseek-frontend
   systemctl status faceseek-backend
   systemctl status nginx
   ```

3. **Disk alanını kontrol edin**:
   ```bash
   df -h
   ```

4. **Bellek kullanımını kontrol edin**:
   ```bash
   free -h
   ```

---

## ✨ Deployment Tamamlandı!

Admin panel başarıyla deploy edildi. Artık tüm yönetim özelliklerini kullanabilirsiniz.

**Durum**: ✅ TAMAMLANDI
