# Auth & API Configuration Fix

## Sorun (The Problem)
Kullanıcılar "Kayıt Ol" veya "Giriş Yap" butonuna tıkladığında "404 Not Found" hatası alıyordu.
Bunun nedeni, Frontend (Next.js - Port 3000) sunucusunun, API isteklerini Backend (FastAPI - Port 8000) sunucusuna nasıl yönlendireceğini bilmemesiydi.

## Çözüm (The Solution)
`frontend/next.config.mjs` dosyasına bir **Rewrite (Yönlendirme)** kuralı eklendi.

```javascript
// frontend/next.config.mjs
const nextConfig = {
  async rewrites() {
    const apiUrl = process.env.SERVER_API_URL || 'http://localhost:8000';
    console.log(`Rewriting /api requests to: ${apiUrl}`);
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};
```

Bu sayede:
1. Frontend `http://localhost:3000/api/auth/login` adresine istek atar.
2. Next.js bunu arka planda `SERVER_API_URL` ortam değişkenine göre yönlendirir:
   - **Development:** `http://localhost:8000/api/auth/login`
   - **Production (VPS):** `http://unix:/run/faceseek/backend.sock/api/auth/login`
   - **Docker:** `http://backend:8000/api/auth/login`
3. Kullanıcı tarayıcıda herhangi bir CORS hatası veya port karmaşası görmez.

## Environment Variables

### Development (.env.local):
```env
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://localhost:8000
```

### Production VPS (.env.local):
```env
NEXT_PUBLIC_API_BASE_URL=/api
SERVER_API_URL=http://unix:/run/faceseek/backend.sock
```

### Docker (docker-compose.yml):
```env
NEXT_PUBLIC_API_BASE_URL=
SERVER_API_URL=http://backend:8000
```

## Kritik Uyarı (Critical Warning)
**Bu yapılandırma dosyası (`next.config.mjs`) silinmemeli veya değiştirilmemelidir.**
Eğer bu dosya bozulursa, site üzerindeki tüm formlar (Giriş, Kayıt, Arama vb.) çalışmayı durdurur.

**Önemli:** `SERVER_API_URL` ortam değişkeni her ortam için doğru ayarlanmalıdır.

## Koruma (Regression Prevention)
Bu ayarın bozulmasını önlemek için özel bir test dosyası oluşturuldu:
`frontend/__tests__/config.test.ts`

Bu test, projenin her derlenmesinde veya test sürecinde API yönlendirmesinin doğru yapılandırılıp yapılandırılmadığını kontrol eder.

## Troubleshooting

### 404 Not Found hatası alıyorsanız:
1. `SERVER_API_URL` ortam değişkenini kontrol edin
2. Backend'in çalıştığını doğrulayın
3. Nginx/Reverse proxy yapılandırmasını kontrol edin (production)

### CORS hatası alıyorsanız:
1. Backend'in `CORS_ORIGINS` ayarını kontrol edin
2. Production domain'in CORS listesinde olduğundan emin olun
