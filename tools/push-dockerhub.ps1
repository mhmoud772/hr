Param(
  [string]$DockerHubUsername = $env:DOCKERHUB_USERNAME,
  [string]$Tag = $(if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }),
  [string]$ApiUrl = $(if ($env:VITE_API_URL) { $env:VITE_API_URL } else { "http://localhost:8000/api" }),
  [switch]$PushLatest
)

$ErrorActionPreference = "Stop"

function Invoke-Step {
  Param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][scriptblock]$Action
  )
  Write-Host "==> $Name"
  & $Action
  if ($LASTEXITCODE -ne 0) {
    throw "Failed: $Name"
  }
}

if (-not $DockerHubUsername) {
  throw "DockerHub username is required. Set -DockerHubUsername or DOCKERHUB_USERNAME."
}

try {
  docker info | Out-Null
} catch {
  throw "Docker Engine is not running. Start Docker Desktop first, then rerun."
}

if ($env:DOCKERHUB_TOKEN) {
  Invoke-Step -Name "Docker login with DOCKERHUB_TOKEN" -Action {
    $env:DOCKERHUB_TOKEN | docker login --username $DockerHubUsername --password-stdin
  }
} else {
  Write-Host "Skipping docker login (DOCKERHUB_TOKEN not set). Ensure you are already logged in."
}

$backendImage = "$DockerHubUsername/hr-backend:$Tag"
$frontendImage = "$DockerHubUsername/hr-frontend:$Tag"

Invoke-Step -Name "Build backend image ($backendImage)" -Action {
  docker build -f backend/Dockerfile -t $backendImage backend
}

Invoke-Step -Name "Build frontend image ($frontendImage)" -Action {
  docker build -f frontend/Dockerfile --build-arg VITE_API_URL=$ApiUrl -t $frontendImage frontend
}

Invoke-Step -Name "Push backend image ($backendImage)" -Action {
  docker push $backendImage
}

Invoke-Step -Name "Push frontend image ($frontendImage)" -Action {
  docker push $frontendImage
}

if ($PushLatest -and $Tag -ne "latest") {
  $backendLatest = "$DockerHubUsername/hr-backend:latest"
  $frontendLatest = "$DockerHubUsername/hr-frontend:latest"

  Invoke-Step -Name "Tag backend as latest ($backendLatest)" -Action {
    docker tag $backendImage $backendLatest
  }
  Invoke-Step -Name "Tag frontend as latest ($frontendLatest)" -Action {
    docker tag $frontendImage $frontendLatest
  }
  Invoke-Step -Name "Push backend latest ($backendLatest)" -Action {
    docker push $backendLatest
  }
  Invoke-Step -Name "Push frontend latest ($frontendLatest)" -Action {
    docker push $frontendLatest
  }
}

Write-Host ""
Write-Host "Docker Hub push completed."
Write-Host "Backend image:  $backendImage"
Write-Host "Frontend image: $frontendImage"
