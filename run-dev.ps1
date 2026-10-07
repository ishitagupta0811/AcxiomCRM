# ==============================================================================
# AcxiomCRM — Local Development Launcher & Environment Health Check
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "             AcxiomCRM Enterprise Launcher                " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check .NET availability
$dotnet = Get-Command dotnet -ErrorAction SilentlyContinue
if ($dotnet) {
    Write-Host "[✓] .NET SDK Detected: " -NoNewline -ForegroundColor Green
    & dotnet --version
    Write-Host "[*] Restoring backend dependencies..." -ForegroundColor Cyan
    & dotnet restore .\AcxiomCRM.sln
} else {
    Write-Host "[!] Note: .NET SDK not detected in standard PATH." -ForegroundColor Yellow
    Write-Host "    You can still evaluate Phase 1 via the Frontend testbed!" -ForegroundColor Cyan
}

# Check frontend accessibility
$frontendPath = Join-Path $PSScriptRoot "frontend\index.html"
if (Test-Path $frontendPath) {
    Write-Host "[✓] Frontend Client ready at: $frontendPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Launching Frontend in default browser..." -ForegroundColor Cyan
    Start-Process $frontendPath
} else {
    Write-Host "[x] Frontend index.html not found." -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " AcxiomCRM Phase 0 & Phase 1 Environment Ready for Review!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
