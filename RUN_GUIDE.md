# Face Seek (eye-of-tr-v2) Çalıştırma Rehberi

## Backend (FastAPI)
- Konum: [backend](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend)
- Gerekli ortam değişkeni: `SECRET_KEY`

### Kurulum
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

`.env` içine en az şunu koy:
```env
SECRET_KEY=dev-secret
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Local çalıştırma
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### VPS (gunicorn/uvicorn worker)
```bash
cd backend
gunicorn -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 main:app
```

### Endpointler
- `GET /health`
- `POST /upload-face` (FAISS’e ekler)
- `POST /search-face` (FAISS’te arar)
- Mevcut OSINT akışı (korundu):
  - `POST /api/upload`
  - `POST /api/search`

### Upload servisleri
- Backend, `backend/uploads` klasörünü `/uploads` altında statik servis eder.
  - Örnek: `http://localhost:8000/uploads/faces/<filename>`

## Frontend (Next.js)
- Konum: [frontend](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/frontend)

### Kurulum
```bash
cd frontend
npm install
```

`.env` (frontend) içine backend URL’i:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Local çalıştırma
```bash
cd frontend
npm run dev
```

## Nginx (Reverse Proxy) Örneği
```nginx
server {
  server_name face-seek.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:8000/uploads/;
  }
}
```

## Test Senaryosu (1 foto, 3 benzer sonuç)
```bash
cd backend
python scripts/test_faiss_scenario.py
```
