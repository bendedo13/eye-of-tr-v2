# Güvenlik Notları (Security Notes)

## Yapılanlar

- JWT tabanlı kimlik doğrulama
- Bcrypt ile şifre hashleme
- Email validasyonu (Pydantic EmailStr)
- SQLAlchemy ile parametreli sorgular (SQL injection koruması)

## Dikkat Edilmesi Gerekenler / Güvenlik Açıkları

### 1. SECRET_KEY
- **Risk:** Varsayılan `SECRET_KEY` production'da kullanılmamalı.
- **Çözüm:** `.env` ile `SECRET_KEY` ayarla: `openssl rand -hex 32`

### 2. JWT Token Saklama (Frontend)
- **Risk:** Token `localStorage`'da saklanıyor; XSS ile çalınabilir.
- **Çözüm:** `httpOnly` cookie kullan veya token süresini kısalt, refresh token ekle.

### 3. CORS
- **Risk:** `CORS_ORIGINS: ["*"]` tüm origin'lere izin veriyor.
- **Çözüm:** Production'da sadece frontend domain'lerini whitelist'e al.

### 4. Şifre Politikası
- **Risk:** Sadece min 6 karakter; zayıf şifrelere izin veriyor.
- **Çözüm:** Güçlü şifre kuralları (büyük/küçük harf, rakam, özel karakter) ekle.

### 5. Rate Limiting
- **Risk:** Login/register endpoint'lerinde brute-force koruması yok.
- **Çözüm:** `slowapi` veya benzeri ile rate limit ekle.

### 6. HTTPS
- **Risk:** Production'da HTTP kullanımı token'ı açığa çıkarabilir.
- **Çözüm:** Her zaman HTTPS kullan.

### 7. Upload Endpoint
- **Risk:** `/api/upload` ve `/api/search` JWT ile korunmuyor; herkes erişebilir.
- **Çözüm:** Gerekirse bu endpoint'leri `Depends(get_current_user)` ile koru.

### 8. Token Süresi
- **Risk:** 24 saat uzun; token çalınırsa uzun süre geçerli kalır.
- **Çözüm:** Kısa access token (15–60 dk) + refresh token kullan.
