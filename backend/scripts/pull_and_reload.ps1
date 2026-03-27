param(
  [string]$RepoPath = "C:\apps\stick",
  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

Write-Host "=== STICK backend pull + reload ==="
Write-Host "RepoPath: $RepoPath"
Write-Host "Branch: $Branch"

Set-Location $RepoPath
git fetch --all
git checkout $Branch
git pull origin $Branch

Set-Location "$RepoPath\backend"
yarn install --immutable

pm2 restart stick-backend
pm2 save

Write-Host "Done. Current pm2 status:"
pm2 status

