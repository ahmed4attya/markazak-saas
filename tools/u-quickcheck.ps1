# ============================================================
# u-quickcheck.ps1 - READ-ONLY: who is holding the git lock?
# Lists: running processes matching git/vscode/codium
#        + full git state (status, porcelain, lock file)
# Run: powershell -ExecutionPolicy Bypass -File tools\u-quickcheck.ps1
# ============================================================

 $ErrorActionPreference = "Continue"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== U-QUICKCHECK (read-only lock investigation) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

Write-Host "--- 1. running processes (git / VS Code family) ---"
 $procs = @(Get-Process | Where-Object {
  $_.ProcessName -match 'git|Code|codium|code-explorer|sourcetree|tortoise' -or
  ($_.ProcessName -eq 'node' -and $_.MainWindowTitle -match 'git')
})
if ($procs.Count -eq 0) { Write-Host "  no git/VSCode-like process found" -ForegroundColor Green }
foreach ($p in $procs) {
  $t = ""
  try { $t = $p.MainWindowTitle } catch { }
  Write-Host ("  PID=" + $p.Id + "  NAME=" + $p.ProcessName + "  TITLE=" + $t)
}

Write-Host "--- 2. index.lock file state ---"
 $lock = Join-Path $PWD ".git\index.lock"
if (Test-Path $lock) {
  $fi = Get-Item $lock
  Write-Host ("  EXISTS: " + $fi.FullName + "  size=" + $fi.Length + "  lastWrite=" + $fi.LastWriteTime)
  Write-Host "  AGE: " ((New-TimeSpan $fi.LastWriteTime (Get-Date)).TotalSeconds) "seconds"
} else {
  Write-Host "  not present" -ForegroundColor Green
}

Write-Host "--- 3. git status (read-only) ---"
git status --porcelain
Write-Host "--- 4. last commit ---"
git log --oneline -3

Write-Host "=== END - paste everything above ===" -ForegroundColor Cyan