# PowerShell script to create a booking between student100 and instructor100
# Usage: .\scripts\create-booking.ps1 -Password "YourPassword"

param(
    [string]$Password = "Student100!",
    [string]$ApiBaseUrl = "http://3.87.74.62:3001"
)

$studentEmail = "student100@gmail.com"
$studentId = "71ef600e-d244-4ace-8a17-a42948cf4a5a"
$instructorId = "d8f386b9-9cfa-4405-85d0-8f433a1ecaf9"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Creating Booking: student100 ↔ instructor100" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "🔐 Logging in as student..." -ForegroundColor Yellow
$loginBody = @{
    email = $studentEmail
    password = $Password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $accessToken = $loginResponse.accessToken
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Create booking
Write-Host ""
Write-Host "📅 Creating booking..." -ForegroundColor Yellow

# Calculate date 7 days from now
$scheduledDate = (Get-Date).AddDays(7).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$bookingData = @{
    studentId = $studentId
    instructorId = $instructorId
    departureAirport = "KJFK"
    arrivalAirport = "KLAX"
    departureLatitude = 40.6413
    departureLongitude = -73.7781
    arrivalLatitude = 33.9425
    arrivalLongitude = -118.4081
    scheduledDatetime = $scheduledDate
    trainingLevel = "STUDENT_PILOT"
    durationMinutes = 120
} | ConvertTo-Json

Write-Host "Booking details:" -ForegroundColor Cyan
Write-Host "  Student: $studentId"
Write-Host "  Instructor: $instructorId"
Write-Host "  Route: KJFK → KLAX"
Write-Host "  Scheduled: $scheduledDate"
Write-Host "  Training Level: STUDENT_PILOT"
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $bookingResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/bookings" -Method POST -Body $bookingData -Headers $headers -ContentType "application/json"
    
    Write-Host "✅ Booking created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Booking details:" -ForegroundColor Cyan
    $bookingResponse.booking | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "✅ Success! Booking ID: $($bookingResponse.booking.id)" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Booking creation failed: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

