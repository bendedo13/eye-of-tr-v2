param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368"
)

$Commands = "cd ~/eye-of-tr-v2 && echo 'COMMIT_INFO:' && git log -n 1 --oneline && echo 'DOCKER_STATUS:' && docker compose ps"

$vbsPath = "$env:TEMP\ssh_verify.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${Commands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Verifying VPS deployment status..."
& cscript.exe //nologo $vbsPath

Start-Sleep -Seconds 10
if (Test-Path $vbsPath) { Remove-Item $vbsPath }
