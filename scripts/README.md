# Admin Seed Scripts

This directory contains scripts for setting up and seeding the admin panel database.

## Available Scripts

### `seed-admin.ts` - Primary Seed Script

**Command**: `npm run seed-admin` or `npm run seed-ai-instructions`

**Purpose**: Seeds the admin panel database with comprehensive AI instructions extracted from `openai-utils.ts`.

**What it does**:
- Extracts all 5 sections from `APPEAL_SECTIONS` in `src/lib/openai-utils.ts`
- Creates comprehensive default instructions (~18,500 characters total)
- Saves to `admin-configurations` DynamoDB table
- Creates a history record in `admin-configurations-history`
- Sets the configuration as active

**When to use**:
- Initial setup of the admin panel
- Resetting AI instructions to defaults
- After modifying `APPEAL_SECTIONS` in openai-utils.ts

**Expected output**:
```
✅ Saved AI Instructions configuration (v1) to admin-configurations
   - Sections: 5
   - Status: active

Seeded Sections:
   1. Opening & Introduction
      - Max Tokens: 700
      - Prompt Length: 2500+ characters
   2. Root Cause Analysis
      - Max Tokens: 800
      - Prompt Length: 3800+ characters
   3. Corrective Actions
      - Max Tokens: 800
      - Prompt Length: 4500+ characters
   4. Preventive Measures
      - Max Tokens: 1000
      - Prompt Length: 6000+ characters
   5. Closing & Signature
      - Max Tokens: 600
      - Prompt Length: 1700+ characters
```

### `create-tables.js` - Table Creation Script

**Command**: `npm run create-admin-tables`

**Purpose**: Creates the DynamoDB tables required for the admin panel.

**What it does**:
- Creates `admin-configurations` table
- Creates `admin-configurations-history` table
- Sets up proper indexes and keys

**When to use**:
- Initial setup (before seeding)
- After deleting tables during development

### `setup-admin` - Complete Setup

**Command**: `npm run setup-admin`

**Purpose**: Runs both table creation and seeding in sequence.

**What it does**:
1. Creates admin tables (`create-tables.js`)
2. Seeds AI instructions (`seed-admin.ts`)

**When to use**:
- First-time setup
- Complete reset of admin panel

## Verification

After running the seed script, verify it worked:

### 1. Check Console Output
Look for:
- ✅ "Saved AI Instructions configuration"
- "Sections: 5"
- Each section showing 2000+ character prompt length

### 2. Check Admin Dashboard
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000/admin/ai-instructions
3. Expand "Section 1: Opening & Introduction"
4. Switch to "User Prompt Template" tab
5. Verify comprehensive instructions (not generic placeholders)
6. Should contain:
   - "CRITICAL RULES:"
   - "INTELLECTUAL PROPERTY LANGUAGE:"
   - "KDP/PUBLISHING TERMINOLOGY:"

### 3. Test Appeal Generation
1. Generate a test appeal
2. Check console for "Using appeal sections from active configuration"
3. Verify generated appeal follows comprehensive instructions

## Architecture

### Source of Truth
`src/lib/openai-utils.ts` contains `APPEAL_SECTIONS` - the definitive source for default AI instructions.

### Database as Override
The admin panel stores customized instructions in DynamoDB. Admins can modify these via the UI.

### Graceful Fallback
If database config is missing, `getAppealSections()` in openai-utils.ts automatically falls back to the hardcoded `APPEAL_SECTIONS`.

### Flow
```
1. seed-admin.ts extracts from APPEAL_SECTIONS
2. Saves to admin-configurations table
3. Admin dashboard loads from database
4. Admins can customize via UI
5. Appeal generation uses database config
6. Falls back to APPEAL_SECTIONS if DB unavailable
```

## Troubleshooting

### "Table not found" error
Run: `npm run create-admin-tables` first

### Admin dashboard shows simplified instructions
You may have run an old seed script. Run: `npm run seed-admin` to overwrite with comprehensive instructions.

### Appeal generation not using custom instructions
Check:
1. Is there an active config in the database? (status='active')
2. Check console logs for "Using appeal sections from..."
3. Verify the admin dashboard shows your customizations

### Database connection issues
1. Check `.env.local` has correct AWS credentials
2. Verify DynamoDB tables exist in your AWS account
3. Check IAM permissions for DynamoDB access

## Historical Note

Previous versions had multiple seed scripts (`seed-admin.js`, `seed-admin-config.ts`, `seed-admin-data.ts`) that contained hardcoded simplified instructions. These have been removed in favor of the single `seed-admin.ts` script that properly extracts from `openai-utils.ts`.

If you see references to these old scripts in documentation or other files, they should be updated to use `seed-admin.ts` instead.
