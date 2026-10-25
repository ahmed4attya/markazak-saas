$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.example' '.env.local'
}

Write-Host 'Starting PostgreSQL...' -ForegroundColor Cyan
docker compose up -d

Write-Host 'Installing dependencies...' -ForegroundColor Cyan
npm install

Write-Host 'Running database migration...' -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) { throw 'Database migration failed. Setup stopped.' }

Write-Host 'Seeding demo data...' -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { throw 'Database seed failed. Setup stopped.' }

Write-Host ''
Write-Host 'Setup complete.' -ForegroundColor Green
Write-Host 'Login: admin@center.sa / admin123' -ForegroundColor Yellow
Write-Host 'Run: npm run dev' -ForegroundColor Yellow
