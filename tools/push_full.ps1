$env:GIT_INDEX_FILE = "$PWD\.git\index_full"
git read-tree 2c4ec090c9db1b6f949e33abc8310fc80fba538e
git add -A
$tree = git write-tree
Write-Host "Tree hash: $tree"

# Verify package.json exists in this tree
git ls-tree $tree package.json

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "feat: fix mobile drawer, add change password, gmail otp and google oauth"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

# Update local ref so git log is in sync
Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_full" -Force -ErrorAction SilentlyContinue
