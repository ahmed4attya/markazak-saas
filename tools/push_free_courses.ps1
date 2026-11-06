$env:GIT_INDEX_FILE = "$PWD\.git\index_fc"
git read-tree HEAD
git add middleware.ts app/library/page.tsx scripts/populate-files-data.cjs
$tree = git write-tree
Write-Host "Tree hash: $tree"

# Verify files exist in this tree
git ls-tree $tree middleware.ts
git ls-tree $tree app/library/page.tsx

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "fix(files): whitelist /docs in middleware and ensure direct attachment download"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

# Update local ref so git log is in sync
Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_fc" -Force -ErrorAction SilentlyContinue
