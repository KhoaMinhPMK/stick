param(
  [int]$StartPort = 3000,
  [int]$EndPort = 3100,
  [int]$DesiredPort = 3040
)

$ErrorActionPreference = "Continue"

Write-Host "=== STICK VPS Port Inspection ==="
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host "Range to suggest: $StartPort-$EndPort"
Write-Host "Desired port: $DesiredPort"
Write-Host ""

$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Sort-Object LocalPort, OwningProcess
$processTable = @{}
Get-Process -ErrorAction SilentlyContinue | ForEach-Object {
  $processTable[$_.Id] = $_.ProcessName
}

Write-Host "=== Listening TCP Ports ==="
if ($connections) {
  $connections |
    Select-Object `
      @{Name = "LocalAddress"; Expression = { $_.LocalAddress }}, `
      @{Name = "LocalPort"; Expression = { $_.LocalPort }}, `
      @{Name = "PID"; Expression = { $_.OwningProcess }}, `
      @{Name = "Process"; Expression = { $processTable[$_.OwningProcess] }} |
    Format-Table -AutoSize
} else {
  Write-Host "No listening TCP connections found."
}

Write-Host ""
Write-Host "=== PM2 Apps ==="
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Cmd) {
  try {
    # Avoid JSON parsing because some PM2 env payloads contain duplicated keys (USERNAME/username)
    pm2 status
  } catch {
    Write-Host "PM2 exists but cannot read status output."
  }
} else {
  Write-Host "PM2 not found on this machine."
}

Write-Host ""
Write-Host "=== IIS Site Bindings ==="
$appcmd = Join-Path $env:WINDIR "System32\inetsrv\appcmd.exe"
if (Test-Path $appcmd) {
  try {
    & $appcmd list site
  } catch {
    Write-Host "appcmd list site failed, trying WebAdministration module..."
    try {
      Import-Module WebAdministration -ErrorAction Stop
      Get-Website | Select-Object Name, State, Bindings | Format-Table -AutoSize
    } catch {
      Write-Host "Unable to read IIS bindings with both appcmd and WebAdministration."
    }
  }
} else {
  Write-Host "IIS appcmd not found."
}

Write-Host ""
Write-Host "=== Port Decision ==="
$usedPorts = @()
if ($connections) {
  $usedPorts = $connections | Select-Object -ExpandProperty LocalPort -Unique
}

$isDesiredUsed = $usedPorts -contains $DesiredPort
if (-not $isDesiredUsed) {
  Write-Host "Desired port $DesiredPort is FREE."
} else {
  Write-Host "Desired port $DesiredPort is IN USE by:"
  $connections |
    Where-Object { $_.LocalPort -eq $DesiredPort } |
    Select-Object `
      @{Name = "LocalAddress"; Expression = { $_.LocalAddress }}, `
      @{Name = "PID"; Expression = { $_.OwningProcess }}, `
      @{Name = "Process"; Expression = { $processTable[$_.OwningProcess] }} |
    Format-Table -AutoSize
}

$freePorts = @()
for ($p = $StartPort; $p -le $EndPort; $p++) {
  if ($usedPorts -notcontains $p) {
    $freePorts += $p
  }
}

Write-Host ""
if ($freePorts.Count -gt 0) {
  $suggest = $freePorts | Select-Object -First 10
  Write-Host "Suggested free ports: $($suggest -join ', ')"
} else {
  Write-Host "No free ports in range $StartPort-$EndPort. Extend the range."
}

Write-Host ""
Write-Host "=== Done ==="
