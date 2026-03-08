# Admin Seed Scripts - Quick Reference

Quick reference for admin database seeding operations.

## 🚀 Quick Start

### First-Time Setup
```bash
npm run setup-admin
```
This creates tables AND seeds comprehensive AI instructions in one command.

### Seed AI Instructions Only
```bash
npm run seed-admin
```
Use this to:
- Populate or refresh AI instructions
- Reset to default comprehensive instructions
- Overwrite simplified/incorrect instructions

## 📋 Available Commands

| Command | Script | Purpose | When to Use |
|---------|--------|---------|-------------|
| `npm run setup-admin` | `create-tables.js` + `seed-admin.ts` | Complete setup | First time, or full reset |
| `npm run seed-admin` | `seed-admin.ts` | Seed AI instructions | After table creation, or to reset instructions |
| `npm run seed-ai-instructions` | `seed-admin.ts` | Alias for seed-admin | Same as seed-admin |
| `npm run create-admin-tables` | `create-tables.js` | Create DynamoDB tables | Before seeding, or after deleting tables |

## ✅ What Gets Seeded

The seed script extracts from `src/lib/openai-utils.ts` and populates:

**5 Comprehensive Sections** (~18,500 total characters):
1. **Opening & Introduction** - 700 tokens, ~2,500 chars
   - Critical rules, IP language, KDP terminology
2. **Root Cause Analysis** - 800 tokens, ~3,800 chars
   - Scope boundaries, what to include/exclude
3. **Corrective Actions** - 800 tokens, ~4,500 chars
   - Past tense only, completed actions, document references
4. **Preventive Measures** - 1000 tokens, ~6,000 chars
   - Present/future tense, ongoing practices, violation-specific
5. **Closing & Signature** - 600 tokens, ~1,700 chars
   - Signature format, Merchant Token requirements

**Global Settings**:
- Model: `gpt-4o-mini`
- Temperature: `0.85`
- Frequency Penalty: `0.3`
- Presence Penalty: `0.2`

## 🔍 How to Verify

### Quick Check
```bash
npm run seed-admin
```

Look for:
```
✅ Saved AI Instructions configuration (v1)
   - Sections: 5
   - Status: active

Seeded Sections:
   1. Opening & Introduction
      - Prompt Length: 2500+ characters  ← Should be 2000+, not ~75
```

### Dashboard Check
1. Visit: http://localhost:3000/admin/ai-instructions
2. Expand any section
3. Switch to "User Prompt Template" tab
4. Verify comprehensive instructions (not "Write an introduction for...")

## 🏗️ Architecture

```
APPEAL_SECTIONS            seed-admin.ts         DynamoDB              Admin Dashboard
(openai-utils.ts)    →     extracts       →      stores        →      displays/edits
                                                                              ↓
                                                                    Appeal Generation
                                                                    (uses DB or fallback)
```

**Key Points**:
- `APPEAL_SECTIONS` = Source of truth
- Database = Customizable override
- System falls back to `APPEAL_SECTIONS` if DB unavailable

## ⚠️ Common Issues

### Issue: "Table not found"
```bash
npm run create-admin-tables  # Create tables first
npm run seed-admin            # Then seed
```

### Issue: Dashboard shows simplified instructions
```bash
npm run seed-admin  # Re-run to overwrite with comprehensive instructions
```

### Issue: npm command fails
Check `package.json` has:
```json
"seed-admin": "tsx scripts/seed-admin.ts"
```

## 📂 Files Reference

| File | Purpose |
|------|---------|
| `scripts/seed-admin.ts` | **Main seed script** - Extracts from openai-utils.ts |
| `src/lib/openai-utils.ts` | **Source of truth** - Contains APPEAL_SECTIONS |
| `scripts/README.md` | **Full documentation** - Complete guide |
| `docs/seed-script-fix-summary.md` | **Implementation details** - What was changed and why |
| `docs/verification-checklist.md` | **Testing guide** - Step-by-step verification |

## 🎯 When to Re-seed

Re-run `npm run seed-admin` when:
- ✅ Setting up a new environment
- ✅ After modifying `APPEAL_SECTIONS` in openai-utils.ts
- ✅ To reset admin customizations to defaults
- ✅ After database corruption or issues
- ✅ When admin dashboard shows wrong instructions

## 🚫 What NOT to Do

- ❌ Don't edit the database directly (use admin UI)
- ❌ Don't run multiple seed scripts (only use `seed-admin.ts`)
- ❌ Don't modify `seed-admin.ts` to add custom instructions (edit openai-utils.ts instead)
- ❌ Don't worry about re-running seed (it safely overwrites)

## 💡 Pro Tips

1. **Backup before re-seeding**: Export your customizations from admin UI first
2. **Test changes**: Use admin dashboard's Testing page before activating
3. **Version control**: The history table tracks all changes
4. **Fallback safety**: Appeals work even if database is down
5. **Check logs**: Console shows which config is being used during generation

## 🔗 Related Documentation

- Full guide: `scripts/README.md`
- Implementation details: `docs/seed-script-fix-summary.md`
- Verification steps: `docs/verification-checklist.md`
- Admin config types: `src/lib/admin-config-types.ts`
- Config loader logic: `src/lib/config-loader.ts`

## 📞 Need Help?

1. Check `scripts/README.md` for detailed troubleshooting
2. Verify file structure matches expected layout
3. Check console logs during seeding and appeal generation
4. Verify AWS credentials in `.env.local`
5. Ensure DynamoDB tables exist and are accessible

---

**Last Updated**: March 7, 2026
**Script Version**: seed-admin.ts (consolidated)
