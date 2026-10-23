<#
  NOVATECH Risk Watch - demo device agent (Windows)

  Plays the "endpoint security" agent of an employee laptop during the class demo.
  When a team dashboard contains a cyberattack (R2), supplier breach (R5) or insider threat (R16),
  it sends "ISOLATE ALL" and this computer locks its session (default) or shuts down (-Shutdown).

  Run:   right-click this file > Run with PowerShell
         or: powershell -ExecutionPolicy Bypass -File device-agent.ps1 [-Shutdown]
  Stop:  close this window (or press Ctrl+C).
  Cancel a shutdown in progress:  shutdown /a

  Only commands for this team's channel are read; nothing is installed and no settings are changed.
#>
param(
  [string]$Channel = 'novatech-rw-646087d3502ba9ca-cmd',   # the team channel + "-cmd" (see Phone alerts & help)
  [switch]$Shutdown,                                        # shut down after 60 s instead of locking
  [string]$Name = $env:COMPUTERNAME                         # also reacts to "ISOLATE <Name>"
)

if ($Channel -notmatch '^[A-Za-z0-9_-]{8,64}$') { Write-Host 'Invalid channel name.' -ForegroundColor Red; exit 1 }
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$mode = if ($Shutdown) { 'SHUT DOWN after 60 seconds' } else { 'LOCK the session' }
Write-Host "NOVATECH device agent on $Name" -ForegroundColor Cyan
Write-Host "Listening on ntfy.sh/$Channel. When the team isolates devices, this computer will $mode."
Write-Host 'Close this window to stop.' -ForegroundColor DarkGray

$since = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()   # only commands sent from now on
$pattern = '^ISOLATE (ALL|' + [regex]::Escape($Name) + ')( R\d{1,2})?$'

while ($true) {
  try {
    $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri "https://ntfy.sh/$Channel/json?poll=1&since=$since"
    foreach ($line in ($resp.Content -split "`n")) {
      if (-not $line.Trim()) { continue }
      $msg = $line | ConvertFrom-Json
      if ($msg.event -ne 'message') { continue }
      $since = $msg.id
      $text = [string]$msg.message
      if ($text.Trim() -match $pattern) {
        Write-Host "$(Get-Date -Format HH:mm:ss)  ISOLATE received ($text)" -ForegroundColor Red
        if ($Shutdown) {
          shutdown.exe /s /t 60 /c "NOVATECH IT security: this computer is isolated after a suspected cyberattack. To cancel: shutdown /a"
        } else {
          rundll32.exe user32.dll,LockWorkStation
        }
      } elseif ($text.Trim() -match '^RELEASE ') {
        Write-Host "$(Get-Date -Format HH:mm:ss)  RELEASE received: device restored by IT" -ForegroundColor Green
      }
    }
  } catch {
    Write-Host "$(Get-Date -Format HH:mm:ss)  Waiting for the network..." -ForegroundColor DarkYellow
    Start-Sleep -Seconds 5
  }
  Start-Sleep -Seconds 2
}
