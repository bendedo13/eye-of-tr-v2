param (
    [string]$IP = "46.4.123.77",
    [string]$User = "root",
    [string]$Pass = "mvdBIH368"
)

# Command to execute on the VPS
$Commands = "cd ~/eye-of-tr-v2 && git pull origin main && docker compose up -d --build && docker compose exec -T backend python scripts/init_admin.py"

# Using a VBScript hack to handle SSH password input in Windows
$vbsPath = "$env:TEMP\ssh_login.vbs"
$vbsContent = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "ssh -o StrictHostKeyChecking=no ${User}@${IP} ""${Commands}""", 1, False
WScript.Sleep 3000
shell.SendKeys "${Pass}{ENTER}"
"@

$vbsContent | Out-File -FilePath $vbsPath -Encoding ascii

Write-Host "Connecting to VPS and deploying changes..."
Write-Host "Please DO NOT touch your keyboard/mouse for a few seconds while the password is being entered."

# Run the VBScript
& cscript.exe //nologo $vbsPath

# Wait a bit for the script to finish
Start-Sleep -Seconds 15

# Clean up
if (Test-Path $vbsPath) { Remove-Item $vbsPath }

Write-Host "Deployment command sent to VPS."
