## Canlıda Değişiklik Görünmüyor: Sistematik Kontrol

Bu doküman FaceSeek (bu repo) için canlı ortamda “değişiklikler görünmüyor” sorununu kök nedenine indirgemek için kontrol listesidir.

### 1) Hangi Kod Gerçekte Çalışıyor?

- Sunucuda doğru repo dizininde misin?
  - `ls -la /opt/faceseek`
- Sunucuda çalışan commit gerçekten son commit mi?
  - `cd /opt/faceseek && git rev-parse HEAD && git log -1 --oneline`
- Frontend tarafında bu repoda iki farklı Next.js klasörü olabilir:
  - `frontend/` ve `front/` birlikte varsa yanlış klasörü build ediyor olabilirsin.
  - Çalışan servis hangi dizinden kalkıyor kontrol et:
    - `systemctl cat faceseek-frontend`
    - `ps aux | grep -E "next (start|dev)" | grep -v grep`
    - `ls -la /proc/$(pgrep -n node)/cwd`

### 2) Build Gerçekten Güncellendi mi?

- Build çıktısı güncel mi?
  - `cd /opt/faceseek/frontend && ls -la .next | head`
- Eski build cache’i temizleyip tekrar dene:
  - `rm -rf .next node_modules/.cache`
  - `npm install`
  - `npm run build`
  - `systemctl restart faceseek-frontend`

### 3) Backend Gerçekten Güncellendi mi?

- Servis hangi entrypoint ile çalışıyor?
  - `systemctl cat faceseek-backend`
- Sağlık kontrolü (Unix socket):
  - `curl --unix-socket /run/faceseek/backend.sock http://localhost/health`
- Health endpoint (Nginx üzerinden):
  - `curl -k https://face-seek.com/health`
  - `curl -k https://face-seek.com/api/health`

### 4) Nginx Yanlış Config’i mi Kullanıyor?

- Aktif config dump al:
  - `nginx -T | sed -n '1,200p'`
- 443 (SSL) server block’un gerçekten FaceSeek’e mi ait?
  - `grep -r "listen 443" /etc/nginx/sites-enabled /etc/nginx/conf.d -n`
- Hata görürsen:
  - `nginx -t`
  - `journalctl -xeu nginx.service`

### 5) Cache / CDN / Tarayıcı Etkisi

- Yanıt header’larını kontrol et:
  - `curl -I https://face-seek.com/tr/pricing`
- Cloudflare/benzeri CDN varsa:
  - Cache purge yap
  - “Cache Everything” gibi ayarlar varsa devre dışı bırak
- Tarayıcı:
  - Hard refresh (Ctrl+F5)
  - Incognito / farklı cihaz testi

### 6) Next.js Uygulama Cache’i

- Pricing gibi dinamik sayfalarda veri client-side fetch ile çekiliyor olabilir; bu durumda build değil API yanıtı önemlidir.
- API yanıtını doğrudan test et:
  - `curl -k https://face-seek.com/api/pricing/plans-grouped?locale=tr&currency=TRY`

---

## İki Proje (FaceSeek + Depremm) Çakışmasını Engelleme

En temiz bariyer: iki projeyi farklı domain/subdomain ile ayırıp ayrı upstream/socket kullanmak.

### Önerilen Yapı (Subdomain)

- FaceSeek:
  - Domain: `face-seek.com`
  - Frontend: `127.0.0.1:3000`
  - Backend socket: `/run/faceseek/backend.sock`
  - systemd: `faceseek-frontend`, `faceseek-backend`
- Depremm:
  - Domain: `depremm.example.com` (kendi domainin/subdomainin)
  - Frontend: `127.0.0.1:3100` (veya ayrı Next)
  - Backend socket: `/run/depremm/backend.sock`
  - systemd: `depremm-frontend`, `depremm-backend`

### Nginx Bariyer İlkeleri

- Her proje için ayrı `server_name` kullan.
- Her proje için ayrı upstream/socket/port kullan.
- `location /api/` gibi path bazlı yönlendirmeleri aynı server block içinde karıştırma.
- Upload/asset dizinlerini ayrı tut (örn. `/uploads/` çakışmasın).

