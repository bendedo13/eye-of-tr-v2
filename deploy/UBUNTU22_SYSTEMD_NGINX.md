# FaceSeek VPS Yayına Alma (Ubuntu 22.04 + systemd + Nginx)

Bu doküman backend (FastAPI) + frontend (Next.js) için tek VPS üzerinde systemd servisleri ve Nginx reverse proxy ile prod kurulum adımlarını içerir.

## 0) Güvenlik (Önerilen)

- Root şifre ile SSH kullanıyorsan: hemen SSH key kur ve root şifre ile girişi kapat.
- UFW aç: `ufw allow OpenSSH`, `ufw allow 'Nginx Full'`, `ufw enable`
- Sunucuyu güncelle: `apt-get update && apt-get upgrade -y`

## 1) Sunucu Paketleri

```bash
sudo apt-get update -y
sudo apt-get install -y git curl ca-certificates build-essential nginx python3-venv python3-pip
```

Node.js (öneri: Node 20 LTS):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

## 2) Uygulama Kullanıcısı ve Dizinler

```bash
sudo useradd -m -s /bin/bash faceseek || true
sudo mkdir -p /opt/faceseek /opt/faceseek/data /etc/faceseek
sudo chown -R faceseek:faceseek /opt/faceseek /opt/faceseek/data
```

Repo klonla:

```bash
sudo -u faceseek bash -lc 'cd /opt/faceseek && git clone https://github.com/bendedo13/eye-of-tr-v2.git repo'
```

## 3) Backend Kurulum (FastAPI + Gunicorn/Uvicorn)

```bash
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/backend && python3 -m venv venv'
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/backend && ./venv/bin/pip install -U pip wheel'
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/backend && ./venv/bin/pip install -r requirements.txt'
```

Uploads ve SQLite path:

```bash
sudo -u faceseek mkdir -p /opt/faceseek/repo/backend/uploads
sudo -u faceseek mkdir -p /opt/faceseek/data
```

Backend env:

```bash
sudo cp /opt/faceseek/repo/deploy/env/backend.env.example /etc/faceseek/backend.env
sudo nano /etc/faceseek/backend.env
```

Minimum doldur:
- `SECRET_KEY` (uzun ve rastgele)
- `ADMIN_API_KEY` (uzun ve rastgele)
- `PUBLIC_BASE_URL` (domain veya IP)
- `CORS_ORIGINS` (domain veya IP)
- `DATABASE_URL` (SQLite için önerilen: `sqlite:////opt/faceseek/data/faceseek.db`)

## 4) Frontend Kurulum (Next.js)

```bash
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/frontend && npm ci'
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/frontend && npm run build'
```

Frontend env:

```bash
sudo cp /opt/faceseek/repo/deploy/env/frontend.env.example /etc/faceseek/frontend.env
sudo nano /etc/faceseek/frontend.env
```

`NEXT_PUBLIC_API_URL` değerini domain/IP olacak şekilde ayarla (örn `http://YOUR_DOMAIN_OR_IP`).

## 5) systemd Servisleri

Backend socket için nginx’in okuyabilmesi adına servis `Group=www-data` kullanır.

```bash
sudo cp /opt/faceseek/repo/deploy/systemd/faceseek-backend.service /etc/systemd/system/faceseek-backend.service
sudo cp /opt/faceseek/repo/deploy/systemd/faceseek-frontend.service /etc/systemd/system/faceseek-frontend.service
sudo systemctl daemon-reload
sudo systemctl enable --now faceseek-backend
sudo systemctl enable --now faceseek-frontend
```

Kontrol:

```bash
sudo systemctl status faceseek-backend --no-pager
sudo systemctl status faceseek-frontend --no-pager
sudo journalctl -u faceseek-backend -n 200 --no-pager
sudo journalctl -u faceseek-frontend -n 200 --no-pager
```

## 6) Nginx Reverse Proxy

```bash
sudo cp /opt/faceseek/repo/deploy/nginx/faceseek.conf /etc/nginx/sites-available/faceseek.conf
sudo ln -sf /etc/nginx/sites-available/faceseek.conf /etc/nginx/sites-enabled/faceseek.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7) Smoke Test

```bash
curl -I http://127.0.0.1:3000/admin/login
curl -I http://127.0.0.1/api/public/site-config?locale=tr
curl -I http://YOUR_DOMAIN_OR_IP/admin/login
```

## 8) SSL (Opsiyonel ama önerilir)

Domain’in varsa:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 9) Güncelleme (Deploy)

```bash
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo && git pull'
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/backend && ./venv/bin/pip install -r requirements.txt'
sudo -u faceseek bash -lc 'cd /opt/faceseek/repo/frontend && npm ci && npm run build'
sudo systemctl restart faceseek-backend
sudo systemctl restart faceseek-frontend
sudo systemctl reload nginx
```

