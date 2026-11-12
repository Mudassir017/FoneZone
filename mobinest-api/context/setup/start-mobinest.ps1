<#
.SYNOPSIS
  Starts the whole MobiNest stack: Spring Boot API (:8080), then the React storefront (:5173).

.DESCRIPTION
  Each server runs in its own minimised PowerShell window, so it keeps running after
  this script (or any Claude/terminal session) ends. Close those windows to stop them.
  Skips a server that is already running. MySQL (service MySQL80) must be running.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File C:\Users\admin\mobinest-api\context\setup\start-mobinest.ps1
#>
param(
    [string]$ApiDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$WebDir = (Join-Path (Split-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path -Parent) 'mobinest'),
    [switch]$NoFrontend,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
function Test-Port([int]$port) { [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) }

$mysql = Get-Service -Name 'MySQL*' -ErrorAction SilentlyContinue | Where-Object { $_.Name -notlike '*Router*' } | Select-Object -First 1
if ($mysql -and $mysql.Status -ne 'Running') {
    Write-Host "Starting MySQL service $($mysql.Name)..."
    Start-Service $mysql.Name
}

# ---- Backend ----
if (Test-Port 8080) {
    Write-Host 'API already running on :8080'
} else {
    $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
    $cmd = "`$Host.UI.RawUI.WindowTitle = 'MobiNest API :8080'; " +
           "`$env:JAVA_HOME = '$javaHome'; `$env:Path = '$javaHome\bin;' + `$env:Path; " +
           "Set-Location '$ApiDir'; .\mvnw.cmd spring-boot:run"
    Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd -WindowStyle Minimized
    Write-Host 'Starting API (first run downloads dependencies)...'
    $deadline = (Get-Date).AddMinutes(5)
    do {
        Start-Sleep -Seconds 2
        try { $up = (Invoke-RestMethod http://localhost:8080/actuator/health -TimeoutSec 2).status -eq 'UP' } catch { $up = $false }
    } until ($up -or (Get-Date) -gt $deadline)
    if (-not $up) { throw 'API did not become healthy within 5 minutes. Check the "MobiNest API :8080" window.' }
    Write-Host 'API is UP: http://localhost:8080/swagger-ui.html'
}

# ---- Frontend ----
if ($NoFrontend) { return }
if (Test-Port 5173) {
    Write-Host 'Storefront already running on :5173'
} elseif (-not (Test-Path (Join-Path $WebDir 'package.json'))) {
    Write-Warning "Frontend folder not found at $WebDir; skipping."
} else {
    $install = if (Test-Path (Join-Path $WebDir 'node_modules')) { '' } else { 'npm install; ' }
    $cmd = "`$Host.UI.RawUI.WindowTitle = 'MobiNest Web :5173'; Set-Location '$WebDir'; ${install}npm run dev"
    if ($NoBrowser) { $cmd = $cmd -replace 'npm run dev', 'npm run dev -- --open false' }
    Start-Process powershell -ArgumentList '-NoExit', '-NoProfile', '-Command', $cmd -WindowStyle Minimized
    $deadline = (Get-Date).AddMinutes(3)
    do { Start-Sleep -Seconds 2 } until ((Test-Port 5173) -or (Get-Date) -gt $deadline)
    if (Test-Port 5173) { Write-Host 'Storefront is UP: http://localhost:5173' } else { Write-Warning 'Storefront did not start; check the "MobiNest Web :5173" window.' }
}
