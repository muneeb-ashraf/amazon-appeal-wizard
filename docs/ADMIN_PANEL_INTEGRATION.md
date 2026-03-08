# Admin Panel Integration - Complete

This document describes the newly integrated admin panel features for managing appeals and viewing statistics.

## Overview

The admin panel has been enhanced with authentication, appeals management, and statistics dashboard capabilities. All user-generated appeals are now automatically saved to DynamoDB and can be viewed, searched, filtered, and exported through the admin interface.

## Features Implemented

### 1. Authentication System

**Login Page**: `/admin/login`
- Password-based authentication using environment variable
- JWT session tokens stored in HTTP-only cookies
- 24-hour session duration
- Automatic redirect to login for unauthenticated users

**Security Features**:
- HTTP-only cookies to prevent XSS attacks
- JWT tokens with expiration
- Middleware protection for all `/admin/*` routes
- Logout functionality with session clearing

### 2. Dashboard Page

**Route**: `/admin/dashboard`

**Features**:
- Real-time statistics from DynamoDB
- Total appeals count
- Completed, failed, and pending appeals
- Success rate percentage
- Average generation time
- Recent appeals list (last 10)

**Statistics Cards**:
- Color-coded status indicators
- Visual metrics with icons
- Responsive grid layout

### 3. Appeals Management Page

**Route**: `/admin/appeals`

**Features**:
- Full appeals table with pagination (20 per page)
- Search by name, email, or store name
- Filter by status (all, completed, failed, pending)
- Sort by date, name, or status
- View full appeal details in modal
- Delete appeals with confirmation
- Export to CSV or JSON

**Table Columns**:
- Name
- Email
- Store Name
- Appeal Type
- Status
- Created Date
- Actions (View, Delete)

**Appeal Detail Modal**:
- Seller information
- Appeal metadata
- Full generated appeal text
- Copy to clipboard functionality
- Root causes, corrective actions, preventive measures

### 4. Navigation Updates

**Admin Sidebar**:
- Dashboard (home)
- Appeals (list/manage)
- AI Instructions
- Form Fields
- Templates
- Testing
- History

**Default Route**: `/admin` redirects to `/admin/dashboard`

## Database Schema

### Table: `admin-appeals`

**Primary Key**: `appealId` (String UUID)

**Attributes**:
```typescript
{
  appealId: string;
  createdAt: string;        // ISO timestamp
  updatedAt: string;        // ISO timestamp
  status: 'completed' | 'failed' | 'pending';
  formData: {
    fullName: string;
    storeName: string;
    email: string;
    sellerId: string;
    appealType: string;
    rootCauses: string[];
    correctiveActionsTaken: string[];
    preventiveMeasures: string[];
    asins: string[];
    // ... additional fields
  };
  generatedAppeal: string;  // Full appeal text
  generationMetadata: {
    sectionsGenerated: string[];
    totalTokens?: number;
    generationTimeMs?: number;
    aiInstructionsVersion?: number;
    formFieldsVersion?: number;
  };
  uploadedDocuments?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    type: string;
    s3Key?: string;
  }>;
}
```

**Global Secondary Index**: `status-createdAt-index`
- Partition Key: `status`
- Sort Key: `createdAt`
- Enables efficient filtering by status

## API Endpoints

### Authentication

**POST** `/api/admin/auth/login`
- Authenticate with password
- Returns JWT token in HTTP-only cookie

**POST** `/api/admin/auth/logout`
- Clear session cookie

**GET** `/api/admin/auth/session`
- Check if authenticated

### Appeals

**GET** `/api/admin/appeals`
- List appeals with pagination and filtering
- Query params: `status`, `search`, `sortBy`, `sortOrder`, `limit`, `offset`

**GET** `/api/admin/appeals/[appealId]`
- Get single appeal details

**DELETE** `/api/admin/appeals/[appealId]`
- Delete an appeal

**GET** `/api/admin/appeals/stats`
- Get dashboard statistics

**POST** `/api/admin/appeals/export`
- Export appeals as CSV or JSON
- Body: `{ format: 'csv' | 'json', status?: string }`

## Environment Variables

Required in `.env.local`:

```env
# Admin Authentication
NEXT_PUBLIC_ADMIN_PASSWORD=YourSecurePassword123!
JWT_SECRET=your-secret-jwt-key-change-in-production-min-32-chars-long

# DynamoDB Table
NEXT_PUBLIC_DYNAMODB_ADMIN_APPEALS_TABLE=admin-appeals
```

## Setup Instructions

### 1. Create DynamoDB Table

```bash
npx tsx scripts/create-appeals-table.ts
```

This creates the `admin-appeals` table with the required schema and GSI.

### 2. Install Dependencies

```bash
npm install jose date-fns
```

### 3. Update Environment Variables

Ensure `.env.local` has:
- `NEXT_PUBLIC_ADMIN_PASSWORD`
- `JWT_SECRET`
- `NEXT_PUBLIC_DYNAMODB_ADMIN_APPEALS_TABLE`

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access Admin Panel

1. Navigate to `http://localhost:3000/admin`
2. You'll be redirected to `/admin/login`
3. Enter the admin password from `.env.local`
4. You'll be redirected to `/admin/dashboard`

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx                 # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx                 # Dashboard page
│   │   ├── appeals/
│   │   │   └── page.tsx                 # Appeals management page
│   │   └── page.tsx                     # Redirect to dashboard
│   └── api/
│       └── admin/
│           ├── auth/
│           │   ├── login/route.ts
│           │   ├── logout/route.ts
│           │   └── session/route.ts
│           └── appeals/
│               ├── route.ts             # List appeals
│               ├── [appealId]/route.ts  # Single appeal
│               ├── stats/route.ts       # Statistics
│               └── export/route.ts      # Export
├── components/
│   └── admin/
│       ├── dashboard/
│       │   ├── DashboardStats.tsx
│       │   └── RecentAppeals.tsx
│       ├── appeals/
│       │   ├── AppealsTable.tsx
│       │   ├── AppealFilters.tsx
│       │   └── AppealDetailModal.tsx
│       └── layout/
│           ├── AdminHeader.tsx          # Updated with logout
│           └── AdminSidebar.tsx         # Updated with new links
├── middleware.ts                         # Auth middleware
└── types/
    └── index.ts                         # Updated with admin types
```

## Updated Save Appeal Flow

When users generate appeals, the flow is:

1. User submits multi-step form
2. Appeal sections generated via OpenAI API
3. Sections combined on client
4. `POST /api/save-appeal` called with:
   ```typescript
   {
     formData: AppealFormData,
     appealText: string,
     metadata: {
       sectionsGenerated: string[],
       totalTokens?: number,
       generationTimeMs?: number
     }
   }
   ```
5. Appeal saved to `admin-appeals` table
6. Appeal immediately visible in admin panel

## Security Considerations

### Production Recommendations

1. **Change JWT Secret**: Use a strong, random 32+ character secret
2. **Use HTTPS**: Enable secure cookies in production
3. **Rotate Admin Password**: Change from default value
4. **Add Rate Limiting**: Prevent brute force login attempts
5. **Add Audit Logging**: Track admin actions
6. **Consider Multi-Factor Auth**: For enhanced security

### Current Implementation

- Simple password authentication (good for single admin)
- JWT tokens with 24-hour expiration
- HTTP-only cookies (prevents XSS)
- Middleware protection on all admin routes
- Secure cookie flag in production

## Usage Examples

### Viewing Recent Appeals

1. Go to `/admin/dashboard`
2. Scroll to "Recent Appeals" section
3. Click "View" on any appeal to see details

### Searching Appeals

1. Go to `/admin/appeals`
2. Use search box to find by name, email, or store
3. Select status filter (all, completed, failed, pending)
4. Sort by date, name, or status

### Exporting Appeals

1. Go to `/admin/appeals`
2. Apply desired filters
3. Click "CSV" or "JSON" export button
4. File downloads automatically

### Deleting Appeals

1. Find appeal in `/admin/appeals` table
2. Click delete icon (trash)
3. Confirm deletion in popup
4. Appeal removed from database

## Troubleshooting

### Login Issues

**Problem**: "Invalid password" error
**Solution**: Check `NEXT_PUBLIC_ADMIN_PASSWORD` in `.env.local`

**Problem**: Redirected to login after successful login
**Solution**: Check `JWT_SECRET` is set, clear browser cookies

### Appeals Not Showing

**Problem**: Dashboard shows 0 appeals
**Solution**:
1. Verify table exists: `aws dynamodb describe-table --table-name admin-appeals`
2. Check table name in `.env.local`
3. Generate a test appeal from main form

### Export Not Working

**Problem**: Export button does nothing
**Solution**: Check browser console for errors, verify API route is accessible

## Future Enhancements

Potential improvements for future versions:

1. **Multi-User Support**: Add user management with roles
2. **Advanced Analytics**: Charts, trends, insights
3. **Bulk Operations**: Delete/export multiple appeals
4. **Appeal Editing**: Modify generated appeals
5. **Email Notifications**: Alert on failed appeals
6. **Appeal Templates**: Save frequently used appeals
7. **API Key Management**: For programmatic access
8. **Webhook Integration**: Send appeals to external systems

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses in Network tab
3. Check server logs for errors
4. Verify DynamoDB table structure matches schema
