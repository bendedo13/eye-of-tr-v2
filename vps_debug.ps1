param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368"
)

$Commands = "echo '--- DOCKER CONTAINERS ---' && docker ps && echo '--- NGINX CONFIG ---' && ls /etc/nginx/sites-enabled/ && echo '--- BACKEND LOGS ---' && docker compose -f ~/eye-of-tr-v2/docker-compose.yml logs --tail=20 backend"

$vbsPath = "$env:TEMP\ssh_debug.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${Commands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Debugging VPS services..."
& cscript.exe //nologo $vbsPath

Start-Sleep -Seconds 15
if (Test-Path $vbsPath) { Remove-Item $vbsPath }
