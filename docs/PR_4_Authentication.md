# PR #4: Authentication System (AWS Cognito Integration)

## Overview
Complete authentication system with AWS Cognito integration, including JWT validation, user registration/login, and protected routes.

## Files Created

### Backend
- **`backend/src/types/user.ts`** - User types, roles, and auth interfaces
- **`backend/src/services/authService.ts`** - AWS Cognito authentication service
- **`backend/src/middleware/auth.ts`** - JWT validation middleware for Lambda
- **`backend/src/functions/api/auth.ts`** - Authentication Lambda function (login, register, refresh, me)

### Frontend
- **`frontend/src/types/user.ts`** - Frontend user types and interfaces
- **`frontend/src/services/auth.ts`** - Frontend authentication API client
- **`frontend/src/hooks/useAuth.ts`** - Custom React hook with AuthProvider
- **`frontend/src/components/auth/Login.tsx`** - Login form component
- **`frontend/src/components/auth/Register.tsx`** - Registration form component
- **`frontend/src/components/auth/ProtectedRoute.tsx`** - Route protection wrapper
- **`frontend/src/services/api.ts`** - API configuration
- **`frontend/src/App.tsx`** - Updated with authentication routes

### Tests
- **`tests/unit/backend/authService.test.ts`** - Unit tests for auth service

### Configuration
- **`backend/package.json`** - Added `@aws-sdk/client-cognito-identity-provider`
- **`env.auth`** - Additional environment variables for Cognito configuration

## Features Implemented

### 1. Backend Authentication
- ✅ AWS Cognito user pool integration
- ✅ User registration with role-based groups (Students, Instructors, Admins)
- ✅ User login with email/password
- ✅ JWT token verification
- ✅ Token refresh functionality
- ✅ Get current user endpoint
- ✅ Authentication middleware for protected Lambda functions
- ✅ Role-based access control support

### 2. Frontend Authentication
- ✅ Login page with form validation
- ✅ Registration page with role selection
- ✅ Training level selection for students
- ✅ Protected route wrapper component
- ✅ Auth context with useAuth hook
- ✅ Token storage in localStorage
- ✅ Automatic token refresh
- ✅ Loading states and error handling

### 3. User Roles & Training Levels
- **Roles**: Student, Instructor, Admin
- **Training Levels**: Student Pilot, Private Pilot, Instrument Rated
- Role-based UI rendering
- Permission checking in routes

### 4. Security Features
- JWT token validation with Cognito
- Secure token storage
- Password requirements (8+ characters, uppercase, lowercase, numbers, symbols)
- Automatic logout on token expiration
- CORS configuration
- Protected API endpoints

## API Endpoints

### POST /auth/login
- Login with email and password
- Returns user object and JWT tokens

### POST /auth/register
- Register new user
- Creates Cognito user and database record
- Adds user to appropriate group

### POST /auth/refresh
- Refresh access token
- Uses refresh token from request body

### GET /auth/me
- Get current authenticated user
- Requires Authorization header with JWT token

## Environment Variables Required

```bash
# Backend
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# Frontend
VITE_API_BASE_URL=http://localhost:3001
```

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
cd frontend
npm test
```

## Next Steps (PR #5)
- Weather Service Integration (Dual Provider)
- OpenWeatherMap API integration
- WeatherAPI.com integration
- Dual-provider failover logic
- Flight corridor calculator

## Dependencies Added
- `@aws-sdk/client-cognito-identity-provider` - AWS Cognito SDK

## Notes
- Cognito User Pool must be created via CloudFormation (PR #3) before testing
- Database migrations must be run before registration works
- Tokens stored in localStorage (consider httpOnly cookies for production)
- MFA support configured in Cognito (optional)


