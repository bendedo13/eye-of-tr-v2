# FaceSeek VPS Kurulum Rehberi

Bu rehber, projenizi GitHub üzerinden Ubuntu 22.04 sunucusuna nasıl aktaracağınızı ve çalıştıracağınızı adım adım anlatır.

## 1. Hazırlık (Kendi Bilgisayarınızda)

Önce yaptığımız değişiklikleri GitHub'a yükleyin:

```bash
git add .
git commit -m "feat: prepare for production deployment with secure env generator"
git push origin main
```

## 2. VPS Sunucusuna Bağlanma

Terminal veya CMD üzerinden sunucunuza bağlanın (IP adresini ve kullanıcı adını kendinize göre düzenleyin):

```bash
ssh root@sunucu_ip_adresiniz
```

## 3. Projeyi Sunucuya Çekme

Sunucuda projeyi klonlayın:

```bash
# Git yüklü değilse yükleyin
sudo apt update
sudo apt install git -y

# Projeyi klonlayın
git clone https://github.com/bendedo13/eye-of-tr-v2.git
cd eye-of-tr-v2
```

## 4. Kurulum Sihirbazını Çalıştırma

Hazırladığımız scripti çalıştırarak gerekli ayarları otomatik yapın:

```bash
# Python3 yüklü olduğundan emin olun
python3 scripts/generate_production_env.py
```

*   Size domain adınızı soracak (örn: `faceseek.com`). Yoksa `localhost` diyip geçebilirsiniz (ama SSL için domain şart).
*   Bu işlem `.env` dosyasını ve Nginx ayarını oluşturur.

## 5. Docker ve Servisleri Başlatma

Docker ve Docker Compose'un yüklü olması gerekir. Yüklü değilse:

```bash
# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

Projeyi başlatın:

```bash
docker compose up -d --build
```

*(Not: Eski Docker sürümlerinde `docker-compose` komutu tire ile yazılır: `docker-compose up -d --build`)*

## 6. Nginx ve SSL Ayarları

Scriptin oluşturduğu Nginx dosyasını aktifleştirin:

```bash
# Dosyayı kopyala (domain_adiniz kısmını script çıktısına göre düzenleyin)
sudo cp deploy/nginx/faceseek_domain_adiniz.conf /etc/nginx/sites-available/faceseek

# Sembolik link oluştur
sudo ln -s /etc/nginx/sites-available/faceseek /etc/nginx/sites-enabled/

# Nginx'i test et ve yeniden başlat
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Sertifikası (HTTPS) Kurulumu (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d domain_adiniz.com -d www.domain_adiniz.com
```

## 7. Kontrol

Tarayıcınızdan domain adresinize gidin. Uygulamanız yayında olmalı!

Admin paneli için API Key'i kaydettiğinizden emin olun (kurulum sihirbazı size vermişti).
