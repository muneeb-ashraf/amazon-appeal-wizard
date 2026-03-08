# 🚀 Production Deployment Checklist

## Overview

This checklist ensures the Amazon Appeal Wizard admin panel is production-ready. Complete all items before deploying to production.

---

## Pre-Deployment

### 1. Environment Setup

#### Environment Variables
- [ ] **AWS_REGION** - AWS region configured
- [ ] **AWS_ACCESS_KEY_ID** - Set (or use IAM role)
- [ ] **AWS_SECRET_ACCESS_KEY** - Set (or use IAM role)
- [ ] **OPENAI_API_KEY** - OpenAI API key configured
- [ ] **NEXT_PUBLIC_DYNAMODB_*_TABLE** - All table names set
- [ ] **NODE_ENV** - Set to `production`
- [ ] **Remove development secrets** - No hardcoded keys

#### AWS Resources
- [ ] **DynamoDB tables created** - All 3 admin tables
- [ ] **S3 bucket created** - For template documents
- [ ] **IAM roles configured** - Least privilege access
- [ ] **Encryption enabled** - DynamoDB and S3
- [ ] **Backups configured** - Automatic backups
- [ ] **CloudWatch alarms** - Monitoring set up

### 2. Database Setup

#### DynamoDB Tables
- [ ] **admin-configurations** - Created with GSI
- [ ] **admin-configuration-history** - Created
- [ ] **admin-test-appeals** - Created
- [ ] **Seed data loaded** - Run `npm run seed-admin-ts`
- [ ] **Verify data** - Check active configurations exist

```bash
# Create tables
npm run create-admin-tables

# Seed initial data
npm run seed-admin-ts

# Verify
aws dynamodb scan --table-name admin-configurations --max-items 5
```

### 3. Code Quality

#### Testing
- [ ] **Unit tests pass** - All tests green
- [ ] **Integration tests pass** - API endpoints work
- [ ] **E2E tests pass** - User flows complete
- [ ] **Manual testing** - Full admin panel walkthrough
- [ ] **Mobile testing** - iOS and Android tested

#### Code Review
- [ ] **Security review** - Check SECURITY_AUDIT.md
- [ ] **Performance review** - No slow queries
- [ ] **Error handling** - Graceful error handling
- [ ] **TypeScript strict** - No type errors
- [ ] **ESLint clean** - `npm run lint` passes

```bash
# Run checks
npm run lint
npm run build
npm run test # if tests are set up
```

### 4. Dependencies

#### Audit
- [ ] **npm audit** - No critical vulnerabilities
- [ ] **Update packages** - Latest stable versions
- [ ] **Remove unused** - Clean up unused deps
- [ ] **License check** - All licenses compatible

```bash
# Audit dependencies
npm audit
npm audit fix

# Check for updates
npm outdated

# Remove unused
npm prune
```

---

## Deployment Configuration

### 1. Next.js Configuration

#### Production Settings
- [ ] **Output mode** - Standalone or static
- [ ] **Image optimization** - Configured properly
- [ ] **Compression** - Gzip/Brotli enabled
- [ ] **Source maps** - Disabled in production
- [ ] **Analytics** - Optional analytics configured

```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
};
```

### 2. Security Headers

#### HTTP Headers
- [ ] **Content-Security-Policy** - CSP configured
- [ ] **X-Frame-Options** - Clickjacking protection
- [ ] **HTTPS redirect** - Force HTTPS
- [ ] **HSTS** - Strict transport security
- [ ] **Security headers** - All recommended headers

```javascript
// next.config.js security headers
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];
```

### 3. Performance

#### Optimization
- [ ] **Bundle analysis** - Check bundle sizes
- [ ] **Code splitting** - Dynamic imports used
- [ ] **Image optimization** - Next/Image used
- [ ] **Lazy loading** - Components lazy loaded
- [ ] **Caching strategy** - Cache headers configured

```bash
# Analyze bundle
npm install --save-dev @next/bundle-analyzer
ANALYZE=true npm run build
```

---

## Deployment Steps

### 1. Build & Test

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Build for production
npm run build

# Test production build locally
npm run start
```

### 2. Deploy to Hosting

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

#### AWS Amplify
```bash
# Connect GitHub repo
# Configure build settings
# Deploy from Amplify console
```

#### Docker
```bash
# Build Docker image
docker build -t amazon-appeal-wizard .

# Run container
docker run -p 3000:3000 amazon-appeal-wizard
```

### 3. Database Migration

```bash
# Run seed script on production
npm run seed-admin-ts

# Verify data
# Check admin panel loads
# Test configuration changes
```

---

## Post-Deployment

### 1. Verification

#### Functionality
- [ ] **Admin login works** - Authentication successful
- [ ] **Dashboard loads** - No errors
- [ ] **AI editor works** - Edit and save configs
- [ ] **Form fields work** - Edit and save
- [ ] **Templates work** - Upload and delete
- [ ] **Testing works** - Generate test appeals
- [ ] **Versioning works** - View history, rollback
- [ ] **Integration works** - Live form uses configs

#### Performance
- [ ] **Page load time** - < 3 seconds
- [ ] **API response time** - < 500ms average
- [ ] **Database queries** - Optimized, no scans
- [ ] **Caching working** - 5-minute TTL active
- [ ] **No memory leaks** - Monitor for 24 hours

#### Security
- [ ] **HTTPS working** - Green padlock
- [ ] **Headers present** - Security headers set
- [ ] **No secrets exposed** - Check client-side code
- [ ] **Auth working** - Unauthorized access blocked
- [ ] **Rate limiting** - Test with multiple requests

### 2. Monitoring

#### CloudWatch
- [ ] **Logs configured** - Application logs
- [ ] **Metrics tracked** - API requests, errors
- [ ] **Alarms set** - Error rate, latency
- [ ] **Dashboard created** - Monitoring dashboard

#### Alerts
- [ ] **Error alerts** - Email on errors
- [ ] **Cost alerts** - AWS spending alerts
- [ ] **Uptime monitoring** - Pingdom or similar
- [ ] **Performance alerts** - Slow response times

### 3. Backup & Recovery

#### Backups
- [ ] **DynamoDB backups** - Automated daily
- [ ] **S3 versioning** - Enabled
- [ ] **Code backup** - Git repository
- [ ] **Environment backup** - Document all env vars

#### Recovery Plan
- [ ] **Rollback procedure** - Documented
- [ ] **Data restore** - Tested recovery
- [ ] **Emergency contacts** - Team contact list
- [ ] **Incident response** - Response plan ready

---

## User Handoff

### 1. Documentation

- [ ] **Admin guide** - USER_GUIDE.md created
- [ ] **Video tutorial** - Walkthrough recorded
- [ ] **API documentation** - If exposing APIs
- [ ] **Troubleshooting guide** - Common issues
- [ ] **FAQ** - Frequently asked questions

### 2. Training

- [ ] **Demo session** - Walk through admin panel
- [ ] **Test configurations** - Practice editing
- [ ] **Test appeals** - Generate test appeals
- [ ] **Rollback demo** - Show version control
- [ ] **Support handoff** - Support contact established

### 3. Access

- [ ] **Admin credentials** - Provided securely
- [ ] **AWS console access** - If needed
- [ ] **GitHub access** - Repository access
- [ ] **Documentation access** - All docs accessible
- [ ] **Support channel** - Slack, email, etc.

---

## Maintenance

### Regular Tasks

#### Weekly
- [ ] **Check logs** - Review CloudWatch logs
- [ ] **Monitor errors** - Check error rates
- [ ] **Review backups** - Verify backups succeeded

#### Monthly
- [ ] **Dependency updates** - Update packages
- [ ] **Security audit** - Check for vulnerabilities
- [ ] **Performance review** - Analyze metrics
- [ ] **Cost review** - Check AWS spending

#### Quarterly
- [ ] **Security scan** - Professional audit
- [ ] **User feedback** - Collect feedback
- [ ] **Feature review** - Plan improvements
- [ ] **Disaster recovery drill** - Test recovery

---

## Rollback Plan

### If Deployment Fails

1. **Immediate Actions**
   - [ ] Revert to previous deployment
   - [ ] Check error logs
   - [ ] Notify team

2. **Investigation**
   - [ ] Identify root cause
   - [ ] Document issue
   - [ ] Plan fix

3. **Re-deployment**
   - [ ] Fix identified issues
   - [ ] Test thoroughly
   - [ ] Deploy again

### Rollback Commands

```bash
# Vercel rollback
vercel rollback <deployment-url>

# Git rollback
git revert HEAD
git push origin main

# Database rollback
aws dynamodb restore-table-from-backup \
  --target-table-name admin-configurations \
  --backup-arn <backup-arn>
```

---

## Success Criteria

### Deployment is successful when:

1. ✅ All admin panel pages load without errors
2. ✅ Configurations can be edited and saved
3. ✅ Test appeals can be generated
4. ✅ Live form uses active configurations
5. ✅ No security vulnerabilities present
6. ✅ Performance meets requirements (< 3s load)
7. ✅ Monitoring and alerts functional
8. ✅ Documentation complete
9. ✅ User trained and has access
10. ✅ Backup and recovery tested

---

## Final Sign-Off

**Deployment Date**: _______________

**Deployed By**: _______________

**Verified By**: _______________

**Production URL**: _______________

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

**Created**: March 7, 2026
**Status**: Ready for Use
**Next Review**: Before Production Deployment
