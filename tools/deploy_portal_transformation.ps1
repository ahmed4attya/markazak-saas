$env:GIT_INDEX_FILE = "$PWD\.git\index_deploy"
git read-tree HEAD

# Add all student portal upgrade files
git add lib/formulas-data.ts
git add app/portal/formulas/page.tsx
git add app/portal/calculator/page.tsx
git add app/api/learner/self-challenge/route.ts
git add app/portal/self-challenge/page.tsx
git add app/portal/mistakes/page.tsx
git add app/api/learner/forecast/route.ts
git add app/portal/progress/page.tsx
git add app/api/learner/badges/route.ts
git add app/portal/badges/page.tsx
git add app/api/learner/challenge/route.ts
git add app/portal/challenge/page.tsx
git add app/portal/page.tsx
git add app/portal/layout.tsx

# Also add upload fixes and attachments from previous turns
git add app/api/files/upload/route.ts
git add app/api/files/prepare/route.ts
git add app/api/files/upload-complete/route.ts
git add app/api/files/[id]/download/route.ts
git add app/api/videos/upload/route.ts
git add app/api/videos/prepare/route.ts
git add app/api/videos/[id]/stream/route.ts
git add app/library/page.tsx
git add app/videos/page.tsx
git add lib/storage.ts
git add lib/video-storage.ts
git add package.json
git add package-lock.json

$tree = git write-tree
Write-Host "Tree hash: $tree"

$parent = git rev-parse HEAD
Write-Host "Parent commit: $parent"

$msg = "feat(portal): complete competitive student portal overhaul with formulas vault, university calculator, self-challenge, Leitner mistakes, badges and 1v1 challenges"
$commit = git commit-tree $tree -p $parent -m $msg
Write-Host "New commit: $commit"

git push origin "${commit}:main"
Write-Host "Pushed to origin/main successfully"

Set-Content -Path ".git/refs/heads/main" -Value "$commit`n"
Set-Content -Path ".git/refs/remotes/origin/main" -Value "$commit`n"

Remove-Item "$PWD\.git\index_deploy" -Force -ErrorAction SilentlyContinue
