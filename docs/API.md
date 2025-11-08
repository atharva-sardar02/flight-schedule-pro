# Flight Schedule Pro API Documentation

## Base URL

**Development:** `http://localhost:3001`  
**Staging:** `https://api-staging.flightschedulepro.com`  
**Production:** `https://api.flightschedulepro.com`

## Authentication

All API endpoints (except `/auth/register` and `/auth/login`) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained via `/auth/login` and can be refreshed using `/auth/refresh`.

---

## Authentication Endpoints

### POST /auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "STUDENT",
  "trainingLevel": "STUDENT_PILOT"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  },
  "message": "User registered successfully"
}
```

**Roles:** `STUDENT`, `INSTRUCTOR`, `ADMIN`  
**Training Levels:** `STUDENT_PILOT`, `PRIVATE_PILOT`, `INSTRUMENT_RATED`

---

### POST /auth/login

Authenticate and receive JWT token.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "student@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT"
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token",
    "expiresIn": 3600
  }
}
```

---

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new_jwt_token",
  "expiresIn": 3600
}
```

---

### GET /auth/me

Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "student@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "role": "STUDENT",
  "trainingLevel": "STUDENT_PILOT",
  "createdAt": "2024-11-08T10:00:00Z",
  "updatedAt": "2024-11-08T10:00:00Z"
}
```

---

## Booking Endpoints

### GET /bookings

List bookings with optional filters.

**Query Parameters:**
- `studentId` (string, optional): Filter by student ID
- `instructorId` (string, optional): Filter by instructor ID
- `status` (string, optional): Filter by status (`CONFIRMED`, `AT_RISK`, `RESCHEDULING`, `CANCELLED`, `COMPLETED`)
- `trainingLevel` (string, optional): Filter by training level
- `startDate` (string, optional): ISO 8601 date string
- `endDate` (string, optional): ISO 8601 date string
- `limit` (number, optional): Results per page (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "uuid",
      "studentId": "uuid",
      "instructorId": "uuid",
      "aircraftId": "N12345",
      "departureAirport": "KJFK",
      "arrivalAirport": "KLAX",
      "departureLatitude": 40.6413,
      "departureLongitude": -73.7781,
      "arrivalLatitude": 33.9425,
      "arrivalLongitude": -118.4081,
      "scheduledDatetime": "2025-11-12T21:23:00.000Z",
      "status": "CONFIRMED",
      "trainingLevel": "STUDENT_PILOT",
      "durationMinutes": 60,
      "createdAt": "2024-11-08T10:00:00Z",
      "updatedAt": "2024-11-08T10:00:00Z"
    }
  ]
}
```

**Authorization:** Students see only their bookings, instructors see their assigned bookings, admins see all.

---

### POST /bookings

Create a new flight booking.

**Request Body:**
```json
{
  "studentId": "uuid",
  "instructorId": "uuid",
  "aircraftId": "N12345",
  "departureAirport": "KJFK",
  "arrivalAirport": "KLAX",
  "departureLatitude": 40.6413,
  "departureLongitude": -73.7781,
  "arrivalLatitude": 33.9425,
  "arrivalLongitude": -118.4081,
  "scheduledDatetime": "2025-11-12T21:23:00.000Z",
  "trainingLevel": "STUDENT_PILOT",
  "durationMinutes": 60
}
```

**Response:** `201 Created`
```json
{
  "booking": {
    "id": "uuid",
    "status": "CONFIRMED",
    "scheduledDatetime": "2025-11-12T21:23:00.000Z",
    ...
  }
}
```

**Validation:**
- `aircraftId` must match N-number format: `N` followed by 1-5 digits, optionally 0-2 letters
- `scheduledDatetime` must be in the future
- Weather is automatically validated; booking may be created with `AT_RISK` status if weather is invalid

---

### GET /bookings/:id

Get detailed booking information.

**Response:** `200 OK`
```json
{
  "booking": {
    "id": "uuid",
    "student": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "student@example.com"
    },
    "instructor": {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "instructor@example.com"
    },
    "departureAirport": "KJFK",
    "arrivalAirport": "KLAX",
    "scheduledDatetime": "2025-11-12T21:23:00.000Z",
    "status": "CONFIRMED",
    ...
  }
}
```

---

### PUT /bookings/:id

Update booking details.

**Request Body:**
```json
{
  "aircraftId": "N67890",
  "scheduledDatetime": "2025-11-13T14:00:00.000Z",
  "durationMinutes": 90
}
```

**Response:** `200 OK`
```json
{
  "booking": {
    "id": "uuid",
    "scheduledDatetime": "2025-11-13T14:00:00.000Z",
    ...
  }
}
```

**Authorization:** Only the instructor or admin can update bookings.

---

### DELETE /bookings/:id

Permanently delete a booking.

**Response:** `204 No Content`

**Authorization:** Only admin can delete bookings.

---

### POST /bookings/:id/cancel

Cancel a booking (soft delete - sets status to `CANCELLED`).

**Response:** `200 OK`
```json
{
  "booking": {
    "id": "uuid",
    "status": "CANCELLED",
    ...
  }
}
```

---

## Availability Endpoints

### GET /availability

Get computed availability for a user within a date range.

**Query Parameters:**
- `userId` (string, required): User ID
- `startDate` (string, required): ISO 8601 date (YYYY-MM-DD)
- `endDate` (string, required): ISO 8601 date (YYYY-MM-DD)

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "startDate": "2025-11-08",
  "endDate": "2025-12-08",
  "slots": [
    {
      "date": "2025-11-10",
      "startTime": "09:00",
      "endTime": "17:00",
      "isAvailable": true,
      "source": "recurring",
      "reason": null
    }
  ],
  "recurringPatterns": [...],
  "overrides": [...]
}
```

---

### GET /availability/recurring

List all recurring availability patterns for the authenticated user.

**Response:** `200 OK`
```json
{
  "patterns": [
    {
      "id": "uuid",
      "userId": "uuid",
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "createdAt": "2024-11-08T10:00:00Z",
      "updatedAt": "2024-11-08T10:00:00Z"
    }
  ]
}
```

**Day of Week:** 0 = Sunday, 1 = Monday, ..., 6 = Saturday

---

### POST /availability/recurring

Create a new recurring availability pattern.

**Request Body:**
```json
{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "17:00"
}
```

**Response:** `201 Created`
```json
{
  "pattern": {
    "id": "uuid",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true,
    ...
  }
}
```

---

### PUT /availability/recurring/:id

Update a recurring availability pattern.

**Request Body:**
```json
{
  "dayOfWeek": 2,
  "startTime": "10:00",
  "endTime": "18:00",
  "isActive": false
}
```

**Response:** `200 OK`

---

### DELETE /availability/recurring/:id

Delete a recurring availability pattern.

**Response:** `204 No Content`

---

### GET /availability/overrides

List all availability overrides for the authenticated user.

**Response:** `200 OK`
```json
{
  "overrides": [
    {
      "id": "uuid",
      "userId": "uuid",
      "overrideDate": "2025-12-25",
      "startTime": null,
      "endTime": null,
      "isBlocked": true,
      "reason": "Holiday",
      "createdAt": "2024-11-08T10:00:00Z"
    }
  ]
}
```

---

### POST /availability/overrides

Create a one-time availability override.

**Request Body:**
```json
{
  "overrideDate": "2025-12-25",
  "isBlocked": true,
  "reason": "Holiday"
}
```

**Response:** `201 Created`

---

### PUT /availability/overrides/:id

Update an availability override.

**Response:** `200 OK`

---

### DELETE /availability/overrides/:id

Delete an availability override.

**Response:** `204 No Content`

---

## Rescheduling Endpoints

### POST /reschedule/generate/:bookingId

Generate AI-powered rescheduling options for a booking.

**Response:** `200 OK`
```json
{
  "options": [
    {
      "id": "uuid",
      "bookingId": "uuid",
      "suggestedDatetime": "2025-11-13T14:00:00.000Z",
      "departureAirport": "KJFK",
      "arrivalAirport": "KLAX",
      "weatherScore": 0.95,
      "confidence": 0.88,
      "reasoning": "Optimal weather conditions, instructor available, minimal schedule disruption",
      "createdAt": "2024-11-08T10:00:00Z"
    }
  ]
}
```

**Note:** This endpoint triggers the LangGraph AI workflow which may take 10-15 seconds.

---

### GET /reschedule/options/:bookingId

Get existing reschedule options for a booking.

**Response:** `200 OK`
```json
{
  "options": [...]
}
```

---

### POST /reschedule/confirm/:bookingId

Confirm and finalize a reschedule selection.

**Response:** `200 OK`
```json
{
  "success": true,
  "newScheduledTime": "2025-11-13T14:00:00.000Z",
  "weatherRevalidated": true,
  "notificationsSent": true
}
```

**Error Response:** `409 Conflict` (if weather re-validation fails)
```json
{
  "error": "Weather conditions no longer suitable",
  "reason": "Visibility below minimum for training level",
  "requiresNewOptions": true
}
```

**Note:** Weather is re-validated immediately before confirmation.

---

## Preference Endpoints

### POST /preferences/submit

Submit preference ranking for reschedule options.

**Request Body:**
```json
{
  "bookingId": "uuid",
  "option1Id": "uuid",
  "option2Id": "uuid",
  "option3Id": "uuid",
  "unavailableOptionIds": []
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "preference": {
    "id": "uuid",
    "bookingId": "uuid",
    "userId": "uuid",
    "option1Id": "uuid",
    "option2Id": "uuid",
    "option3Id": "uuid",
    "deadline": "2025-11-12T20:53:00.000Z",
    "submittedAt": "2024-11-08T10:00:00Z"
  },
  "bothSubmitted": false
}
```

**Deadline Enforcement:** Submissions after deadline are rejected with `403 Forbidden`.

**Deadline Calculation:** `min(30 minutes before departure, 12 hours after notification)`

---

### GET /preferences/booking/:bookingId

Get all preferences (student + instructor) for a booking.

**Response:** `200 OK`
```json
{
  "preferences": [
    {
      "id": "uuid",
      "userId": "uuid",
      "option1Id": "uuid",
      "option2Id": "uuid",
      "option3Id": "uuid",
      "deadline": "2025-11-12T20:53:00.000Z",
      "submittedAt": "2024-11-08T10:00:00Z"
    }
  ]
}
```

**Authorization:** Only student, instructor, or admin can view preferences.

---

### GET /preferences/my/:bookingId

Get current user's preference for a booking.

**Response:** `200 OK`
```json
{
  "preference": {
    "id": "uuid",
    "option1Id": "uuid",
    "option2Id": "uuid",
    "option3Id": "uuid",
    ...
  },
  "options": [...]
}
```

---

### POST /preferences/escalate/:bookingId

Manually escalate a booking when deadline passes without both preferences (admin only).

**Request Body:**
```json
{
  "resolution": "Manual reschedule to Nov 15, 2:00 PM",
  "notes": "Instructor unavailable, student preferred this time"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Booking escalated successfully"
}
```

**Authorization:** Admin only.

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid aircraftId (must be valid N-number format: N followed by 1-5 digits, optionally 0-2 letters)"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Deadline has passed. Preferences can no longer be submitted."
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Booking not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Weather conditions no longer suitable",
  "requiresNewOptions": true
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "retryable": true
}
```

---

## Rate Limiting

- **API Gateway:** 1000 requests/second burst, 500 requests/second sustained
- **Per User:** No additional rate limiting (handled by API Gateway)

---

## WebSocket Endpoints

### WebSocket Connection

**URL:** `wss://api.flightschedulepro.com/notifications`

**Authentication:** JWT token in query parameter:
```
wss://api.flightschedulepro.com/notifications?token=<jwt_token>
```

**Message Types:**
- `WEATHER_ALERT` - Weather conflict detected
- `OPTIONS_AVAILABLE` - Reschedule options generated
- `DEADLINE_REMINDER` - 2 hours before deadline
- `CONFIRMATION` - Reschedule confirmed

---

## Development Endpoints

### POST /dev/confirm-user

**Development Only** - Manually confirm a Cognito user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### POST /dev/sync-user

**Development Only** - Sync Cognito user to database.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## Pagination

List endpoints support pagination via `limit` and `offset` query parameters:

```
GET /bookings?limit=20&offset=0
```

**Default:** `limit=20`, `offset=0`

---

## Date/Time Formats

- **ISO 8601:** All datetime fields use ISO 8601 format: `2025-11-12T21:23:00.000Z`
- **Date Only:** Date fields use format: `2025-11-12` (YYYY-MM-DD)
- **Time Only:** Time fields use format: `09:00` (HH:MM in 24-hour format)

---

## Status Codes Summary

- `200 OK` - Successful GET, PUT, POST (non-create)
- `201 Created` - Successful POST (create)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authorization failed
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., weather re-validation failed)
- `500 Internal Server Error` - Server error

---

**Last Updated:** November 2024  
**API Version:** 0.1.0

