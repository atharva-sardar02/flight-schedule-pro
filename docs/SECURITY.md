# Security Documentation

## Security Hardening & Input Validation

This document outlines the security measures implemented in Flight Schedule Pro.

## Input Validation

### Backend Validation
All API endpoints use comprehensive input validation via `backend/src/utils/inputValidation.ts`:

- **UUID Validation**: All ID parameters validated as proper UUIDs
- **Email Validation**: RFC-compliant email format validation
- **Airport Code Validation**: ICAO format (4 letters)
- **Coordinate Validation**: Latitude (-90 to 90), Longitude (-180 to 180)
- **Date/Time Validation**: ISO 8601 format, future date checks
- **Training Level Validation**: Enum validation
- **String Length Validation**: Min/max length constraints
- **Numeric Range Validation**: Min/max value constraints

### Frontend Validation
Frontend uses `frontend/src/utils/validationUtils.ts` for client-side validation:

- Email, phone number, password strength
- Airport codes, tail numbers
- Date/time formats
- String sanitization (XSS prevention)

## SQL Injection Prevention

All database queries use **parameterized queries** exclusively:

```typescript
// ✅ CORRECT - Parameterized query
await pool.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);

// ❌ NEVER - String concatenation
await pool.query(`SELECT * FROM bookings WHERE id = '${bookingId}'`);
```

**Verification**: All queries in the codebase use `$1`, `$2`, etc. parameter placeholders.

## Rate Limiting

API Gateway rate limiting configured:

- **Burst Limit**: 1000 requests/second
- **Sustained Rate**: 500 requests/second
- **Per-Method Settings**: Applied to all HTTP methods

## CORS Configuration

CORS configured via API Gateway Gateway Responses:

- **Allowed Origins**: 
  - Production: `https://flightschedulepro.com`
  - Dev/Staging: `*` (for development)
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, X-Requested-With
- **Max Age**: 3600 seconds

## Security Headers

All API responses include security headers:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - XSS protection
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains` - HSTS
- **Content-Security-Policy**: Restricts resource loading

## JWT Token Validation

JWT tokens validated via:

1. **Cognito Authorizer**: API Gateway-level validation
2. **Lambda Middleware**: `requireAuth()` function validates tokens
3. **Token Extraction**: Secure extraction from Authorization header
4. **Expiration Checking**: Tokens validated for expiration

## Request Sanitization

All user input sanitized:

- **String Sanitization**: Removes dangerous characters, HTML encodes
- **Object Sanitization**: Recursive sanitization of nested objects
- **Length Limits**: Maximum 1000 characters per string field
- **Type Validation**: Ensures correct data types

## Secrets Management

AWS Secrets Manager used for all sensitive data:

- **API Keys**: OpenWeatherMap, WeatherAPI.com, Anthropic
- **Database Credentials**: Auto-generated, rotated every 90 days
- **Rotation**: Automatic rotation configured for database credentials
- **Access Control**: IAM policies restrict access to Lambda functions only

## Multi-Factor Authentication (MFA)

MFA configuration:

- **User Pool**: MFA optional for all users
- **Admin Roles**: MFA required (enforced via application logic)
- **MFA Methods**: Software token (TOTP) and SMS
- **Enforcement**: `requiresMFA()` function checks admin roles

## Authentication & Authorization

- **Cognito User Pools**: Centralized user management
- **Role-Based Access Control**: STUDENT, INSTRUCTOR, ADMIN roles
- **JWT Tokens**: 12-hour expiration, refresh tokens (30 days)
- **Password Policy**: 
  - Minimum 8 characters
  - Requires uppercase, lowercase, numbers, symbols
  - 7-day temporary password validity

## Security Best Practices

1. **No Secrets in Code**: All secrets in Secrets Manager
2. **HTTPS Only**: Enforced via API Gateway
3. **Error Messages**: Don't leak sensitive information
4. **Input Validation**: All inputs validated before processing
5. **Parameterized Queries**: All database queries use parameters
6. **Security Headers**: All responses include security headers
7. **Rate Limiting**: Prevents abuse and DoS attacks
8. **CORS**: Restricts cross-origin requests
9. **MFA**: Required for admin roles
10. **Audit Logging**: All security events logged

## Security Audit Checklist

- [x] Input validation on all endpoints
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (input sanitization)
- [x] CSRF protection (CORS configuration)
- [x] Rate limiting configured
- [x] Security headers added
- [x] Secrets in Secrets Manager
- [x] MFA for admin roles
- [x] JWT token validation
- [x] Password complexity requirements
- [x] HTTPS enforced
- [x] Error messages don't leak info
- [x] Audit logging enabled

## Security Monitoring

- CloudWatch alarms for:
  - High error rates (potential attacks)
  - Unusual traffic patterns
  - Failed authentication attempts
  - Rate limit violations

## Incident Response

If a security incident is detected:

1. **Immediate**: Disable affected endpoints if necessary
2. **Investigation**: Review CloudWatch logs and audit trail
3. **Containment**: Rotate affected secrets
4. **Remediation**: Fix vulnerabilities
5. **Communication**: Notify affected users if data compromised
6. **Post-Mortem**: Document lessons learned

## Compliance

- **Data Encryption**: At rest (RDS, S3) and in transit (TLS 1.2+)
- **Access Logging**: All API access logged
- **Audit Trail**: Comprehensive audit logging
- **Data Retention**: Per environment policies
- **PII Protection**: Email addresses masked in logs

---

**Last Updated**: November 2024 (After PR #17 completion)

