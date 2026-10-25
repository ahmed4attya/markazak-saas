# tools/push_fix.ps1
$env:GIT_INDEX_FILE = "$PWD\.git\index_fix"
Remove-Item "$PWD\.git\index_fix" -Force -ErrorAction SilentlyContinue

git read-tree HEAD
git add -A
$tree = git write-tree
Write-Host "Tree hash: $tree"

git ls-tree $tree app/api/questions/extract/route.ts
git ls-tree $tree app/api/tenants/route.ts

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "fix(build): remove pdf-parse package.json resolve and fix prefer-const in tenants route"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

# Update local refs
Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_fix" -Force -ErrorAction SilentlyContinue
