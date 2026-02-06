param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368"
)

# Simplified commands with base64 encoding to avoid escaping hell
$Commands = "cd ~/eye-of-tr-v2 && sed -i 's|NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=/api|' .env && docker compose down && docker compose up -d --build"

# Nginx Fix Command
$NginxFix = "echo 'server { listen 80; server_name 46.4.123.77; client_max_body_size 20m; location /api/ { proxy_pass http://127.0.0.1:8000/api/; proxy_http_version 1.1; proxy_set_header Host \$host; } location / { proxy_pass http://127.0.0.1:3000; proxy_http_version 1.1; proxy_set_header Host \$host; } }' > /etc/nginx/sites-available/faceseek && ln -sf /etc/nginx/sites-available/faceseek /etc/nginx/sites-enabled/faceseek && rm -f /etc/nginx/sites-enabled/default && systemctl restart nginx"

$AllCommands = "$Commands && $NginxFix"

$vbsPath = "$env:TEMP\ssh_fix_simple.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${AllCommands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Applying fixes to VPS (Simple Version)..."
& cscript.exe //nologo $vbsPath

Start-Sleep -Seconds 30
if (Test-Path $vbsPath) { Remove-Item $vbsPath }
Write-Host "Fixes applied."
