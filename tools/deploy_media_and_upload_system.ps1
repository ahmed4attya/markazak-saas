$env:GIT_INDEX_FILE = "$PWD\.git\index_media"
git read-tree HEAD
git add middleware.ts
git add lib/storage.ts
git add lib/video-storage.ts
git add app/api/videos/upload/route.ts
git add app/api/videos/prepare/route.ts
git add app/api/videos/[id]/stream/route.ts
git add app/videos/page.tsx
git add app/library/page.tsx
git add app/api/files/prepare/route.ts
git add app/api/files/upload-complete/route.ts
git add public/docs/mindmap-qiyas-quant-core.png
git add public/docs/guide-strategies-quant-rules.png
git add public/media/qiyas-quant-foundation-lecture.mp4
git add public/media/qiyas-quant-podcast-fast-rules.m4a
git add scripts/seed-course-attachments-v2.cjs

$tree = git write-tree
Write-Host "Tree hash: $tree"

# Verify files exist in tree
git ls-tree $tree public/media/qiyas-quant-foundation-lecture.mp4
git ls-tree $tree public/media/qiyas-quant-podcast-fast-rules.m4a
git ls-tree $tree app/library/page.tsx
git ls-tree $tree app/videos/page.tsx

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$commit = git commit-tree $tree -p $parent -m "feat(storage): support up to 500MB videos, audio podcasts, and multi-format files with dual-mode direct client upload and public access"
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_media" -Force -ErrorAction SilentlyContinue
