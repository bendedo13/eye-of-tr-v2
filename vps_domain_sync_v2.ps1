param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368",
    [string]$Domain = "face-seek.com"
)

# Use a single string with careful escaping
$Commands = "cd ~/eye-of-tr-v2 && git reset --hard && git pull origin main && sed -i 's|DOMAIN_NAME=.*|DOMAIN_NAME=${Domain}|' .env && sed -i 's|PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=https://${Domain}|' .env && sed -i 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=/api|' .env && echo 'server { listen 80; server_name ${Domain} www.${Domain} ${IP}; client_max_body_size 20m; location /api/ { proxy_pass http://127.0.0.1:8000/api/; proxy_http_version 1.1; proxy_set_header Host \$host; } location / { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Host \$host; } }' > /etc/nginx/sites-available/faceseek && ln -sf /etc/nginx/sites-available/faceseek /etc/nginx/sites-enabled/faceseek && nginx -t && systemctl restart nginx && docker compose down && docker compose up -d --build && sleep 10 && docker compose exec -T backend python scripts/init_admin.py"

$vbsPath = "$env:TEMP\ssh_deploy_v2.vbs"
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
Write-Host "VPS Updated successfully."
