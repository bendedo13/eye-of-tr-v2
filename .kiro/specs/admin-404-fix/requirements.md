# Admin Panel 404 Sorunu Düzeltme - Gereksinimler

## 1. Sorun Tanımı

Admin paneline giriş yapılamıyor, 404 hatası ve beyaz ekran görünüyor.

### 1.1 Kullanıcı Bildirimi
- Admin paneline giriş yapılamıyor
- 404 hatası alınıyor
- Beyaz ekran açılıyor

### 1.2 Beklenen Davranış
- Admin login sayfası açılmalı (`/tr/admin/login` veya `/en/admin/login`)
- Giriş yapıldıktan sonra admin dashboard görünmeli
- Tüm admin sayfaları erişilebilir olmalı

## 2. Kabul Kriterleri

### 2.1 Admin Login Sayfası Erişimi
**Kullanıcı Hikayesi:** Admin olarak, login sayfasına erişebilmeliyim.

**Kabul Kriterleri:**
- `/tr/admin/login` URL'i 404 vermemeli
- `/en/admin/login` URL'i 404 vermemeli
- Login formu görünür olmalı
- Email ve API key alanları çalışmalı

### 2.2 Admin Dashboard Erişimi
**Kullanıcı Hikayesi:** Admin olarak, giriş yaptıktan sonra dashboard'a yönlendirilmeliyim.

**Kabul Kriterleri:**
- Login başarılı olduktan sonra `/tr/admin` veya `/en/admin` sayfasına yönlendirme yapılmalı
- Dashboard sayfası 404 vermemeli
- İstatistikler görünür olmalı
- Sidebar menü çalışmalı

### 2.3 Tüm Admin Sayfaları Erişilebilir
**Kullanıcı Hikayesi:** Admin olarak, tüm admin sayfalarına erişebilmeliyim.

**Kabul Kriterleri:**
- `/[locale]/admin/users` - Kullanıcılar sayfası
- `/[locale]/admin/payments` - Ödemeler sayfası
- `/[locale]/admin/settings` - Ayarlar sayfası
- `/[locale]/admin/notifications` - Bildirimler sayfası
- Diğer tüm admin alt sayfaları

### 2.4 Locale-Based Routing
**Kullanıcı Hikayesi:** Admin olarak, hem Türkçe hem İngilizce admin paneline erişebilmeliyim.

**Kabul Kriterleri:**
- `/tr/admin/*` URL'leri çalışmalı
- `/en/admin/*` URL'leri çalışmalı
- Locale değişimi sorunsuz çalışmalı

## 3. Teknik Gereksinimler

### 3.1 Routing Yapısı
- Tüm admin sayfaları `app/[locale]/admin/` altında olmalı
- Locale-based routing kullanılmalı
- Middleware doğru çalışmalı

### 3.2 Build Çıktısı
- Build sırasında admin sayfaları `● /[locale]/admin/*` formatında görünmeli
- Statik olmayan `○ /admin/*` formatında sayfa olmamalı

### 3.3 Authentication
- Admin authentication kontrolü çalışmalı
- Yetkisiz erişimde login sayfasına yönlendirme yapılmalı
- localStorage'da admin key kontrolü yapılmalı

## 4. Test Senaryoları

### 4.1 Manuel Test
1. Tarayıcıda `https://face-seek.com/tr/admin/login` aç
2. Email: `admin@faceseek.io` gir
3. API Key: `faceseek-admin-2026` gir
4. "OTURUM AÇ" butonuna tıkla
5. Dashboard'a yönlendirildiğini kontrol et
6. Sidebar menüden farklı sayfalara git
7. Tüm sayfaların açıldığını kontrol et

### 4.2 Otomatik Test
- Admin login endpoint testi
- Admin dashboard render testi
- Routing testi
- Authentication testi

## 5. Kısıtlamalar

### 5.1 Kod Değişikliği
- Mevcut kodlara zarar verilmemeli
- Sadece gerekli düzeltmeler yapılmalı
- Geriye dönük uyumluluk korunmalı

### 5.2 Kalıcılık
- Düzeltme kalıcı olmalı
- Build sonrası sorun tekrar etmemeli
- VPS deployment sonrası çalışmalı

## 6. Başarı Metrikleri

- ✅ Admin login sayfası 404 vermemeli
- ✅ Admin dashboard erişilebilir olmalı
- ✅ Tüm admin sayfaları çalışmalı
- ✅ Build çıktısı doğru formatı göstermeli
- ✅ VPS'te production ortamında çalışmalı
