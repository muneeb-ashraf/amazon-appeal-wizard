# AI Instructions Setup Guide

## Overview

The AI Instructions admin panel allows you to customize the prompts that guide the AI when generating appeal letters. By default, the system uses comprehensive, battle-tested instructions that are hardcoded in `openai-utils.ts`. You can now load these as defaults and customize them.

## Default Instructions Source

The default instructions come from `src/lib/openai-utils.ts` in the `APPEAL_SECTIONS` array. These include:

### Section 1: Opening & Introduction (700 tokens)
- Professional greeting with correct addressee
- Introduction and issue statement
- Critical rules for IP language and KDP terminology
- ~200 lines of detailed guidance

### Section 2: Root Cause Analysis (800 tokens)
- Detailed diagnosis of what went wrong
- Investigation process and findings
- Clear scope boundaries (diagnosis only, not solutions)
- ~150 lines of detailed guidance

### Section 3: Corrective Actions (800 tokens)
- Completed, past-tense actions already taken
- Document references and specific details
- Distinction from ongoing preventive measures
- ~140 lines of detailed guidance

### Section 4: Preventive Measures (1000 tokens)
- Ongoing and future practices
- Violation-specific categories (not generic)
- Present/future tense descriptions
- ~170 lines of detailed guidance

### Section 5: Closing & Signature (600 tokens)
- Professional closing statement
- Signature block formatting requirements
- Mandatory elements (name, company, seller ID, email)
- ~50 lines of detailed guidance

## How to Load Default Instructions

### Step 1: Create Admin Tables (if not done)

```bash
npm run create-admin-tables
```

### Step 2: Seed AI Instructions

Run this command to load the hardcoded instructions into the database:

```bash
npm run seed-ai-instructions
```

**What this does:**
1. Reads the `APPEAL_SECTIONS` array from `openai-utils.ts`
2. Converts each section to the admin panel format
3. Saves to the `admin-configurations` DynamoDB table
4. Creates a history record
5. Marks the configuration as `active`

**Expected output:**
```
🚀 Seeding AI Instructions from openai-utils.ts defaults...
================================================

📝 Extracting 5 sections from openai-utils.ts...
✅ Saved AI Instructions configuration (v1) to admin-configurations
   - Sections: 5
   - Status: active
✅ Saved history record to admin-configuration-history

================================================
✅ AI Instructions seeded successfully!

Seeded Configuration Details:
   Model: gpt-4o-mini
   Temperature: 0.85

Seeded Sections:
   1. Opening & Introduction
      - Max Tokens: 700
      - Prompt Length: 5,234 characters
   2. Root Cause Analysis
      - Max Tokens: 800
      - Prompt Length: 4,987 characters
   ...
```

### Step 3: Access Admin Panel

1. Go to `http://localhost:3000/admin`
2. Login with admin password
3. Click "AI Instructions" in the sidebar
4. You'll see all 5 sections fully populated with defaults

## How to Customize

### In the Admin Panel

1. **Navigate** to `/admin/ai-instructions`
2. **Click** on any section to edit it
3. **Modify** the prompts, max tokens, or settings
4. **Save** as a draft (version 2, status: draft)
5. **Test** using the Testing page
6. **Activate** when satisfied

### Key Customization Points

**System Prompt**: The high-level instruction for the AI (usually keep this generic)

**User Prompt Template**: The detailed section-specific instructions (this is where you customize)

**Max Tokens**: How long the section can be (adjust based on needs)

**Temperature**: Creativity level (0.7 = balanced, 0.9 = creative, 0.5 = focused)

### Example Customizations

**Add Company-Specific Policies:**
```
Preventive Measures Section:
Add: "All sellers must complete monthly training via our LMS system..."
```

**Adjust Tone:**
```
Change temperature from 0.85 to 0.7 for more formal tone
```

**Emphasize Certain Document Types:**
```
Corrective Actions Section:
Add: "CRITICAL: Always reference LOA documents with specific dates and supplier names..."
```

**Add Industry-Specific Rules:**
```
Opening Section:
Add: "For supplement sellers, always mention FDA compliance..."
```

## How the System Uses These Instructions

### Current Behavior (Automatic Fallback)

The system already has this logic in `openai-utils.ts`:

```typescript
async function getAppealSections() {
  try {
    // Try to load from database first
    const config = await loadActiveConfig<AIInstructionsConfig>('ai-instructions');

    if (config?.configData?.sections) {
      console.log('✅ Using appeal sections from active configuration');
      return config.configData.sections;
    }
  } catch (error) {
    console.warn('⚠️  Failed to load, using fallback:', error);
  }

  // Fall back to hardcoded sections
  console.log('ℹ️  Using hardcoded fallback appeal sections');
  return APPEAL_SECTIONS;
}
```

This means:
1. **Database exists with active config** → Uses admin panel customizations
2. **Database exists but no active config** → Uses hardcoded fallback
3. **Database error or not found** → Uses hardcoded fallback

### After Seeding

Once you run `npm run seed-ai-instructions`:
- The database will have the defaults loaded
- The admin panel will show editable versions
- You can customize and test
- The system will use your active configuration
- Fallback still exists if database issues occur

## Workflow for Managing Instructions

### Initial Setup
```bash
# 1. Create tables
npm run create-admin-tables

# 2. Seed default instructions
npm run seed-ai-instructions

# 3. Access admin panel
# http://localhost:3000/admin/ai-instructions
```

### Making Changes
1. **Edit** instructions in admin panel
2. **Save as Draft** (creates version 2 with status: draft)
3. **Test** using Testing page with draft version
4. **Activate** draft to make it live (changes status to active)
5. **Rollback** if needed using version history

### Version Control
- Each save creates a new version
- Only one version can be `active` at a time
- History page shows all versions
- Can rollback to any previous version
- Can duplicate and modify versions

## Important Notes

### Hardcoded Fallback Always Available
Even after customizing, the original hardcoded instructions in `openai-utils.ts` remain as a failsafe. This ensures the system always works even if:
- Database connection fails
- Active configuration is deleted
- Configuration becomes corrupted

### Testing Before Activation
**ALWAYS** use the Testing page before activating changes:
1. Generate test appeal with draft configuration
2. Compare with current active configuration
3. Verify all sections generate correctly
4. Check for any errors or formatting issues
5. Only activate when satisfied

### Backup Recommendations
**Before major changes:**
1. Use "Duplicate" feature to backup current active config
2. Make changes to the duplicate
3. Test the duplicate thoroughly
4. Activate when ready
5. Keep the backup for rollback if needed

## Troubleshooting

### "No configuration found"
**Problem**: Admin panel shows empty sections

**Solution**:
```bash
npm run seed-ai-instructions
```

### Changes not taking effect
**Problem**: Modified instructions but appeals still use old version

**Causes**:
1. Draft not activated (status still "draft", not "active")
2. Multiple active versions (only newest should be active)
3. Cache issue (restart server)

**Solutions**:
1. Click "Activate" button on the draft
2. Deactivate old versions
3. Restart: `npm run dev`

### Seed script fails
**Problem**: Error running `npm run seed-ai-instructions`

**Common errors**:
- `ResourceNotFoundException`: Run `npm run create-admin-tables` first
- `ValidationException`: Check AWS credentials in `.env.local`
- `Timeout`: Check AWS region and network connection

## Advanced: Manual Updates

If you need to update the seed data after modifying `openai-utils.ts`:

1. **Edit** `src/lib/openai-utils.ts` → Update `APPEAL_SECTIONS` array
2. **Re-seed**: Run `npm run seed-ai-instructions` again
3. **Note**: This creates a new version, doesn't overwrite existing
4. **Activate**: Go to admin panel and activate the new version

## Summary

✅ **Default instructions** from `openai-utils.ts` are comprehensive and battle-tested
✅ **Seed script** loads them into database for admin customization
✅ **Admin panel** provides UI for editing and version control
✅ **Fallback** ensures system always works even if database fails
✅ **Testing** allows safe experimentation before going live

The system gives you the best of both worlds: reliable defaults that work out of the box, with full customization when you need it.
