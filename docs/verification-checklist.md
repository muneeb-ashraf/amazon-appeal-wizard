# AI Instructions Seed Script Fix - Verification Checklist

This checklist helps verify that the seed script fix is working correctly.

## ✅ Completed Steps

### Phase 1: Immediate Fix
- [x] Ran correct seed script: `npm run seed-ai-instructions`
- [x] Database seeded with comprehensive instructions

### Phase 2: Long-term Consolidation
- [x] Renamed `seed-ai-instructions-from-code.ts` → `seed-admin.ts`
- [x] Enhanced documentation in script header
- [x] Deleted wrong scripts: `seed-admin.js`, `seed-admin-config.ts`, `seed-admin-data.ts`
- [x] Updated package.json script commands
- [x] Created `scripts/README.md` documentation
- [x] Created implementation summary documents
- [x] Verified seed script runs without errors

## 🔍 User Verification Steps

### Step 1: Verify Seed Script Works

Run the seed script and check output:

```bash
npm run seed-admin
```

**Expected output should include**:
```
🚀 Seeding AI Instructions from openai-utils.ts defaults...
📝 Extracting 5 sections from openai-utils.ts...
✅ Saved AI Instructions configuration (v1) to admin-configurations
   - Sections: 5
   - Status: active
✅ Saved history record to admin-configurations-history

Seeded Configuration Details:
   Model: gpt-4o-mini
   Temperature: 0.85

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

**Check**:
- [ ] Script completes without errors
- [ ] Shows "Sections: 5"
- [ ] Each section shows prompt length 2000+ characters (not ~75)
- [ ] Total across all sections is ~18,500 characters

### Step 2: Verify Admin Dashboard

Start the development server:

```bash
npm run dev
```

Navigate to: http://localhost:3000/admin/ai-instructions

**For EACH section (1-5), check**:

#### Section 1: Opening & Introduction
- [ ] Click to expand the section
- [ ] Switch to "User Prompt Template" tab
- [ ] Verify the prompt is NOT: "Write an introduction for {appealType}..."
- [ ] Verify the prompt CONTAINS:
  - "CRITICAL RULES:"
  - "INTELLECTUAL PROPERTY LANGUAGE:"
  - "KDP/PUBLISHING TERMINOLOGY:"
  - Multiple paragraphs of detailed instructions
- [ ] Prompt length should be ~2,500 characters
- [ ] System prompt should mention "Opening & Introduction section"

#### Section 2: Root Cause Analysis
- [ ] Click to expand the section
- [ ] Switch to "User Prompt Template" tab
- [ ] Verify the prompt is NOT: "Analyze the root cause for {appealType}..."
- [ ] Verify the prompt CONTAINS:
  - "WHAT TO INCLUDE IN ROOT CAUSE:"
  - "WHAT NOT TO INCLUDE:"
  - "INTELLECTUAL PROPERTY LANGUAGE:"
  - Detailed scope boundaries
- [ ] Prompt length should be ~3,800 characters

#### Section 3: Corrective Actions
- [ ] Click to expand the section
- [ ] Switch to "User Prompt Template" tab
- [ ] Verify the prompt is NOT: "Describe corrective actions for {appealType}..."
- [ ] Verify the prompt CONTAINS:
  - "CRITICAL: This section is for COMPLETED ACTIONS ONLY"
  - "TENSE REQUIREMENTS:"
  - "DOCUMENT REFERENCES:"
  - Past tense guidelines
- [ ] Prompt length should be ~4,500 characters

#### Section 4: Preventive Measures
- [ ] Click to expand the section
- [ ] Switch to "User Prompt Template" tab
- [ ] Verify the prompt is NOT: "List preventive measures for {appealType}..."
- [ ] Verify the prompt CONTAINS:
  - "CRITICAL DISTINCTION FROM SECTION 3:"
  - "TENSE REQUIREMENTS:"
  - "VIOLATION-SPECIFIC CATEGORIES:"
  - Examples and detailed guidelines
- [ ] Prompt length should be ~6,000 characters

#### Section 5: Closing & Signature
- [ ] Click to expand the section
- [ ] Switch to "User Prompt Template" tab
- [ ] Verify the prompt is NOT: "Write a closing for {appealType}..."
- [ ] Verify the prompt CONTAINS:
  - "SIGNATURE FORMAT REQUIREMENTS:"
  - "MERCHANT TOKEN ID IS MANDATORY"
  - Specific formatting rules
- [ ] Prompt length should be ~1,700 characters

**Summary check**:
- [ ] All 5 sections show comprehensive instructions
- [ ] Total character count across all sections is ~18,500 chars
- [ ] No section shows generic placeholder text
- [ ] Global settings show model: gpt-4o-mini, temperature: 0.85

### Step 3: Test Appeal Generation

Generate a test appeal to verify the instructions are being used:

1. **Start the app**: Ensure dev server is running
2. **Navigate to appeal form**: http://localhost:3000
3. **Fill in test data**:
   - Name: Test Seller
   - Store Name: Test Store
   - Appeal Type: Select any (e.g., "Account Suspension")
   - Fill other required fields
4. **Generate appeal**

**Check console logs**:
- [ ] Look for: "Using appeal sections from active configuration"
- [ ] Should show: "Found 5 sections in active config"
- [ ] Should NOT show: "No active config found, using defaults"

**Check generated appeal quality**:
- [ ] Opening uses proper terminology (not generic)
- [ ] Root cause analysis is detailed and specific
- [ ] Corrective actions are in past tense
- [ ] Preventive measures are in present/future tense
- [ ] Signature includes all required fields
- [ ] Appeal follows comprehensive instruction guidelines

### Step 4: Verify Package Commands

Test all related npm commands work:

```bash
# Test seed-admin command
npm run seed-admin
```
- [ ] Runs `tsx scripts/seed-admin.ts`
- [ ] Completes successfully

```bash
# Test seed-ai-instructions alias
npm run seed-ai-instructions
```
- [ ] Runs `tsx scripts/seed-admin.ts`
- [ ] Completes successfully

```bash
# Test setup-admin command
npm run setup-admin
```
- [ ] Creates tables (if not exists)
- [ ] Seeds admin data
- [ ] Completes successfully

### Step 5: Verify File Structure

Check that the correct files exist and wrong ones are deleted:

**Should exist**:
- [ ] `scripts/seed-admin.ts` (the correct, consolidated script)
- [ ] `scripts/README.md` (new documentation)
- [ ] `docs/seed-script-fix-summary.md` (implementation summary)
- [ ] `docs/verification-checklist.md` (this file)

**Should NOT exist**:
- [ ] `scripts/seed-admin.js` (deleted - had wrong instructions)
- [ ] `scripts/seed-admin-config.ts` (deleted - duplicate wrong script)
- [ ] `scripts/seed-admin-data.ts` (deleted - broken script)
- [ ] `scripts/seed-ai-instructions-from-code.ts` (renamed to seed-admin.ts)

### Step 6: Test Fallback Mechanism (Optional Advanced Test)

This test verifies the system still works if the database is unavailable:

1. **Temporarily disable database config**:
   - Option A: Rename the config in DynamoDB (change configId)
   - Option B: Comment out the database call in config-loader.ts

2. **Generate an appeal**

3. **Check console logs**:
   - [ ] Should see: "No active config found, using defaults from openai-utils.ts"
   - [ ] Appeal should still generate correctly
   - [ ] Appeal should use hardcoded APPEAL_SECTIONS

4. **Restore configuration**:
   - Undo the changes from step 1
   - Verify normal operation resumes

## 🎯 Success Criteria

All checks pass if:

1. ✅ Seed script runs without errors
2. ✅ Admin dashboard shows comprehensive instructions (not placeholders)
3. ✅ Each section has 2000+ character prompts
4. ✅ Generated appeals follow comprehensive instruction guidelines
5. ✅ All npm commands work correctly
6. ✅ File structure is correct (old scripts deleted)
7. ✅ Fallback mechanism works (optional test)

## ❌ Failure Indicators

If you see any of these, the fix may not be working:

- ❌ Admin dashboard shows: "Write an introduction for {appealType}..."
- ❌ Section prompts are ~75 characters instead of 2000+
- ❌ Seed script shows error about missing imports
- ❌ Console shows: "No active config found" during normal operation
- ❌ Generated appeals lack detail or structure
- ❌ npm commands fail or point to deleted scripts

## 🔧 Troubleshooting

### Issue: Seed script fails with "Table not found"
**Solution**: Run `npm run create-admin-tables` first

### Issue: Admin dashboard still shows simplified instructions
**Solution**:
1. Run `npm run seed-admin` to overwrite
2. Hard refresh browser (Ctrl+Shift+R)
3. Check database to verify config was saved

### Issue: npm command not found
**Solution**:
1. Check package.json has updated script definitions
2. Try `npm install` to refresh package.json cache

### Issue: Generated appeals don't use custom instructions
**Solution**:
1. Verify active config exists in database
2. Check console logs during generation
3. Verify `getAppealSections()` is loading from DB

### Issue: Import errors in seed script
**Solution**:
1. Verify all old scripts are deleted
2. Check `seed-admin.ts` imports from correct paths
3. Run `npm install` if dependencies are missing

## 📝 Notes

- The seed script can be run multiple times safely (it overwrites existing config)
- Customizations made via admin UI will be lost when re-seeding
- The history table keeps a record of all configuration changes
- Fallback to hardcoded APPEAL_SECTIONS ensures system resilience

## ✅ Final Sign-off

Once all checks pass:

- [ ] Seed script works correctly
- [ ] Admin dashboard shows comprehensive instructions
- [ ] Appeal generation uses comprehensive instructions
- [ ] All npm commands work
- [ ] File structure is correct
- [ ] Documentation is complete

**Status**: Ready for production use ✅

---

**Implementation Date**: March 7, 2026
**Verified By**: ________________
**Date Verified**: ________________
