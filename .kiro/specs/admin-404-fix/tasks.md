# Admin Panel 404 Sorunu Düzeltme - Görevler

## 1. Kod Düzeltmeleri

### 1.1 Scraping Sayfası Locale Düzeltmesi
- [ ] `frontend/app/[locale]/admin/scraping/page.tsx` dosyasında hardcoded `/tr/admin/login` kullanımını `/${locale}/admin/login` ile değiştir
- [ ] `useLocale()` hook'unun import edildiğinden emin ol

### 1.2 Notifications Sayfası Locale Düzeltmesi
- [ ] `frontend/app/[locale]/admin/notifications/page.tsx` dosyasında hardcoded `/tr/admin/login` kullanımını `/${locale}/admin/login` ile değiştir
- [ ] `useLocale()` hook'unun import edildiğinden emin ol

## 2. Test ve Doğrulama

### 2.1 Kod İncelemesi
- [ ] Tüm admin sayfalarında hardcoded locale kullanımı olup olmadığını kontrol et
- [ ] Değiştirilen dosyalarda syntax hatası olmadığını kontrol et

### 2.2 Manuel Test (Lokal)
- [ ] `/tr/admin/login` sayfasını aç ve giriş yap
- [ ] Dashboard'a yönlendirildiğini kontrol et
- [ ] Scraping sayfasına git ve logout yap
- [ ] Login sayfasına yönlendirildiğini ve locale'in `/tr/` olduğunu kontrol et
- [ ] Notifications sayfasına git ve logout yap
- [ ] Login sayfasına yönlendirildiğini ve locale'in `/tr/` olduğunu kontrol et
- [ ] İngilizce locale ile aynı testleri tekrarla (`/en/admin/login`)

### 2.3 Build Testi
- [ ] `npm run build` çalıştır
- [ ] Build çıktısında admin sayfalarının `/[locale]/admin/*` formatında olduğunu kontrol et
- [ ] Locale olmayan `/admin/*` formatında sayfa olmadığını kontrol et

## 3. Deployment

### 3.1 Git İşlemleri
- [ ] Değişiklikleri commit et: `fix(admin): use dynamic locale in admin redirects`
- [ ] GitHub'a push et

### 3.2 VPS Deployment
- [ ] VPS'e bağlan (`ssh root@46.4.123.77`)
- [ ] Frontend dizinine git (`cd /opt/faceseek/frontend`)
- [ ] Git güncellemelerini çek (`git pull origin main`)
- [ ] Eski build'i temizle (`rm -rf .next`)
- [ ] Yeni build oluştur (`npm run build`)
- [ ] Build çıktısını kontrol et
- [ ] Frontend servisini yeniden başlat (`systemctl restart faceseek-frontend`)
- [ ] Servis durumunu kontrol et (`systemctl status faceseek-frontend`)

### 3.3 Production Test
- [ ] `https://face-seek.com/tr/admin/login` aç
- [ ] Giriş yap (Email: `admin@faceseek.io`, API Key: `faceseek-admin-2026`)
- [ ] Dashboard'a yönlendirildiğini kontrol et
- [ ] Scraping sayfasına git
- [ ] Notifications sayfasına git
- [ ] Logout yap ve login sayfasına yönlendirildiğini kontrol et
- [ ] İngilizce locale ile test et (`https://face-seek.com/en/admin/login`)

## 4. Dokümantasyon

### 4.1 Kod Yorumları
- [ ] Değiştirilen satırlara açıklayıcı yorum ekle

### 4.2 Rapor Güncelleme
- [ ] `ADMIN_404_FIX_RAPORU.md` dosyasını güncelle
- [ ] Yapılan değişiklikleri ve test sonuçlarını ekle

## 5. Doğrulama

### 5.1 Başarı Kriterleri Kontrolü
- [ ] `/tr/admin/login` 404 vermiyor
- [ ] `/en/admin/login` 404 vermiyor
- [ ] Login sonrası dashboard'a yönlendirme çalışıyor
- [ ] Tüm admin sayfaları erişilebilir
- [ ] Scraping sayfasından logout çalışıyor
- [ ] Notifications sayfasından logout çalışıyor
- [ ] Build çıktısı `/[locale]/admin/*` formatında

### 5.2 Performans Kontrolü
- [ ] Admin login süresi < 2 saniye
- [ ] Sayfa yükleme süresi < 1 saniye
- [ ] API response süresi < 500ms

## 6. Cleanup

### 6.1 Geçici Dosyalar
- [ ] Build cache temizlenmiş mi kontrol et
- [ ] Gereksiz log dosyaları temizlenmiş mi kontrol et

### 6.2 Final Kontrol
- [ ] Tüm testler başarılı
- [ ] Production'da sorun yok
- [ ] Dokümantasyon güncel
