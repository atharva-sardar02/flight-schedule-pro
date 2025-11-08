# Troubleshooting Guide

## Common Issues and Solutions

---

## Authentication Issues

### Issue: "User is not confirmed"

**Symptoms:**
- Registration succeeds but login fails
- Error: "User is not confirmed"

**Solution:**
```bash
# Development: Use dev endpoint
curl -X POST http://localhost:3001/dev/confirm-user \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Production:** User must verify email via Cognito email link.

---

### Issue: "Invalid token" or "Unauthorized"

**Symptoms:**
- API requests return 401 Unauthorized
- Token appears valid but rejected

**Solutions:**
1. **Check token expiration:**
   ```javascript
   // Decode JWT token (use jwt.io)
   // Check 'exp' field
   ```

2. **Refresh token:**
   ```javascript
   // Call /auth/refresh endpoint
   ```

3. **Verify Cognito configuration:**
   - Check `COGNITO_USER_POOL_ID`
   - Check `COGNITO_CLIENT_ID`
   - Verify AWS region matches

---

## Database Issues

### Issue: "relation does not exist"

**Symptoms:**
- Error: `relation "users" does not exist`
- API returns 500 errors

**Solution:**
```bash
# Run migrations
psql -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
# ... repeat for all migrations
```

**Windows PowerShell:**
```powershell
$env:PGPASSWORD = "your_password"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -U postgres -d flight_schedule_pro -f database/migrations/001_create_users.sql
```

---

### Issue: "connection refused" or "timeout"

**Symptoms:**
- Cannot connect to database
- Lambda functions fail with database errors

**Solutions:**
1. **Check database is running:**
   ```bash
   # Local
   pg_isready -h localhost -p 5432
   
   # RDS
   aws rds describe-db-instances --db-instance-identifier flight-schedule-pro-staging
   ```

2. **Check connection string:**
   ```bash
   # Verify environment variables
   echo $DATABASE_HOST
   echo $DATABASE_PORT
   echo $DATABASE_NAME
   ```

3. **Check security groups (RDS):**
   ```bash
   # Verify Lambda security group can access RDS
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

4. **Check VPC configuration (Lambda):**
   - Lambda must be in same VPC as RDS
   - Or use RDS proxy for connection pooling

---

### Issue: "too many connections"

**Symptoms:**
- Database connection errors
- Lambda functions timeout

**Solutions:**
1. **Check connection pool settings:**
   ```typescript
   // backend/src/utils/db.ts
   max: 5, // Reduce if needed
   ```

2. **Monitor connections:**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

3. **Kill idle connections:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
     AND state_change < now() - interval '5 minutes';
   ```

---

## Weather API Issues

### Issue: "Weather API failed"

**Symptoms:**
- Weather checks fail
- Bookings created with AT_RISK status incorrectly

**Solutions:**
1. **Check API keys:**
   ```bash
   # Verify keys are set
   echo $OPENWEATHERMAP_API_KEY
   echo $WEATHERAPI_COM_KEY
   ```

2. **Test API directly:**
   ```bash
   curl "https://api.openweathermap.org/data/2.5/weather?lat=40.6413&lon=-73.7781&appid=$OPENWEATHERMAP_API_KEY"
   ```

3. **Check rate limits:**
   - OpenWeatherMap: 1000 calls/day
   - WeatherAPI.com: 1M calls/month
   - Check usage in provider dashboards

4. **Verify failover:**
   - System should automatically use secondary provider
   - Check logs for failover messages

---

### Issue: "Weather cache not working"

**Symptoms:**
- Too many API calls
- High API costs

**Solutions:**
1. **Check cache TTL:**
   ```typescript
   // Should be 5 minutes
   const CACHE_TTL = 5 * 60 * 1000;
   ```

2. **Verify coordinate rounding:**
   ```typescript
   // Coordinates rounded to 0.01° (~1km)
   const roundedLat = Math.round(lat * 100) / 100;
   ```

3. **Clear cache if needed:**
   - Restart Lambda function
   - Or wait for TTL expiration

---

## Lambda Function Issues

### Issue: "Lambda timeout"

**Symptoms:**
- Functions timeout after 30 seconds
- AI rescheduling takes too long

**Solutions:**
1. **Increase timeout:**
   ```yaml
   # infrastructure/cloudformation/lambda.yaml
   Timeout: 60  # seconds
   ```

2. **Optimize function:**
   - Reduce database queries
   - Use connection pooling
   - Add caching

3. **Check CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/weather-monitor --follow
   ```

---

### Issue: "Cold start delays"

**Symptoms:**
- First request after inactivity is slow
- 5-10 second delays

**Solutions:**
1. **Enable provisioned concurrency:**
   ```yaml
   # For critical functions
   ProvisionedConcurrencyConfig:
     ProvisionedConcurrentExecutions: 2
   ```

2. **Optimize package size:**
   - Remove unused dependencies
   - Use tree shaking
   - Minimize imports

---

## API Gateway Issues

### Issue: "502 Bad Gateway"

**Symptoms:**
- API Gateway returns 502
- Lambda function appears to work

**Solutions:**
1. **Check Lambda integration:**
   - Verify integration type: AWS_PROXY
   - Check timeout settings
   - Verify IAM permissions

2. **Check Lambda response format:**
   ```typescript
   // Must return this format
   return {
     statusCode: 200,
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(data)
   };
   ```

3. **Check CloudWatch logs:**
   ```bash
   aws logs tail /aws/lambda/api-handler --follow
   ```

---

### Issue: "429 Too Many Requests"

**Symptoms:**
- Rate limit errors
- Requests throttled

**Solutions:**
1. **Check throttling settings:**
   ```yaml
   # API Gateway throttling
   ThrottleSettings:
     BurstLimit: 1000
     RateLimit: 500
   ```

2. **Implement client-side retry:**
   ```typescript
   // Exponential backoff
   await retryWithBackoff(() => api.call());
   ```

3. **Monitor usage:**
   - Check CloudWatch metrics
   - Identify high-traffic endpoints

---

## Frontend Issues

### Issue: "CORS error"

**Symptoms:**
- Browser console shows CORS errors
- API calls fail

**Solutions:**
1. **Check CORS configuration:**
   ```typescript
   // backend/src/dev-server.ts
   origin: 'http://localhost:3000'
   ```

2. **Verify API base URL:**
   ```typescript
   // frontend/.env
   VITE_API_BASE_URL=http://localhost:3001
   ```

3. **Check API Gateway CORS:**
   - Verify CORS enabled
   - Check allowed origins
   - Verify allowed methods

---

### Issue: "Component not rendering"

**Symptoms:**
- Blank page or component
- No console errors

**Solutions:**
1. **Check browser console:**
   - Open DevTools (F12)
   - Check for JavaScript errors
   - Check Network tab for failed requests

2. **Verify routing:**
   ```typescript
   // Check App.tsx routes
   // Verify component imports
   ```

3. **Check authentication:**
   - Verify user is logged in
   - Check token in localStorage
   - Verify protected routes

---

### Issue: "Bookings not showing on calendar"

**Symptoms:**
- Bookings visible in list but not calendar
- Calendar shows empty

**Solutions:**
1. **Check date range:**
   - Verify booking date is within calendar range
   - Check timezone handling

2. **Check console logs:**
   ```javascript
   // Look for debug messages
   console.log('BookingsCalendar - Added booking...');
   ```

3. **Verify data format:**
   - Check `scheduledDatetime` is valid ISO string
   - Verify date parsing

---

## Rescheduling Issues

### Issue: "AI rescheduling generates no options"

**Symptoms:**
- Reschedule request succeeds but returns 0 options
- Error: "No valid slots found"

**Solutions:**
1. **Check availability:**
   - Verify instructor has availability
   - Verify student has availability
   - Check for overlapping free time

2. **Check weather:**
   - Verify weather APIs working
   - Check for valid forecasts in 7-day window

3. **Check conflicts:**
   - Verify no existing bookings conflict
   - Check for schedule overlaps

4. **Check logs:**
   ```bash
   aws logs tail /aws/lambda/reschedule-engine --follow
   ```

---

### Issue: "Weather re-validation fails"

**Symptoms:**
- Confirmation fails with 409 Conflict
- Error: "Weather conditions no longer suitable"

**Solutions:**
1. **This is expected behavior:**
   - Weather can change between option generation and confirmation
   - System protects against unsafe conditions

2. **Generate new options:**
   - Click "Generate New Options"
   - System will create fresh options with current weather

3. **Check weather forecast:**
   - Verify forecast for selected time
   - Check training level minimums

---

### Issue: "Deadline enforcement not working"

**Symptoms:**
- Preferences accepted after deadline
- No deadline errors

**Solutions:**
1. **Check deadline calculation:**
   ```typescript
   // Should be: min(30 min before flight, 12 hours after notification)
   ```

2. **Verify timezone:**
   - Ensure UTC for calculations
   - Display in user's timezone

3. **Check API validation:**
   ```typescript
   // preferences.ts should check deadline
   if (now > deadline) {
     return 403 Forbidden;
   }
   ```

---

## Notification Issues

### Issue: "Emails not sending"

**Symptoms:**
- Notifications created but emails not received

**Solutions:**
1. **Check SES configuration:**
   ```bash
   # Verify domain/email verified
   aws ses get-identity-verification-attributes --identities yourdomain.com
   ```

2. **Check SES sandbox mode:**
   - Sandbox mode: Can only send to verified emails
   - Production access: Request from AWS

3. **Check bounce/complaint handling:**
   ```bash
   # Check for bounces
   aws ses get-send-statistics
   ```

4. **Check Lambda logs:**
   ```bash
   aws logs tail /aws/lambda/email-service --follow
   ```

---

### Issue: "In-app notifications not appearing"

**Symptoms:**
- Notifications created in database but not shown in UI

**Solutions:**
1. **Check WebSocket connection:**
   ```javascript
   // Verify WebSocket connected
   console.log(ws.readyState); // Should be 1 (OPEN)
   ```

2. **Check notification query:**
   ```sql
   SELECT * FROM notifications
   WHERE user_id = $1 AND read = false;
   ```

3. **Check frontend hook:**
   ```typescript
   // useNotifications hook should poll or use WebSocket
   ```

---

## Performance Issues

### Issue: "Slow API responses"

**Symptoms:**
- API calls take >1 second
- Dashboard loads slowly

**Solutions:**
1. **Check database indexes:**
   ```sql
   -- Verify indexes exist
   \d bookings
   \d availability_patterns
   ```

2. **Check query performance:**
   ```sql
   -- Use EXPLAIN ANALYZE
   EXPLAIN ANALYZE SELECT * FROM bookings WHERE student_id = $1;
   ```

3. **Check Lambda memory:**
   ```yaml
   # Increase memory for better CPU
   MemorySize: 1024  # MB
   ```

4. **Check connection pooling:**
   - Verify pool is reused
   - Check pool size

---

### Issue: "High Lambda costs"

**Symptoms:**
- Unexpected AWS charges
- High Lambda invocation count

**Solutions:**
1. **Check provisioned concurrency:**
   - Only enable for critical functions
   - Monitor usage

2. **Optimize function code:**
   - Reduce execution time
   - Minimize external API calls
   - Use caching

3. **Monitor CloudWatch:**
   ```bash
   # Check invocation counts
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Lambda \
     --metric-name Invocations
   ```

---

## Deployment Issues

### Issue: "CloudFormation stack fails"

**Symptoms:**
- Deployment script fails
- Stack creation/update fails

**Solutions:**
1. **Check stack events:**
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name flight-schedule-pro-staging
   ```

2. **Common causes:**
   - IAM permissions insufficient
   - Resource limits exceeded
   - Invalid parameter values
   - Dependency order issues

3. **Validate templates:**
   ```bash
   aws cloudformation validate-template \
     --template-body file://infrastructure/cloudformation/lambda.yaml
   ```

---

### Issue: "Lambda deployment fails"

**Symptoms:**
- Function code not updating
- Deployment errors

**Solutions:**
1. **Check package size:**
   - Lambda limit: 50 MB (zipped)
   - Use layers for large dependencies

2. **Check IAM permissions:**
   ```bash
   # Verify Lambda update permissions
   aws iam get-role-policy \
     --role-name lambda-execution-role \
     --policy-name lambda-update-policy
   ```

3. **Check build output:**
   ```bash
   # Verify build succeeds
   cd backend
   npm run build
   ```

---

## Debugging Tips

### Enable Debug Logging

**Backend:**
```typescript
// Set log level
process.env.LOG_LEVEL = 'DEBUG';

// Or in code
logger.debug('Debug message', { data });
```

**Frontend:**
```typescript
// Enable React DevTools
// Check browser console
// Use React Profiler
```

### Check CloudWatch Logs

```bash
# Tail logs in real-time
aws logs tail /aws/lambda/weather-monitor --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/weather-monitor \
  --filter-pattern "ERROR"
```

### Database Debugging

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Getting Help

### Check Documentation
- `docs/API.md` - API reference
- `docs/ARCHITECTURE.md` - System architecture
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/OPERATIONS.md` - Operations runbook

### Check Logs
- CloudWatch Logs for Lambda functions
- Browser console for frontend errors
- Database logs for query issues

### Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request body format |
| 401 | Unauthorized | Check authentication token |
| 403 | Forbidden | Check user permissions/role |
| 404 | Not Found | Check resource ID exists |
| 409 | Conflict | Usually weather re-validation failed |
| 500 | Server Error | Check CloudWatch logs |
| 502 | Bad Gateway | Check Lambda integration |
| 503 | Service Unavailable | Check service health |

---

**Last Updated:** November 2024  
**Version:** 1.0.0

