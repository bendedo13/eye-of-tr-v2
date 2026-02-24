# FACESEEK - AI YAZILIM UZMANI KURALLARI

##  PROJENİN AMACI
FaceSeek, fotoğraftan kişi bulma platformudur. İki ana özellik:
1. **AlanSearch**  Google Dork tabanlı gelişmiş arama (EN KRİTİK ÖZELLİK)
2. **Location Search (efix)**  Konum bazlı kişi arama

**Ana odak:** AlanSearch %100 hatasız çalışmalı. Location Search ikinci öncelik.

##  MİMARİ
- Frontend: Next.js port 3002
- Backend: FastAPI port 8003
- DB: PostgreSQL port 5434
- Redis: port 6381
- PRICING_PLANS: backend/app/constants.py (circular import olmamalı)

##  ZORUNLU KURALLAR
1. Docker portlarına dokunma: 3002, 8003, 5434, 6381
2. circular import yasak: pricing.py ve pricing_service.py arasında
3. PRICING_PLANS sadece app/constants.py'de tanımlanır
4. .env dosyasına dokunma: SECRET_KEY, POSTGRES_PASSWORD kritik
5. frontend/Dockerfile'a dokunma: RUN npx prisma generate && npm run build korunmalı
6. docker-compose.yml portlarına dokunma

##  DEPLOY KURALI (EN ÖNEMLİ)
Deploy edildi ama değişiklik görünmüyorsa sebep Docker cache.
Her deploy'da ZORUNLU adımlar:
```bash
docker-compose down
docker builder prune -f
docker-compose build --no-cache
docker-compose up -d
sleep 30
curl http://localhost:3002  # 200 veya 307 olmalı
curl http://localhost:8003/health  # 200 olmalı
```
HTTP 200 gelmeden başarılı SAYMA.

##  DEPLOY ÖNCESİ ZORUNLU TESTLER
```bash
# 1. Python syntax
cd /root/eye-of-tr-v2/backend && python3 -m py_compile app/main.py

# 2. Import kontrolü
python3 -c "import sys; sys.path.insert(0,'backend'); from app.main import app; print('OK')"

# 3. TypeScript
cd /root/eye-of-tr-v2/frontend && npx tsc --noEmit

# 4. Docker build başarılı mı
docker-compose build --no-cache 2>&1 | tail -3 | grep -i "built\|error"
```
Tüm testler geçmeden commit ve push YAPMA.

##  ALANSERACH KURALLARI
- Türkçe karakter desteği zorunlu (ö,ü,ş,ı,ğ,ç)
- Rate limiting ekle, Google engelini önle (2-3 sn bekleme)
- Sonuç bulunamazsa fallback mesaj göster
- Arama süresi 30 saniyeyi geçmemeli
- Her arama search_logs tablosuna yazılmalı

##  LOCATION SEARCH (EFİX) KURALLARI
- Ücretsiz API kullan: Nominatim, OpenStreetMap
- Rate limit: max 1 istek/saniye

##  ÜCRETSİZ API LİSTESİ
- Nominatim (OpenStreetMap)
- SerpApi free tier
- DuckDuckGo API
- Bing Web Search free tier
YASAK: Ücretli API anahtarı gerektiren servisler
