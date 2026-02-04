import secrets
import string
import os
import datetime

def generate_secure_key(length=50):
    alphabet = string.ascii_letters + string.digits + "-_!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for i in range(length))

def generate_hex_key(length=32):
    return secrets.token_hex(length)

def main():
    print("🚀 FaceSeek Production Kurulum Sihirbazı")
    print("----------------------------------------")
    
    # 1. Kullanıcıdan Domain Bilgisi Al
    try:
        domain = input("Domain adınızı girin (örn: face-seek.com) [localhost]: ").strip() or "localhost"
    except (EOFError, KeyboardInterrupt):
        print("\nİşlem iptal edildi.")
        return

    # 2. Güvenli Anahtarları Oluştur
    secret_key = generate_hex_key(32)
    admin_api_key = generate_secure_key(32)
    postgres_password = generate_secure_key(24)
    grafana_password = generate_secure_key(16)
    
    print(f"\n🔑 Güvenli anahtarlar oluşturuldu...")
    
    # 3. .env Dosyası İçeriği
    env_content = f"""# FaceSeek Production Environment Variables
# Oluşturulma Tarihi: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

# --- General ---
DOMAIN_NAME={domain}
PUBLIC_BASE_URL=https://{domain}
NODE_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# --- Security ---
# Generated with strong random values
SECRET_KEY={secret_key}
ADMIN_API_KEY={admin_api_key}

# --- Database (PostgreSQL) ---
POSTGRES_USER=faceseek
POSTGRES_PASSWORD={postgres_password}
POSTGRES_DB=faceseek
DATABASE_URL=postgresql+psycopg2://faceseek:{postgres_password}@postgres:5432/faceseek

# --- Redis ---
REDIS_URL=redis://redis:6379/0

# --- Frontend ---
NEXT_PUBLIC_API_BASE_URL=https://{domain}

# --- Monitoring ---
GRAFANA_ADMIN_PASSWORD={grafana_password}

# --- External Services (Lütfen bu alanları doldurun) ---
# SERPAPI_API_KEY=
# RAPIDAPI_KEY=
# OPENAI_API_KEY=
"""

    # 4. .env Dosyasını Yaz
    with open(".env", "w", encoding="utf-8") as f:
        f.write(env_content)
    
    print("✅ .env dosyası ana dizine kaydedildi.")
    
    # 5. Nginx Konfigürasyonunu Güncelle
    nginx_template_path = os.path.join("deploy", "nginx", "faceseek.conf")
    nginx_out_path = os.path.join("deploy", "nginx", f"faceseek_{domain}.conf")
    
    try:
        with open(nginx_template_path, "r", encoding="utf-8") as f:
            nginx_conf = f.read()
            
        # Placeholder'ı değiştir
        nginx_conf = nginx_conf.replace("${DOMAIN_NAME}", domain)
        
        with open(nginx_out_path, "w", encoding="utf-8") as f:
            f.write(nginx_conf)
            
        print(f"✅ Nginx konfigürasyonu oluşturuldu: {nginx_out_path}")
        
    except FileNotFoundError:
        print(f"⚠️ Uyarı: {nginx_template_path} bulunamadı, Nginx dosyası oluşturulamadı.")

    print("\n🎉 Kurulum Hazırlığı Tamamlandı!")
    print("----------------------------------------")
    print("1. .env dosyasındaki 'External Services' bölümünü API anahtarlarınızla doldurun.")
    print(f"2. Nginx dosyasını kopyalayın: sudo cp {nginx_out_path} /etc/nginx/sites-available/{domain}")
    print("3. Docker container'ları başlatın: docker-compose up -d --build")
    print(f"4. Admin API Key'iniz: {admin_api_key}")

if __name__ == "__main__":
    main()
