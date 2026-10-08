# ============================================================
# prod-css-check.ps1 - READ-ONLY production diagnostic
# Verdicts: (A) browser cache (B) stale deploy (C) css 404
#           (D) build without tailwind config
# Run: powershell -ExecutionPolicy Bypass -File tools\prod-css-check.ps1
# ============================================================

 $ErrorActionPreference = "Continue"
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Write-Host "=== PROD CSS CHECK (read-only) ===" -ForegroundColor Cyan

if ($PWD.Path -ne "E:\projects\training-center-saas-fixed2\training-center-saas-final\markazak-saas") { throw ("WRONG LOCATION: " + $PWD.Path) }

 $base = "https://markazak-saas.vercel.app"
Write-Host "--- 1. fetch /login ---"
 $resp = $null
try { $resp = Invoke-WebRequest -Uri ($base + "/login") -UseBasicParsing -TimeoutSec 30 }
catch { throw ("fetch failed: " + $_.Exception.Message) }
Write-Host ("status=" + $resp.StatusCode + "  bytes=" + $resp.RawContentLength)

 $html = $resp.Content
Write-Host "--- 2. stylesheet links found in HTML ---"
 $ms = [regex]::Matches($html, '<link[^>]+rel="stylesheet"[^>]*>')
 $links = @()
foreach ($m in $ms) {
  $hm = [regex]::Match($m.Value, 'href="([^"]+)"')
  if ($hm.Success) { $links += $hm.Groups[1].Value }
}
if ($links.Count -eq 0) {
  Write-Host "VERDICT (B): NO stylesheet links - deployed build predates CSS wiring. REDEPLOY required." -ForegroundColor Red
} else {
  foreach ($l in $links) {
    $u = $l
    if ($u.StartsWith("/")) { $u = $base + $u }
    try {
      $r2 = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 30
      $css = $r2.Content
      $tw = ($css.Contains(".flex") -or $css.Contains("--tw-") -or $css.Contains("tailwind"))
      Write-Host ("  " + $l + "  status=" + $r2.StatusCode + "  bytes=" + $css.Length + "  tailwindMarkers=" + $tw)
      if ($tw) {
        Write-Host "VERDICT (A): CSS is FINE on server - your browser cached old HTML. Hard refresh (Ctrl+F5) or incognito window." -ForegroundColor Green
      } else {
        Write-Host "VERDICT (D): stylesheet serves but has NO tailwind output - build lacked tailwind/postcss config. REDEPLOY (repo now has them)." -ForegroundColor Red
      }
    } catch {
      Write-Host ("  " + $l + "  FAILED -> " + $_.Exception.Message) -ForegroundColor Red
      Write-Host "VERDICT (C): stylesheet 404 - stale deployment referencing dead assets. REDEPLOY." -ForegroundColor Red
    }
  }
}

Write-Host "--- 3. response headers (deployment identity) ---"
foreach ($k in @("x-vercel-id", "x-vercel-cache", "age", "last-modified")) {
  if ($resp.Headers[$k]) { Write-Host ("  " + $k + ": " + $resp.Headers[$k]) }
}

Write-Host "--- 4. login page source (local - for the credentials-hint fix) ---"
 $lp = "app\login\page.tsx"
if (Test-Path $lp) {
  $ll = [System.IO.File]::ReadAllLines($lp)
  Write-Host ("total lines: " + $ll.Count)
  $n = [Math]::Min(200, $ll.Count)
  for ($k = 0; $k -lt $n; $k++) { Write-Host ("  L" + ($k+1) + ": " + $ll[$k]) }
} else {
  Write-Host "app/login/page.tsx not found"
}
Write-Host "=== END - paste everything ===" -ForegroundColor Cyan