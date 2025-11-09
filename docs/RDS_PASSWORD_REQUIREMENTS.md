# RDS Password Requirements

## AWS RDS PostgreSQL Password Rules

Your database password **must** meet these requirements:

### Required
- ✅ Minimum 8 characters
- ✅ Contains uppercase letters
- ✅ Contains lowercase letters  
- ✅ Contains numbers
- ✅ Contains special characters

### Forbidden Characters
- ❌ `/` (forward slash)
- ❌ `@` (at sign)
- ❌ `"` (double quote)
- ❌ Spaces

### Allowed Special Characters
You CAN use these special characters:
- `! # $ % ^ & * ( ) - _ = + [ ] { } | ; : , . < > ?`

## Examples

### ✅ Valid Passwords
```
MySecurePass123!
FlightSchedule2024#
DemoPassword$99
Test123!@#$
```

### ❌ Invalid Passwords
```
My/Password123!     (contains /)
Admin@Pass123!      (contains @)
"My Password"       (contains " and spaces)
Secure Pass 123!    (contains spaces)
```

## How to Update

1. Edit your `.env` file
2. Update `DB_MASTER_PASSWORD` with a valid password
3. Re-run the deployment

Example:
```env
DB_MASTER_PASSWORD=MySecureDemo123!
```


