# Script to remove secrets from git history
# This uses git-filter-repo (recommended) or git filter-branch (fallback)

Write-Host "Cleaning git history to remove exposed API key..." -ForegroundColor Yellow
Write-Host "WARNING: This will rewrite git history. Make sure you have a backup!" -ForegroundColor Red
Write-Host ""

# Check if git-filter-repo is available
$hasFilterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue

if ($hasFilterRepo) {
    Write-Host "Using git-filter-repo (recommended method)..." -ForegroundColor Green
    
    # Remove the files from entire history
    git filter-repo --path config/config.js --path server.js --invert-paths --force
    
    Write-Host "`nFiles removed from history successfully!" -ForegroundColor Green
} else {
    Write-Host "git-filter-repo not found. Using git filter-branch..." -ForegroundColor Yellow
    Write-Host "Note: git-filter-repo is recommended. Install it with: pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host ""
    
    # Set environment variable to suppress warnings
    $env:FILTER_BRANCH_SQUELCH_WARNING = "1"
    
    # Remove files from history using filter-branch
    git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch config/config.js server.js 2>nul || true" `
        --prune-empty --tag-name-filter cat -- --all
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nFiles removed from history successfully!" -ForegroundColor Green
    } else {
        Write-Host "`nError occurred. You may need to install git-filter-repo." -ForegroundColor Red
        Write-Host "Install with: pip install git-filter-repo" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review changes: git log --oneline" -ForegroundColor White
Write-Host "2. Force push to update remote: git push origin --force --all" -ForegroundColor White
Write-Host "3. IMPORTANT: Revoke the exposed API key in your Brevo/Sendinblue account!" -ForegroundColor Red
Write-Host "4. Create a new API key and update it in your environment variables" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you prefer to use GitHub's allow secret feature instead:" -ForegroundColor Cyan
Write-Host "Visit: https://github.com/usaid1454/ExecellenceServices/security/secret-scanning/unblock-secret/35twCEv84ix3qFmZru6HY6gQVsv" -ForegroundColor White

