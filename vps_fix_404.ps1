param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368"
)

# 1. Update .env to use relative API path
# 2. Update Nginx to use Docker ports (8000/3000)
# 3. Restart services
$Commands = @"
cd ~/eye-of-tr-v2
# Fix .env: Make NEXT_PUBLIC_API_BASE_URL relative
sed -i 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=/api|' .env

# Fix Nginx config: Use ports instead of unix sockets
cat <<EOF > /etc/nginx/sites-available/faceseek
server {
    listen 80;
    server_name 46.4.123.77;

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
        proxy_set_header Connection "upgrade";
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/faceseek /etc/nginx/sites-enabled/faceseek
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Restart Docker to apply .env changes
docker compose down && docker compose up -d --build
"@

$vbsPath = "$env:TEMP\ssh_fix.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${Commands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Applying fixes to VPS..."
& cscript.exe //nologo $vbsPath

Start-Sleep -Seconds 30
if (Test-Path $vbsPath) { Remove-Item $vbsPath }
Write-Host "Fixes applied. Please check the site."
