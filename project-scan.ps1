$root = Get-Location
$out = "project-analysis"

if(Test-Path $out){
    Remove-Item $out -Recurse -Force
}

New-Item $out -ItemType Directory | Out-Null

Write-Host "Scanning project..."

# Project structure
Get-ChildItem -Recurse -Directory |
Where-Object {
    $_.FullName -notmatch "node_modules|\.next|\.git"
} |
Select-Object FullName |
Out-File "$out\folders.txt" -Encoding utf8


# Files list
Get-ChildItem -Recurse -File |
Where-Object {
    $_.FullName -notmatch "node_modules|\.next|\.git"
} |
Select-Object FullName,Length |
Out-File "$out\files.txt" -Encoding utf8


# Package
if(Test-Path package.json){
    Copy-Item package.json "$out\package.json"
}


# Environment names only
if(Test-Path .env.local){
    Get-Content .env.local |
    ForEach-Object {
        if($_ -match "^[A-Z_]+="){
            ($_ -split "=")[0]
        }
    } |
    Out-File "$out\env-keys.txt"
}


# Database schemas
Get-ChildItem -Recurse -Include *.sql |
Where-Object {
    $_.FullName -notmatch "node_modules"
} |
ForEach-Object {

    "`n===== $($_.FullName) =====" |
    Out-File "$out\database-schema.txt" -Append

    Get-Content $_.FullName |
    Out-File "$out\database-schema.txt" -Append
}


# API routes
Get-ChildItem app\api -Recurse -File -Include *.ts,*.tsx |
Select-Object FullName |
Out-File "$out\api-routes.txt"


# Pages
Get-ChildItem app -Recurse -File -Include page.tsx,page.ts |
Select-Object FullName |
Out-File "$out\pages.txt"


# Components
Get-ChildItem components -Recurse -File -Include *.tsx,*.ts -ErrorAction SilentlyContinue |
Select-Object FullName |
Out-File "$out\components.txt"


# Important source files content
$targets=@(
"lib\db.ts",
"lib\auth.ts",
"middleware.ts",
"package.json"
)

foreach($file in $targets){

    if(Test-Path $file){

        "`n===== $file =====" |
        Out-File "$out\core-files.txt" -Append

        Get-Content $file |
        Out-File "$out\core-files.txt" -Append
    }
}


# Search TODO / errors
Get-ChildItem -Recurse -File |
Where-Object {
    $_.FullName -notmatch "node_modules|\.next"
} |
Select-String -Pattern "TODO|FIXME|console.error|throw new Error|password_hash|tenant_id" |
Out-File "$out\code-findings.txt"


# Build info
npm list --depth=0 |
Out-File "$out\npm-packages.txt"


# Git status
if(Test-Path .git){
    git status |
    Out-File "$out\git-status.txt"
}


Compress-Archive `
-Path "$out\*" `
-DestinationPath "project-analysis.zip" `
-Force


Write-Host ""
Write-Host "Finished"
Write-Host "Created: project-analysis.zip"