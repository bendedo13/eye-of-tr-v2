# GitHub SSH Key Setup - Windows Server

GitHub'a SSH ile erişmek için gerekli işlemler.

## 🔑 Adım 1: SSH Anahtarı Oluştur

PowerShell'i açın ve şu komutu çalıştırın:

```powershell
# SSH dizini yoksa oluştur
if (-not (Test-Path $env:USERPROFILE\.ssh)) {
    New-Item -ItemType Directory -Path $env:USERPROFILE\.ssh -Force | Out-Null
}

# SSH anahtarı oluştur
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N ""
```

**Çıktı:**
```
Generating public/private rsa key pair.
Your identification has been saved in C:\Users\Asus\.ssh\id_rsa.
Your public key has been saved in C:\Users\Asus\.ssh\id_rsa.pub.
```

✅ İki dosya oluşturuldu:
- `C:\Users\Asus\.ssh\id_rsa` (özel anahtar - gizli tutun!)
- `C:\Users\Asus\.ssh\id_rsa.pub` (açık anahtar - GitHub'a eklenecek)

---

## 🔑 Adım 2: Açık Anahtarı Göster

Açık anahtarı kopyalayın:

```powershell
# Açık anahtarı göster
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub | Set-Clipboard
Write-Host "✅ Açık anahtar kopyalandı (CTRL+V ile yapıştırabilirsiniz)"
```

Veya direkt içeriği görmek için:

```powershell
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub
```

Çıktı şöyle görünecek:
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDxxx... Asus@SERVER
```

---

## 🌐 Adım 3: GitHub'a Anahtar Ekle

1. **GitHub.com'a gidin ve giriş yapın**
   - https://github.com/login

2. **Sağ üst köşenin profiline tıklayın → Settings**
   - https://github.com/settings/profile

3. **Sol menüden "SSH and GPG keys" seçin**
   - https://github.com/settings/keys

4. **"New SSH key" düğmesine tıklayın**

5. **Formu doldurun:**
   - **Title**: `Windows Server` (veya açıklayıcı ad)
   - **Key type**: `Authentication Key`
   - **Key**: Yukarıda kopyalanan açık anahtarı yapıştırın
     ```
     ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDxxx... Asus@SERVER
     ```

6. **"Add SSH key" düğmesine tıklayın**

7. **GitHub şifrenizi girin (2FA varsa kodunu da girin)**

✅ Anahtar eklendi!

---

## ✅ Adım 4: SSH Bağlantısını Test Et

PowerShell'de şu komutu çalıştırın:

```powershell
ssh -T git@github.com
```

**Başarılı** çıktı:
```
Hi <username>! You've successfully authenticated, but GitHub does not
provide shell access.
```

**Hata varsa:**
```powershell
# SSH agent'ı başlat
Start-Service ssh-agent

# Anahtarı agent'a ekle
ssh-add $env:USERPROFILE\.ssh\id_rsa

# Yeniden test et
ssh -T git@github.com
```

---

## 🚀 Adım 5: Deployment Script'i Çalıştır

SSH kurulumu tamam! Şimdi deployment script'ini çalıştırabilirsiniz:

```powershell
cd C:\Users\Asus\Desktop\eye-of-tr-v2
.\deploy-to-server.ps1
```

---

## 🆘 SSH Agent Problemi

Windows Server 11 veya daha eski sürümlerde SSH agent otomatik başlayabilir.
Eğer hata varsa:

```powershell
# SSH agent hizmetini başlat
Start-Service ssh-agent

# Otomatik başlatsın diye ayarla
Set-Service ssh-agent -StartupType Automatic

# Anahtarı ekle
ssh-add $env:USERPROFILE\.ssh\id_rsa

# Eklenen anahtarları göster
ssh-add -l
```

---

## 📝 SSH Dosya Yerleri

- **Özel anahtar**: `C:\Users\Asus\.ssh\id_rsa`
- **Açık anahtar**: `C:\Users\Asus\.ssh\id_rsa.pub`
- **SSH config**: `C:\Users\Asus\.ssh\config` (isteğe bağlı)

---

## 🔒 Güvenlik Önerileri

⚠️ **ÖNEMLİ**: Bu anahtarları saklamaya alın:
- `id_rsa` dosyasını başka kimseyle paylaşmayın
- `.ssh` dizinin izinlerini sınırlayın
- Anahtarı yedek depolama yerinde saklayın

---

## 🗝️ Birden Fazla Sunucu için Ayrı Anahtarlar

Eğer birden fazla sunucuda deploy edecekseniz, her biri için ayrı anahtar kullanabilirsiniz:

```powershell
# Farklı ad ile anahtar oluştur
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa_production" -N ""

# ~/.ssh/config dosyasında (Notepad ile açın):
Host github-prod
  HostName github.com
  User git
  IdentityFile C:\Users\Asus\.ssh\id_rsa_production

# Sonra kullan:
# git clone git@github-prod:username/repo.git
```

---

## 📚 Kaynaklar

- GitHub SSH Key Setup: https://docs.github.com/en/authentication/connecting-to-github-with-ssh
- Windows SSH Key: https://docs.microsoft.com/en-us/windows-server/administration/openssh/openssh_keymanagement
