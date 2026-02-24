# FACESEEK - GÖREV LİSTESİ

##  GÖREV ALMA KURALLARI
Sen kıdemli bir full-stack yazılım uzmanısın.
Görev aldığında sırayla uygula:
1. Görevi anla
2. Etkilenecek dosyaları belirle
3. Değişikliği yap
4. Testleri çalıştır
5. %100 başarılı olana kadar düzelt
6. Sadece sonra commit + push + deploy et

KESİNLİKLE: Test geçmeden deploy etme. HTTP 200 zorunlu.

##  AKTİF GÖREVLER

### P0 - KRİTİK
#### GÖREV-001: Deploy Sonrası Değişiklik Görünmüyor
Problem: Deploy edildi ama canlıda değişiklik yok
Sebep: Docker cache eski image kullanıyor
Çözüm: Her deploy'da --no-cache kullan, deploy sonrası curl ile doğrula

#### GÖREV-002: AlanSearch Türkçe Karakter
Problem: ö,ü,ş,ı,ğ,ç aramada bozuluyor
Dosya: frontend/src/components/AlanSearch veya ilgili API endpoint
Çözüm: URL encode ile Türkçe karakterleri düzgün gönder
Test: curl "http://localhost:8003/api/search?q=Ahmet%20%C3%96zt%C3%BCrk"

#### GÖREV-003: AlanSearch Rate Limiting
Problem: Google arama isteği çok hızlı, IP engeli
Çözüm: İstekler arası 2-3 saniye beklet, retry mekanizması ekle

### P1 - YÜKSEK ÖNCELİK
#### GÖREV-004: Location Search Ücretsiz API
Problem: Ücretli API kullanıyor
Çözüm: Nominatim ile değiştir
Test: curl "http://localhost:8003/api/location-search?q=Istanbul"

#### GÖREV-005: AlanSearch Boş Sonuç Fallback
Problem: Sonuç bulunamadığında anlamsız hata
Çözüm: "Sonuç bulunamadı, farklı anahtar kelime deneyin" mesajı

### P2 - NORMAL
#### GÖREV-006: Dashboard İstatistikleri
Açıklama: Admin panelde günlük/haftalık arama istatistikleri

#### GÖREV-007: Arama Geçmişi
Açıklama: Kullanıcı önceki aramalarını görebilmeli

#### GÖREV-008: Export CSV
Açıklama: Arama sonuçlarını CSV olarak indir

##  GÖREV TAMAMLAMA FORMU
GÖREV: [ad]
DURUM: TAMAMLANDI
DEGISEN DOSYALAR: [liste]
TEST: HTTP [kod]
COMMIT: [hash]
