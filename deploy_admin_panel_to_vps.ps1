# FaceSeek Admin Panel VPS Deployment Script
# VPS'e admin panel güncellemelerini deploy eder

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FaceSeek Admin Panel VPS Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# VPS Bilgileri
$VPS_IP = "46.4.123.77"
$VPS_USER = "root"
$VPS_PASSWORD = "mvdBIH368"
$PROJECT_DIR = "/opt/faceseek"
$FRONTEND_DIR = "$PROJECT_DIR/frontend"
$BACKEND_DIR = "$PROJECT_DIR/backend"

Write-Host ""
Write-Host "📍 VPS Bilgileri:" -ForegroundColor Yellow
Write-Host "   IP: $VPS_IP"
Write-Host "   Proje Dizini: $PROJECT_DIR"
Write-Host ""

# SSH Session oluştur
Write-Host "🔄 Adım 1: Git güncellemelerini çek..." -ForegroundColor Green

$sshSession = New-PSSession -HostName $VPS_IP -UserName $VPS_USER -Password (ConvertTo-SecureString $VPS_PASSWORD -AsPlainText -Force) -ErrorAction SilentlyContinue

if ($null -eq $sshSession) {
    Write-Host "⚠️  SSH bağlantısı başarısız. SSH komutlarını manuel olarak çalıştırmanız gerekebilir." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "SSH Komutları:" -ForegroundColor Yellow
    Write-Host "ssh root@46.4.123.77" -ForegroundColor Gray
    Write-Host "cd /opt/faceseek" -ForegroundColor Gray
    Write-Host "git fetch origin" -ForegroundColor Gray
    Write-Host "git checkout claude/interesting-ellis" -ForegroundColor Gray
    Write-Host "git pull origin claude/interesting-ellis" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Git güncellemelerini çek
Invoke-Command -Session $sshSession -ScriptBlock {
    cd /opt/faceseek
    git fetch origin
    git checkout claude/interesting-ellis
    git pull origin claude/interesting-ellis
    Write-Host "✅ Git güncellemeleri tamamlandı" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Adım 2: Frontend'i build et..." -ForegroundColor Green

Invoke-Command -Session $sshSession -ScriptBlock {
    cd /opt/faceseek/frontend
    npm install
    npm run build
    Write-Host "✅ Frontend build tamamlandı" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Adım 3: Frontend servisini yeniden başlat..." -ForegroundColor Green

Invoke-Command -Session $sshSession -ScriptBlock {
    systemctl restart faceseek-frontend
    Start-Sleep -Seconds 2
    systemctl status faceseek-frontend
    Write-Host "✅ Frontend servisi yeniden başlatıldı" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Adım 4: Backend servisini kontrol et..." -ForegroundColor Green

Invoke-Command -Session $sshSession -ScriptBlock {
    systemctl status faceseek-backend
    Write-Host "✅ Backend servisi çalışıyor" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔄 Adım 5: Nginx'i yeniden yükle..." -ForegroundColor Green

Invoke-Command -Session $sshSession -ScriptBlock {
    nginx -t
    systemctl reload nginx
    Write-Host "✅ Nginx yeniden yüklendi" -ForegroundColor Green
}

# SSH Session'ı kapat
Remove-PSSession -Session $sshSession

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT TAMAMLANDI!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Panel Erişim Adresleri:" -ForegroundColor Yellow
Write-Host "  🇹🇷 Türkçe: https://46.4.123.77/tr/admin" -ForegroundColor Cyan
Write-Host "  🇬🇧 İngilizce: https://46.4.123.77/en/admin" -ForegroundColor Cyan
Write-Host ""
Write-Host "Admin Giriş Bilgileri:" -ForegroundColor Yellow
Write-Host "  Email: admin@faceseek.io" -ForegroundColor Gray
Write-Host "  API Key: (Lütfen .env dosyasından kontrol et)" -ForegroundColor Gray
Write-Host ""
Write-Host "Yeni Admin Sayfaları:" -ForegroundColor Yellow
Write-Host "  ✅ Kullanıcı Yönetimi" -ForegroundColor Green
Write-Host "  ✅ Ödeme Yönetimi" -ForegroundColor Green
Write-Host "  ✅ Blog Yönetimi" -ForegroundColor Green
Write-Host "  ✅ Denetim Günlükleri" -ForegroundColor Green
Write-Host "  ✅ Banka Transferleri" -ForegroundColor Green
Write-Host "  ✅ Referanslar" -ForegroundColor Green
Write-Host "  ✅ Medya Yönetimi" -ForegroundColor Green
Write-Host "  ✅ Misafir Talepleri" -ForegroundColor Green
Write-Host "  ✅ Fiyatlandırma" -ForegroundColor Green
Write-Host "  ✅ Yasal İçerik" -ForegroundColor Green
Write-Host "  ✅ Ana Sayfa Medyası" -ForegroundColor Green
Write-Host "  ✅ İletişim" -ForegroundColor Green
Write-Host "  ✅ Destek Biletleri" -ForegroundColor Green
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
