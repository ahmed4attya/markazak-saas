$ErrorActionPreference = "Stop"

function Test-Needle {
  param([string]$Path, [string]$Needle)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  $needleBytes = [System.Text.Encoding]::UTF8.GetBytes($Needle)
  for ($i = 0; $i -le $bytes.Length - $needleBytes.Length; $i++) {
    $match = $true
    for ($j = 0; $j -lt $needleBytes.Length; $j++) {
      if ($bytes[$i + $j] -ne $needleBytes[$j]) { $match = $false; break }
    }
    if ($match) { return $true }
  }
  return $false
}

function Test-Mojibake {
  param([string]$Path)
  $bytes = [System.IO.File]::ReadAllBytes($Path)
  for ($i = 0; $i -lt ($bytes.Length - 3); $i++) {
    if ($bytes[$i] -eq 0xC3 -and $bytes[$i + 1] -eq 0xC2) { throw "FAIL: mojibake signature in $Path" }
  }
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$trackedText = @("MEMORY.md", "README.md", "middleware.ts", "db/schema.sql", "lib/access.ts")
foreach ($relative in $trackedText) {
  $path = Join-Path $root $relative
  if (-not (Test-Path -LiteralPath $path)) { throw "FAIL: missing required file $relative" }
  Test-Mojibake -Path $path
}

& npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw "FAIL: TypeScript check" }

$userProfile = $env:USERPROFILE
$nodeExe = Join-Path $userProfile ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if (-not (Test-Path -LiteralPath $nodeExe)) {
  $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCommand) { throw "FAIL: Node 24 runtime not found" }
  $nodeExe = $nodeCommand.Source
}
$nodeVersion = (& $nodeExe --version).Trim()
if ($nodeVersion -notmatch '^v24\.') { throw "FAIL: project requires Node 24.x; found $nodeVersion" }
& $nodeExe node_modules\next\dist\bin\next build
if ($LASTEXITCODE -ne 0) { throw "FAIL: production build" }

$diffCheck = git diff --check 2>&1
if ($LASTEXITCODE -ne 0) { throw "FAIL: whitespace check`n$diffCheck" }

$status = @(git status --short)
$deleted = @($status | Where-Object { $_ -match '^\sD\s' -or $_ -match '^D\s' })
if ($deleted.Count -gt 0) { throw "FAIL: unstaged deletion detected" }
$newSource = @($status | Where-Object { $_ -match '^\?\?\s+(app|components|lib|db|scripts)/' })
if ($newSource.Count -gt 0) { throw "FAIL: uncommitted source files detected; review and commit by explicit whitelist" }

Write-Host "PASS: deploy gate is green"
