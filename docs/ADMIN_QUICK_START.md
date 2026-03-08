# Admin Panel Quick Start Guide

## 🚀 Get Started in 5 Minutes

Follow these steps to get the admin panel up and running.

---

## Step 1: Create DynamoDB Tables

You need to create 3 new DynamoDB tables. Choose one of these methods:

### Option A: AWS Console (Easiest)

1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb)
2. Click **"Create table"** for each of these:

#### Table 1: `admin-configurations`
- **Table name**: `admin-configurations`
- **Partition key**: `configId` (String)
- **Sort key**: `version` (Number)
- **Table settings**: Default settings
- **Billing mode**: On-demand
- After creation, add GSI:
  - **Index name**: `status-updatedAt-index`
  - **Partition key**: `configId` (String)
  - **Sort key**: `status` (String)

#### Table 2: `admin-configuration-history`
- **Table name**: `admin-configuration-history`
- **Partition key**: `historyId` (String)
- **Sort key**: `timestamp` (Number)
- **Billing mode**: On-demand
- After creation, add GSI:
  - **Index name**: `configId-timestamp-index`
  - **Partition key**: `configId` (String)
  - **Sort key**: `timestamp` (Number)

#### Table 3: `admin-test-appeals`
- **Table name**: `admin-test-appeals`
- **Partition key**: `testId` (String)
- **Billing mode**: On-demand
- After creation, add GSI:
  - **Index name**: `createdBy-createdAt-index`
  - **Partition key**: `createdBy` (String)
  - **Sort key**: `createdAt` (String)

### Option B: AWS CLI (Faster)

See `docs/DYNAMODB_TABLES.md` for complete AWS CLI commands.

Quick version:
```bash
export AWS_REGION=us-east-1

# Create admin-configurations table
aws dynamodb create-table \
  --table-name admin-configurations \
  --attribute-definitions \
    AttributeName=configId,AttributeType=S \
    AttributeName=version,AttributeType=N \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=configId,KeyType=HASH \
    AttributeName=version,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"status-updatedAt-index\",\"KeySchema\":[{\"AttributeName\":\"configId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

# (See DYNAMODB_TABLES.md for tables 2 and 3)
```

---

## Step 2: Update Environment Variables

Add these to your `.env.local` file:

```bash
# Admin Panel DynamoDB Tables
NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE=admin-configurations
NEXT_PUBLIC_DYNAMODB_ADMIN_HISTORY_TABLE=admin-configuration-history
NEXT_PUBLIC_DYNAMODB_ADMIN_TEST_TABLE=admin-test-appeals
```

---

## Step 3: Seed Initial Configurations

Run this command to populate the tables with your current hardcoded configurations:

```bash
npm run seed-admin
```

This will:
- ✅ Create active AI instructions configuration
- ✅ Create active form fields configuration
- ✅ Create initial templates configuration
- ✅ Add history records for each

**Expected output**:
```
🌱 Starting admin configuration seeding...

📝 Creating ai-instructions configuration...
✅ Created ai-instructions configuration (version 1709740800000)

📝 Creating form-fields configuration...
✅ Created form-fields configuration (version 1709740801000)

📝 Creating templates configuration...
✅ Created templates configuration (version 1709740802000)

✅ All configurations seeded successfully!

You can now:
1. Visit /admin to view the admin panel
2. Edit configurations using the UI
3. Test changes before activating them

🎉 Seeding completed!
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

---

## Step 5: Access Admin Panel

Open your browser and go to:
```
http://localhost:3000/admin
```

You should see the admin dashboard with:
- Configuration status cards
- Quick action buttons
- Cache statistics (if any configs are cached)

---

## ✅ Verify Everything Works

### Test 1: View Active Configurations

In the dashboard, you should see 3 configuration cards:
- ✅ AI Instructions - Active
- ✅ Form Fields - Active
- ✅ Templates - Active

### Test 2: API Endpoints

Open your browser's developer console and run:

```javascript
// Get AI instructions config
fetch('/api/admin/config/ai-instructions')
  .then(r => r.json())
  .then(console.log);

// Get form fields config
fetch('/api/admin/config/form-fields')
  .then(r => r.json())
  .then(console.log);

// Get cache stats
fetch('/api/admin/cache/invalidate')
  .then(r => r.json())
  .then(console.log);
```

All should return `{ success: true, ... }`.

### Test 3: Cache Invalidation

Click the **"Clear Cache"** button in the dashboard. You should see an alert:
```
Cache invalidated successfully!
```

---

## 🎯 What You Can Do Now

### ✅ Currently Working
- View configuration status
- See active versions
- Check cache statistics
- Invalidate cache manually
- Navigate between admin sections

### 🔨 Coming Soon (Phase 2+)
- Edit AI instructions
- Modify form fields
- Upload template documents
- Test configurations
- View change history
- Rollback to previous versions

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/                      # Admin panel pages
│   │   ├── layout.tsx              # Admin layout wrapper
│   │   ├── page.tsx                # Dashboard (✅ Working)
│   │   ├── ai-instructions/page.tsx  # Placeholder
│   │   ├── form-fields/page.tsx    # Placeholder
│   │   ├── templates/page.tsx      # Placeholder
│   │   ├── testing/page.tsx        # Placeholder
│   │   └── history/page.tsx        # Placeholder
│   └── api/admin/                  # Admin API routes
│       ├── config/                 # Config CRUD endpoints
│       ├── cache/                  # Cache management
│       └── history/                # Change history
├── components/admin/
│   └── layout/                     # Layout components
│       ├── AdminLayout.tsx         # Main wrapper
│       ├── AdminHeader.tsx         # Top bar
│       └── AdminSidebar.tsx        # Side navigation
├── lib/
│   ├── admin-config-types.ts       # TypeScript types
│   ├── config-loader.ts            # Config loading service
│   └── aws-config.ts               # AWS configuration
└── docs/
    ├── DYNAMODB_TABLES.md          # Table schemas
    ├── ADMIN_PANEL_IMPLEMENTATION.md # Implementation status
    └── ADMIN_QUICK_START.md        # This file
```

---

## 🐛 Troubleshooting

### Issue: Seed script fails

**Error**: `AccessDeniedException` or `ResourceNotFoundException`

**Solution**:
1. Verify tables are created in AWS Console
2. Check AWS credentials are configured correctly
3. Verify table names match environment variables

### Issue: Admin dashboard shows "No active config"

**Error**: Configuration status cards show yellow "No Active Config" badges

**Solution**:
1. Run `npm run seed-admin` to populate tables
2. Check AWS Console to verify tables have data
3. Check browser console for API errors

### Issue: API returns 500 errors

**Error**: `{ success: false, error: "..." }`

**Solution**:
1. Check server console for detailed error messages
2. Verify AWS credentials are valid
3. Check table names in `.env.local`
4. Verify tables exist in correct region

### Issue: Cache not invalidating

**Error**: Old configs still loading after activation

**Solution**:
1. Manually clear cache via dashboard
2. Restart development server
3. Check if Lambda is reusing old instances (production only)

---

## 💡 Tips

### Viewing DynamoDB Data

Use AWS Console to inspect tables:
1. Go to DynamoDB Console
2. Click table name
3. Click "Explore table items"
4. View/edit items directly

### API Testing with curl

```bash
# Get active config
curl http://localhost:3000/api/admin/config/ai-instructions

# List versions
curl http://localhost:3000/api/admin/config/ai-instructions/versions

# Get specific version
curl 'http://localhost:3000/api/admin/config/ai-instructions?version=1709740800000'

# Create draft config
curl -X POST http://localhost:3000/api/admin/config \
  -H "Content-Type: application/json" \
  -d '{
    "configType": "ai-instructions",
    "configData": {...},
    "description": "Test configuration"
  }'

# Activate config
curl -X POST http://localhost:3000/api/admin/config/ai-instructions/activate \
  -H "Content-Type: application/json" \
  -d '{"version": 1709740800000}'
```

### Monitoring Costs

DynamoDB costs with Pay-Per-Request:
- **Reads**: $0.25 per million
- **Writes**: $1.25 per million
- **Storage**: $0.25 per GB-month

Expected cost: **~$0.26/month** for admin panel tables.

View costs in [AWS Cost Explorer](https://console.aws.amazon.com/cost-management).

---

## 🎉 Next Steps

Once everything is working:

1. **Explore the dashboard** - Familiarize yourself with the UI
2. **Read the implementation doc** - See what's planned: `docs/ADMIN_PANEL_IMPLEMENTATION.md`
3. **Wait for Phase 2** - AI Instructions Editor (next deliverable)
4. **Provide feedback** - Any UI/UX improvements needed?

---

## 📞 Need Help?

1. Check `docs/ADMIN_PANEL_IMPLEMENTATION.md` for detailed info
2. Check `docs/DYNAMODB_TABLES.md` for table schemas
3. Review server logs for errors
4. Check AWS CloudWatch logs (production)
5. Inspect DynamoDB tables in AWS Console

---

**Last Updated**: March 7, 2024
**Phase**: 1 (Foundation) Complete ✅
**Next Phase**: 2 (AI Instructions Editor)
