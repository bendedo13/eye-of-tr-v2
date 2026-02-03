# Face Seek Mimari Özeti

## Klasör Yapısı
- Backend (FastAPI): [backend](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend)
  - FastAPI giriş noktası: [main.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/main.py)
  - Router’lar: [app/api](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/api)
  - Core config: [config.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/core/config.py)
  - FAISS servisleri: [faiss_service.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/services/faiss_service.py)
  - Embedding servisleri: [embedding_service.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/services/embedding_service.py)
  - FaceCheck adapter: [facecheck_adapter.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/adapters/facecheck_adapter.py)
  - Statik dosyalar: `backend/uploads` → `/uploads`
  - FAISS kalıcılık: `backend/faiss`

- Frontend (Next.js): [frontend](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/frontend)
  - Face search sayfası: [page.tsx](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/frontend/app/%5Blocale%5D/search/page.tsx)

## Veri Akışı
### Local FAISS arama
1. Kullanıcı frontend’de fotoğraf seçer.
2. Frontend `POST /search-face` ile backend’e dosyayı gönderir.
3. Backend embedding çıkarır (`embedding_service`).
4. Backend FAISS index içinde `top_k` arama yapar (`faiss_service`).
5. Backend sonuçları normalize edip frontend’e döner; frontend kartlar halinde gösterir.

### FAISS’e kayıt (enrollment)
1. `POST /upload-face` ile yüz görseli yüklenir.
2. Backend embedding çıkarır ve FAISS index’e ekler.
3. `backend/faiss` altında index + metadata kalıcı tutulur.

## FAISS Nerede Çalışıyor
- FAISS index dosyası ve metadata: `backend/faiss/`
- FAISS yönetimi: [faiss_service.py](file:///c:/Users/Asus/Desktop/eye-of-tr-v2/backend/app/services/faiss_service.py)

## Frontend ↔ Backend İletişimi
- Frontend backend URL’i `NEXT_PUBLIC_API_URL` ile belirler.
- Backend CORS origin listesi `CORS_ORIGINS` ile kontrol edilir.
