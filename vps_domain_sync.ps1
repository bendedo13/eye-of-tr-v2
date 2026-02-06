param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368",
    [string]$Domain = "face-seek.com"
)

# Step-by-step commands for the VPS
$Commands = @(
    "cd ~/eye-of-tr-v2",
    "git reset --hard",
    "git pull origin main",
    # Update .env
    "sed -i 's|DOMAIN_NAME=.*|DOMAIN_NAME=${Domain}|' .env",
    "sed -i 's|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${Domain}|' .env",
    "sed -i 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=/api|' .env",
    # Update Nginx
    "echo 'server {
    listen 80;
    server_name ${Domain} www.${Domain} ${IP};

    client_max_body_size 20m;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:8000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_cache_bypass \$http_upgrade;
    }
}' > /etc/nginx/sites-available/faceseek",
    "ln -sf /etc/nginx/sites-available/faceseek /etc/nginx/sites-enabled/faceseek",
    "nginx -t && systemctl restart nginx",
    # Restart Docker
    "docker compose down",
    "docker compose up -d --build",
    # Sync database
    "sleep 10",
    "docker compose exec -T backend python scripts/init_admin.py"
) -join " && "

$vbsPath = "$env:TEMP\ssh_deploy_domain.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${Commands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Updating VPS for domain: ${Domain}..."
& cscript.exe //nologo $vbsPath

Start-Sleep -Seconds 60
if (Test-Path $vbsPath) { Remove-Item $vbsPath }
Write-Host "VPS Updated and Synced with GitHub main branch."
