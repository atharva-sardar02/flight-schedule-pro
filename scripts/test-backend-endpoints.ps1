# Test Backend Endpoints Script
# Tests all API endpoints locally (connecting to AWS RDS)

$baseUrl = "http://localhost:3001"
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Path,
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $url = "$baseUrl$Path"
    Write-Host "Testing: $Method $Path" -ForegroundColor Cyan
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            UseBasicParsing = $true
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        
        Write-Host "  ✓ Status: $status" -ForegroundColor Green
        
        $script:testResults += [PSCustomObject]@{
            Endpoint = "$Method $Path"
            Status = $status
            Success = $true
        }
        
        return $content
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "  ✗ Status: $status" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:testResults += [PSCustomObject]@{
            Endpoint = "$Method $Path"
            Status = $status
            Success = $false
        }
        
        return $null
    }
}

Write-Host "`n=== Testing Backend Endpoints ===" -ForegroundColor Yellow
Write-Host "Base URL: $baseUrl`n" -ForegroundColor Gray

# Health Check
Test-Endpoint -Method "GET" -Path "/health"

# Root endpoint
Test-Endpoint -Method "GET" -Path "/"

# API Info
Test-Endpoint -Method "GET" -Path "/api"

# Auth endpoints (will fail without proper auth, but test structure)
Test-Endpoint -Method "GET" -Path "/auth/me"

# Bookings (will fail without auth)
Test-Endpoint -Method "GET" -Path "/bookings"

# Availability (will fail without auth)
Test-Endpoint -Method "GET" -Path "/availability?userId=test&startDate=2025-01-01&endDate=2025-01-31"

Write-Host "`n=== Test Summary ===" -ForegroundColor Yellow
$passed = ($testResults | Where-Object { $_.Success }).Count
$failed = ($testResults | Where-Object { -not $_.Success }).Count
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

$testResults | Format-Table -AutoSize

