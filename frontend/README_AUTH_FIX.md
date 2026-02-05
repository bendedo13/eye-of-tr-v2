# Auth & API Configuration Fix

## Sorun (The Problem)
Kullanıcılar "Kayıt Ol" veya "Giriş Yap" butonuna tıkladığında "404 Not Found" hatası alıyordu.
Bunun nedeni, Frontend (Next.js - Port 3000) sunucusunun, API isteklerini Backend (FastAPI - Port 8000) sunucusuna nasıl yönlendireceğini bilmemesiydi.

## Çözüm (The Solution)
`frontend/next.config.ts` dosyasına bir **Rewrite (Yönlendirme)** kuralı eklendi.

```typescript
// frontend/next.config.ts
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*", // Frontend'e gelen /api ile başlayan tüm istekleri...
        destination: "http://127.0.0.1:8000/api/:path*", // ...Backend'e yönlendir.
      },
    ];
  },
};
```

Bu sayede:
1. Frontend `http://localhost:3000/api/auth/login` adresine istek atar.
2. Next.js bunu arka planda `http://127.0.0.1:8000/api/auth/login` adresine iletir.
3. Kullanıcı tarayıcıda herhangi bir CORS hatası veya port karmaşası görmez.

## Kritik Uyarı (Critical Warning)
**Bu yapılandırma dosyası (`next.config.ts`) silinmemeli veya değiştirilmemelidir.**
Eğer bu dosya bozulursa, site üzerindeki tüm formlar (Giriş, Kayıt, Arama vb.) çalışmayı durdurur.

## Koruma (Regression Prevention)
Bu ayarın bozulmasını önlemek için özel bir test dosyası oluşturuldu:
`frontend/__tests__/config.test.ts`

Bu test, projenin her derlenmesinde veya test sürecinde API yönlendirmesinin doğru yapılandırılıp yapılandırılmadığını kontrol eder.
