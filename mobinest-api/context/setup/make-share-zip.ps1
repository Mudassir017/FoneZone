<#
.SYNOPSIS
  Builds a shareable zip of the whole Namma Mobiles project (frontend + backend + docs), without secrets.

.DESCRIPTION
  Copies mobinest/ and mobinest-api/ into a staging folder, excluding build output, dependencies,
  git history and every secret (mobinest/.env.local, mobinest-api/config/). Puts the complete guide at
  the zip root as NAMMA-MOBILES-COMPLETE-GUIDE.md, scans the result for secrets, and only then zips it.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File C:\Users\admin\mobinest-api\context\setup\make-share-zip.ps1
#>
param(
    [string]$ApiDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$WebDir = (Join-Path (Split-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path -Parent) 'mobinest'),
    [string]$OutDir = (Split-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path -Parent)
)
$ErrorActionPreference = 'Stop'

$stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$stage = Join-Path $env:TEMP "NammaMobiles-share-$stamp"
$root = Join-Path $stage 'NammaMobiles'
New-Item -ItemType Directory -Force $root | Out-Null

# robocopy: /E recurse, /XD exclude dirs, /XF exclude files. Exit codes < 8 mean success.
function Copy-Tree($from, $to, [string[]]$xd, [string[]]$xf) {
    robocopy $from $to /E /XD @xd /XF @xf /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE) for $from" }
}

Write-Host 'Copying frontend...'
Copy-Tree $WebDir (Join-Path $root 'mobinest') `
    @('node_modules', 'dist', '.git', '.vite', 'coverage') `
    @('.env.local', '.env', '*.local', '*.log')

Write-Host 'Copying backend...'
Copy-Tree $ApiDir (Join-Path $root 'mobinest-api') `
    @('target', 'config', '.git', '.idea', '.vscode', 'node_modules', 'e2e-out') `
    @('*.log', 'application-local.*')

Copy-Item (Join-Path $ApiDir 'context\NAMMA-MOBILES-COMPLETE-GUIDE.md') (Join-Path $root 'NAMMA-MOBILES-COMPLETE-GUIDE.md')

# ---- secret scan (fail closed) ----
Write-Host 'Scanning for secrets...'
$patterns = @(
    'sk_(test|live)_[A-Za-z0-9]{10,}',                 # Clerk secret keys
    'pk_(test|live)_[A-Za-z0-9]{20,}',                 # real Clerk publishable keys (placeholders are short)
    'rzp_(test|live)_[A-Za-z0-9]{8,}',                 # Razorpay keys
    'spring\.datasource\.password\s*=\s*[^\s$#{]{6,}', # a filled-in DB password
    'CLERK_SECRET_KEY\s*=\s*\S{10,}'
)
$hits = Get-ChildItem $root -Recurse -File |
    Where-Object { $_.Length -lt 5MB -and $_.Extension -notin '.png', '.webp', '.ico', '.jpg', '.woff2', '.zip' } |
    Select-String -Pattern $patterns -AllMatches
if ($hits) {
    $hits | ForEach-Object { Write-Warning ("{0}:{1}  {2}" -f $_.Path.Replace($root, ''), $_.LineNumber, $_.Line.Trim()) }
    throw "Secret-like values found. Nothing was zipped. Staging folder: $stage"
}
foreach ($must in 'mobinest\.env.local', 'mobinest-api\config') {
    if (Test-Path (Join-Path $root $must)) { throw "$must must not be shared" }
}

$zip = Join-Path $OutDir "NammaMobiles-share-$stamp.zip"
Compress-Archive -Path $root -DestinationPath $zip -Force
$files = (Get-ChildItem $root -Recurse -File).Count
Remove-Item -Recurse -Force $stage
Write-Host ("OK: {0} ({1:N1} MB, {2} files)" -f $zip, ((Get-Item $zip).Length / 1MB), $files)
