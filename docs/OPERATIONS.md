# Operations Runbook

## Overview

This runbook provides operational procedures for maintaining Flight Schedule Pro in production.

---

## Daily Operations

### Morning Checklist

1. **Check CloudWatch Dashboards**
   - Review error rates
   - Check Lambda invocations
   - Verify weather monitor execution
   - Review API Gateway metrics

2. **Check Alarms**
   - Review any triggered alarms
   - Investigate error spikes
   - Verify notification delivery

3. **Review Logs**
   - Check for ERROR level logs
   - Review weather monitor execution
   - Check for failed API calls

### Weekly Tasks

1. **Performance Review**
   - Review slow query logs
   - Check database connection pool usage
   - Review Lambda execution times
   - Check API response times

2. **Cost Review**
   - Review AWS cost reports
   - Identify cost optimization opportunities
   - Check for unused resources

3. **Security Review**
   - Review access logs
   - Check for suspicious activity
   - Verify IAM permissions

---

## Monitoring

### CloudWatch Dashboards

**Main Dashboard:** `FlightSchedulePro-Main`

**Key Metrics:**
- Lambda invocations and errors
- API Gateway 4xx/5xx errors
- RDS CPU and connections
- Weather API success rate
- Notification delivery rate

**Access:**
```bash
aws cloudwatch get-dashboard \
  --dashboard-name FlightSchedulePro-Main \
  --region us-east-1
```

### CloudWatch Alarms

**Critical Alarms:**
- Lambda error rate > 5%
- API Gateway 5xx > 5%
- RDS CPU > 80%
- Weather API failures > 5%
- Notification delivery < 90%

**Alarm Actions:**
- SNS topic for on-call notifications
- Email alerts to ops team

---

## Incident Response

### Severity Levels

**P1 - Critical:**
- System completely down
- No bookings can be created
- Weather monitoring stopped
- Database unavailable

**P2 - High:**
- Partial functionality down
- High error rate (>10%)
- Notification delivery failing
- API Gateway throttling

**P3 - Medium:**
- Degraded performance
- Some features not working
- Non-critical errors

**P4 - Low:**
- Minor issues
- Cosmetic problems
- Documentation updates

### Response Procedures

**P1 Incident:**
1. Acknowledge alarm (within 5 minutes)
2. Check CloudWatch dashboards
3. Review recent deployments
4. Check database status
5. Escalate if needed
6. Document incident

**P2 Incident:**
1. Acknowledge alarm (within 15 minutes)
2. Check specific service logs
3. Identify root cause
4. Implement fix or workaround
5. Monitor resolution

**P3/P4 Incident:**
1. Acknowledge during business hours
2. Investigate and fix
3. Document solution

---

## Database Operations

### Backup Procedures

**Automated Backups:**
- RDS automated daily backups
- 7-day retention (staging)
- 30-day retention (production)
- Point-in-time recovery enabled

**Manual Backup:**
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier flight-schedule-pro-prod \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)

# Verify snapshot
aws rds describe-db-snapshots \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### Restore Procedures

**From Snapshot:**
```bash
# Restore to new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier flight-schedule-pro-restore \
  --db-snapshot-identifier manual-backup-20241108

# Update connection strings
# Verify data integrity
# Switch traffic to new instance
```

**Point-in-Time Recovery:**
```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier flight-schedule-pro-prod \
  --target-db-instance-identifier flight-schedule-pro-restore \
  --restore-time 2024-11-08T10:00:00Z
```

### Database Maintenance

**Vacuum:**
```sql
-- Analyze tables
VACUUM ANALYZE bookings;
VACUUM ANALYZE availability_patterns;
VACUUM ANALYZE audit_log;

-- Check table bloat
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup,
  n_live_tup
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Index Maintenance:**
```sql
-- Rebuild indexes if needed
REINDEX TABLE bookings;
REINDEX TABLE availability_patterns;
```

---

## Deployment Procedures

### Staging Deployment

```bash
# 1. Set environment variables
export AWS_REGION=us-east-1
export AWS_PROFILE=staging
export DB_MASTER_PASSWORD='YourPassword'

# 2. Run deployment script
./infrastructure/scripts/deploy-staging.sh

# 3. Run migrations
# (See DEPLOYMENT.md)

# 4. Verify deployment
curl https://api-staging.flightschedulepro.com/health

# 5. Run smoke tests
npm run test:smoke
```

### Production Deployment

```bash
# 1. Create change set
aws cloudformation create-change-set \
  --stack-name flight-schedule-pro-prod \
  --change-set-name update-$(date +%Y%m%d) \
  --template-body file://infrastructure/cloudformation/stack.yaml

# 2. Review change set
aws cloudformation describe-change-set \
  --stack-name flight-schedule-pro-prod \
  --change-set-name update-$(date +%Y%m%d)

# 3. Execute change set (after approval)
aws cloudformation execute-change-set \
  --stack-name flight-schedule-pro-prod \
  --change-set-name update-$(date +%Y%m%d)

# 4. Monitor deployment
aws cloudformation describe-stack-events \
  --stack-name flight-schedule-pro-prod \
  --max-items 20
```

### Rollback Procedures

**Infrastructure Rollback:**
```bash
# Delete stack (reverts all changes)
aws cloudformation delete-stack \
  --stack-name flight-schedule-pro-staging

# Or update to previous template
aws cloudformation update-stack \
  --stack-name flight-schedule-pro-staging \
  --template-body file://infrastructure/cloudformation/previous-version.yaml
```

**Lambda Rollback:**
```bash
# Deploy previous version
aws lambda update-function-code \
  --function-name weather-monitor \
  --zip-file fileb://previous-version.zip
```

---

## Scaling Operations

### Horizontal Scaling

**Lambda:**
- Automatic scaling (no action needed)
- Monitor concurrency limits
- Adjust if needed

**RDS:**
```bash
# Scale up instance
aws rds modify-db-instance \
  --db-instance-identifier flight-schedule-pro-prod \
  --db-instance-class db.t3.medium \
  --apply-immediately
```

**API Gateway:**
- Automatic scaling
- Monitor throttling
- Adjust limits if needed

### Vertical Scaling

**Lambda Memory:**
```yaml
# Increase memory for better CPU
MemorySize: 2048  # MB
```

**RDS Storage:**
```bash
# Increase storage (automatic)
aws rds modify-db-instance \
  --db-instance-identifier flight-schedule-pro-prod \
  --allocated-storage 100 \
  --apply-immediately
```

---

## Security Operations

### Access Management

**IAM Roles:**
- Review IAM roles quarterly
- Remove unused permissions
- Follow least privilege principle

**Cognito:**
- Review user pools monthly
- Remove inactive users
- Monitor failed login attempts

### Secrets Management

**Rotate Secrets:**
```bash
# Rotate database password
aws secretsmanager rotate-secret \
  --secret-id flight-schedule-pro/db-password

# Rotate API keys
aws secretsmanager update-secret \
  --secret-id flight-schedule-pro/openweathermap-key \
  --secret-string "new-api-key"
```

**Audit Secrets:**
```bash
# List all secrets
aws secretsmanager list-secrets

# Check last rotation
aws secretsmanager describe-secret \
  --secret-id flight-schedule-pro/db-password
```

---

## Performance Tuning

### Database Optimization

**Query Optimization:**
```sql
-- Identify slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE SELECT * FROM bookings WHERE student_id = $1;
```

**Index Optimization:**
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Lambda Optimization

**Memory Tuning:**
- Start with 512 MB
- Increase if CPU-bound
- Monitor execution time vs cost

**Provisioned Concurrency:**
- Enable for critical functions
- Monitor usage
- Adjust based on traffic

---

## Disaster Recovery

### Backup Strategy

**Database:**
- Daily automated backups
- Weekly manual snapshots
- Monthly long-term backups

**Code:**
- Git repository (GitHub)
- Lambda deployment packages in S3
- CloudFormation templates in Git

**Configuration:**
- Environment variables in Secrets Manager
- CloudFormation parameters documented

### Recovery Procedures

**Full System Recovery:**
1. Restore database from snapshot
2. Redeploy infrastructure (CloudFormation)
3. Deploy Lambda functions
4. Deploy frontend
5. Verify all services
6. Run smoke tests

**Partial Recovery:**
1. Identify affected component
2. Restore from backup
3. Verify functionality
4. Monitor for issues

---

## Maintenance Windows

### Scheduled Maintenance

**Weekly:**
- Review logs and metrics
- Check for security updates
- Review cost reports

**Monthly:**
- Database maintenance (vacuum, analyze)
- Review and rotate secrets
- Update documentation

**Quarterly:**
- Infrastructure review
- Security audit
- Performance optimization
- Cost optimization

### Emergency Maintenance

**Procedure:**
1. Notify stakeholders
2. Schedule maintenance window
3. Create backup
4. Perform maintenance
5. Verify functionality
6. Notify completion

---

## On-Call Procedures

### On-Call Rotation

- **Schedule:** Weekly rotation
- **Coverage:** 24/7 for P1/P2 incidents
- **Escalation:** Manager after 1 hour

### On-Call Responsibilities

1. **Monitor Alarms:**
   - Check CloudWatch alarms
   - Respond within SLA
   - Document incidents

2. **Handle Incidents:**
   - Acknowledge within SLA
   - Investigate root cause
   - Implement fix or workaround
   - Document resolution

3. **Communication:**
   - Update status page
   - Notify stakeholders
   - Post-mortem for P1 incidents

---

## Troubleshooting

See `docs/TROUBLESHOOTING.md` for detailed troubleshooting procedures.

**Quick Reference:**
- Check CloudWatch logs
- Review recent deployments
- Check database status
- Verify API keys
- Check security groups

---

## Contact Information

### Team Contacts

- **On-Call Engineer:** [Contact Info]
- **DevOps Team:** [Contact Info]
- **Database Admin:** [Contact Info]
- **Security Team:** [Contact Info]

### Escalation Path

1. On-Call Engineer
2. Team Lead
3. Engineering Manager
4. CTO (for P1 incidents)

---

**Last Updated:** November 2024  
**Version:** 1.0.0

