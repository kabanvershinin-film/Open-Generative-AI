
$ErrorActionPreference = "Stop"
$repoPath = "d:\CODER\Trae cod\Open-Generative-AI"
$env:GIT_PAGER = ""

Write-Host "=== Running git status in $repoPath ===" -ForegroundColor Cyan
git -C $repoPath status

Write-Host "`n=== Adding files ===" -ForegroundColor Cyan
git -C $repoPath add app/api/digital-avatar/
git -C $repoPath add packages/studio/src/components/VideoStudio.jsx
git -C $repoPath add packages/studio/src/components/FaceAssetDialog.jsx
git -C $repoPath add packages/studio/src/components/AvatarCreationDialog.jsx
git -C $repoPath add packages/workflow-builder-local/src/components/CharacterNode.jsx
git -C $repoPath add packages/workflow-builder-local/src/components/AvatarCreationDialog.jsx

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git -C $repoPath commit -m "Добавляем цифровые аватары в проект"

Write-Host "`n=== Pushing ===" -ForegroundColor Cyan
git -C $repoPath push origin main
