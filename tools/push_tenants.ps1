# tools/push_tenants.ps1
$env:GIT_INDEX_FILE = "$PWD\.git\index_tenants"
Remove-Item "$PWD\.git\index_tenants" -Force -ErrorAction SilentlyContinue

git read-tree HEAD
git add -A
$tree = git write-tree
Write-Host "Tree hash: $tree"

git ls-tree $tree app/tenants/page.tsx
git ls-tree $tree components/NotificationBell.tsx

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "feat: add tenant management dashboard, live notification bell, and automated tenant provisioning"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

# Update local refs
Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_tenants" -Force -ErrorAction SilentlyContinue
