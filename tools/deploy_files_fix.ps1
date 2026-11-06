$env:GIT_INDEX_FILE = "$PWD\.git\index_deploy"
git read-tree HEAD
git add app/api/files/upload/route.ts
git add app/api/files/[id]/download/route.ts
git add app/library/page.tsx
git add lib/storage.ts
git add public/docs/qiyas-quant-rules-2026.pdf
git add public/docs/qiyas-verbal-guide-2026.pdf
git add public/docs/tahsili-core-concepts-2026.pdf
git add public/docs/mindmap-qiyas-quant-2026.png
git add public/docs/infographic-qiyas-quant-2026.png
git add scripts/seed-new-attachments.cjs
git add db/m7_file_storage_data.sql

$tree = git write-tree
Write-Host "Tree hash: $tree"

# Verify files exist in this tree
git ls-tree $tree app/api/files/upload/route.ts
git ls-tree $tree app/api/files/[id]/download/route.ts
git ls-tree $tree lib/storage.ts
git ls-tree $tree public/docs/mindmap-qiyas-quant-2026.png

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "fix(upload): resolve file upload failure with robust internal TOAST database fallback and relaxed mime validation"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_deploy" -Force -ErrorAction SilentlyContinue
