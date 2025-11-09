# PowerShell Script to Set Environment Variables for All Lambda Functions
# This sets the same environment variables for all 3 Lambda functions at once

Write-Host "`n=== Setting Environment Variables for All Lambda Functions ===" -ForegroundColor Cyan
Write-Host "This will update all 3 functions with the same environment variables.`n" -ForegroundColor Yellow

# Environment variables to set
$envVars = @{
    "NODE_ENV" = "staging"
    "DATABASE_HOST" = "flight-schedule-pro-staging-db.crws0amqe1e3.us-east-1.rds.amazonaws.com"
    "DATABASE_NAME" = "flight_schedule_pro"
    "DATABASE_USER" = "postgres"
    "DATABASE_PASSWORD_SECRET_ARN" = "arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/database-credentials-gYqeBF"
    "COGNITO_USER_POOL_ID" = "us-east-1_f6h1XdY8u"
    "COGNITO_CLIENT_ID" = "28tqtmpt1s0mrkcj4p5divnlh8"
    "OPENAI_API_KEY_SECRET_ARN" = "arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openai-api-key-2Si5nA"
    "OPENWEATHERMAP_API_KEY_SECRET_ARN" = "arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/openweathermap-api-key-0pDF8m"
    "WEATHERAPI_API_KEY_SECRET_ARN" = "arn:aws:secretsmanager:us-east-1:971422717446:secret:flight-schedule-pro/staging/weatherapi-com-key-a5RNBd"
    "SES_REGION" = "us-east-1"
    "LOG_LEVEL" = "info"
}

# Lambda function names
$functions = @(
    "flight-schedule-pro-staging-api",
    "flight-schedule-pro-staging-weather-monitor",
    "flight-schedule-pro-staging-notifications"
)

$region = "us-east-1"

# Convert hashtable to JSON format for AWS CLI
$envVarsJson = ($envVars.GetEnumerator() | ForEach-Object { 
    "$($_.Key)=$($_.Value)" 
}) -join ","

Write-Host "Updating environment variables for:" -ForegroundColor Cyan
foreach ($func in $functions) {
    Write-Host "  - $func" -ForegroundColor White
}

Write-Host "`nThis may take a few seconds...`n" -ForegroundColor Yellow

# Update each function
foreach ($functionName in $functions) {
    Write-Host "Updating $functionName..." -ForegroundColor Cyan
    
    try {
        $result = aws lambda update-function-configuration `
            --function-name $functionName `
            --environment "Variables={$envVarsJson}" `
            --region $region `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Successfully updated $functionName" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Failed to update $functionName" -ForegroundColor Red
            Write-Host "  Error: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Error updating $functionName : $_" -ForegroundColor Red
    }
}

Write-Host "`n=== Done! ===" -ForegroundColor Green
Write-Host "`nVerify in AWS Console:" -ForegroundColor Yellow
Write-Host "1. Go to Lambda Console" -ForegroundColor White
Write-Host "2. Check each function's Environment variables" -ForegroundColor White
Write-Host "3. All should have 12 variables set`n" -ForegroundColor White


