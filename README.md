# EyeOfTR v2

Gelişmiş arama platformu. İki aktif özellik:

1. **AlanSearch** – Google Dork tabanlı arama (Türkçe karakter desteği)
2. **Konum Arama** – Nominatim/OpenStreetMap tabanlı ücretsiz konum arama

## Servis Portları

| Servis    | Port |
|-----------|------|
| Frontend  | 3002 |
| Backend   | 8003 |
| DB        | 5434 |
| Redis     | 6381 |

## Deploy (Cache Temizleme Dahil)

Docker cache sorunları için her deploy'da şu adımları uygulayın:

```bash
docker-compose down
docker builder prune -f
docker-compose build --no-cache
docker-compose up -d
sleep 30

# Sağlık kontrolleri
curl http://localhost:3002   # 200 veya 307 olmalı
curl http://localhost:8003/health  # {"status":"ok"} olmalı
```

## Deploy Öncesi Testler

```bash
# 1. Python syntax kontrolü
cd backend && python3 -m py_compile app/main.py

# 2. Python import kontrolü
python3 -c "import sys; sys.path.insert(0,'backend'); from app.main import app; print('OK')"

# 3. TypeScript kontrolü
cd frontend && npx tsc --noEmit
```

## API Endpoint'leri

- `GET /health` – Sağlık kontrolü
- `GET /api/health` – Sağlık kontrolü (Next.js rewrite uyumlu)
- `GET /api/search?q=<sorgu>` – AlanSearch (Türkçe destekli, 3 sn rate limit)
- `GET /api/location-search?q=<konum>` – Konum arama (Nominatim, 1 sn rate limit)
- `POST /api/auth/register` – Kullanıcı kaydı (`fullName`, `email`, `password`, `plan`)
- `POST /api/auth/login` – Kullanıcı girişi (`email`, `password`, `rememberMe`)
- `GET /api/auth/users/count` – Toplam kayıtlı kullanıcı sayısı

## Admin Paneli

`http://localhost:3002/admin` adresinden erişilebilir. Backend sağlık durumu, kullanıcı sayısı, aktif özellikler ve endpoint listesini gösterir.

## Doğrulama Komutları

```bash
# 1. Python syntax
cd backend && python3 -m py_compile app/main.py

# 2. Python import
python3 -c "import sys; sys.path.insert(0,'backend'); from app.main import app; print('OK')"

# 3. TypeScript
cd frontend && node_modules/.bin/tsc --noEmit

# 4. Sağlık kontrolü
curl http://localhost:8003/health          # {"status":"ok"}
curl http://localhost:8003/api/health      # {"status":"ok"}

# 5. Register endpoint testi
curl -s -X POST http://localhost:8003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test Kullanıcı","email":"test@example.com","password":"test123","plan":"free"}' \
  | python3 -m json.tool
```

## Çevre Değişkenleri

`BACKEND_URL` env değişkeni frontend container'ının backend'e ulaşması için kullanılır.
Docker ortamında iç port 8000 kullanılır (dış port 8003 olarak expose edilir):

```
BACKEND_URL=http://faceseek_backend:8000
```

Yerel geliştirme ortamında (varsayılan):
```
BACKEND_URL=http://localhost:8003
```
