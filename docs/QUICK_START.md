# Admin Panel - Quick Start Guide

## 🚀 Get Started in 3 Minutes

This guide will help you set up and test the new admin panel integration.

## Prerequisites

- Node.js installed
- AWS credentials configured in `.env.local`
- DynamoDB access

## Step 1: Create the Appeals Table (1 minute)

```bash
npx tsx scripts/create-appeals-table.ts
```

**Expected Output:**
```
🚀 Creating Appeals DynamoDB Table...
================================================

📍 Region: eu-north-1

📝 Creating table: admin-appeals...
✅ Table admin-appeals created successfully!
   - Partition Key: appealId (String UUID)
   - GSI: status-createdAt-index
   - Billing: Pay-per-request

================================================
✅ Appeals table created successfully!
```

## Step 2: Verify Environment Variables (30 seconds)

Check `.env.local` has these values:

```env
# Admin Authentication
NEXT_PUBLIC_ADMIN_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-secret-jwt-key-change-in-production-min-32-chars-long

# DynamoDB Table
NEXT_PUBLIC_DYNAMODB_ADMIN_APPEALS_TABLE=admin-appeals
```

## Step 3: Start the Development Server (30 seconds)

```bash
npm run dev
```

## Step 4: Test the Admin Panel (1 minute)

### Test Authentication

1. **Go to**: `http://localhost:3000/admin`
2. **You should be**: Redirected to `/admin/login`
3. **Enter password**: The value from `NEXT_PUBLIC_ADMIN_PASSWORD`
4. **Click**: "Sign In"
5. **You should be**: Redirected to `/admin/dashboard`

### Test Dashboard

1. **Check**: Statistics cards show "0" for all metrics (no appeals yet)
2. **Check**: "No Appeals Yet" message in Recent Appeals section

### Test Creating an Appeal

1. **Open new tab**: `http://localhost:3000/`
2. **Fill out the form**: Create a test appeal
   - Name: "Test User"
   - Email: "test@example.com"
   - Store: "Test Store"
   - Seller ID: "A1234567890ABC"
   - Appeal Type: Choose any
   - Complete all steps
3. **Generate appeal**: Wait for completion
4. **Go back to admin**: `http://localhost:3000/admin/dashboard`
5. **Refresh page**: You should see 1 appeal in statistics

### Test Appeals Management

1. **Click**: "Appeals" in sidebar
2. **You should see**: Your test appeal in the table
3. **Click**: "View" button
4. **Check**: Modal shows full appeal details
5. **Click**: "Copy" to copy appeal text
6. **Close modal**

### Test Search and Filter

1. **In search box**: Type "Test"
2. **Check**: Appeal is filtered
3. **Clear search**
4. **Status filter**: Select "Completed"
5. **Check**: Appeal shows (if status is completed)

### Test Export

1. **Click**: "CSV" button
2. **Check**: CSV file downloads
3. **Click**: "JSON" button
4. **Check**: JSON file downloads

### Test Delete

1. **Click**: Trash icon for the appeal
2. **Confirm**: Delete confirmation
3. **Check**: Appeal removed from table
4. **Go to dashboard**: Statistics updated

### Test Logout

1. **Click**: Logout button (top right)
2. **Check**: Redirected to login page
3. **Try to access**: `/admin/dashboard` directly
4. **Check**: Redirected back to login

## ✅ Verification Checklist

After testing, you should have verified:

- [x] Login page loads and works
- [x] Wrong password is rejected
- [x] Dashboard shows statistics
- [x] Appeals appear after generation
- [x] Search/filter/sort works
- [x] View appeal modal works
- [x] Export CSV/JSON works
- [x] Delete appeal works
- [x] Logout works and session clears
- [x] Routes are protected by authentication

## 🎯 What You Should See

### Dashboard Page
![Dashboard should show: stat cards, recent appeals list]

**Statistics Cards:**
- Total Appeals: [number]
- Completed: [number]
- Failed: [number]
- Pending: [number]
- Success Rate: [percentage]
- Avg Generation Time: [seconds]

### Appeals Page
![Appeals page should show: search bar, filters, table with appeals]

**Table Columns:**
- Name
- Email
- Store
- Appeal Type
- Status
- Created
- Actions

### Appeal Detail Modal
![Modal should show: seller info, appeal metadata, full appeal text]

**Sections:**
- Seller Information (left)
- Appeal Information (left)
- Generated Appeal (right)
- Copy button

## 🐛 Troubleshooting

### "Invalid password" on login

**Cause**: Password doesn't match environment variable

**Fix**:
```bash
# Check your password
cat .env.local | grep ADMIN_PASSWORD

# Make sure it matches what you're typing
```

### Dashboard shows 0 appeals but you generated one

**Cause 1**: Table not created or wrong name

**Fix**:
```bash
# Verify table exists
aws dynamodb describe-table --table-name admin-appeals

# If not, create it
npx tsx scripts/create-appeals-table.ts
```

**Cause 2**: Appeal not saved to correct table

**Fix**:
```bash
# Check .env.local has correct table name
cat .env.local | grep ADMIN_APPEALS_TABLE
```

### Can access /admin/dashboard without logging in

**Cause**: Middleware not running or JWT_SECRET not set

**Fix**:
```bash
# Ensure JWT_SECRET is in .env.local
echo "JWT_SECRET=your-secret-key-here" >> .env.local

# Restart server
# Ctrl+C then npm run dev
```

### Export buttons don't work

**Cause**: Browser blocking download or API error

**Fix**:
1. Open browser console (F12)
2. Click export button
3. Check for errors in console
4. Check Network tab for failed requests

## 📊 Sample Test Data

If you want to test with multiple appeals, use these sample data points:

**Appeal 1:**
- Name: John Smith
- Email: john@example.com
- Store: Smith's Electronics
- Type: Inauthenticity Supply Chain

**Appeal 2:**
- Name: Jane Doe
- Email: jane@example.com
- Store: Doe's Books
- Type: Intellectual Property

**Appeal 3:**
- Name: Bob Johnson
- Email: bob@example.com
- Store: Johnson's Toys
- Type: Seller Code Conduct

This will help test:
- Search functionality
- Filtering by type
- Sorting by name
- Pagination (if you add 20+)

## 🎉 Success!

If all tests pass, your admin panel is fully integrated and working correctly!

## Next Steps

1. **Change default password**: Update `NEXT_PUBLIC_ADMIN_PASSWORD` in production
2. **Change JWT secret**: Use a strong random key in production
3. **Enable HTTPS**: For secure cookies in production
4. **Monitor usage**: Track appeal generation and admin access
5. **Backup data**: Regularly backup DynamoDB table

## Need Help?

- Check `docs/ADMIN_PANEL_INTEGRATION.md` for detailed documentation
- Check `docs/ADMIN_INTEGRATION_SUMMARY.md` for implementation summary
- Review API endpoints in `src/app/api/admin/` directories
- Check browser console for client-side errors
- Check server logs for API errors
