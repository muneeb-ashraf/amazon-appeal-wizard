# Quick Fix: Running TypeScript Scripts on Windows

## Problem
Scripts run but produce no output when using Git Bash on Windows.

## Quick Solutions

### Method 1: Use Windows Command Prompt (Easiest)
Open Windows Command Prompt (cmd.exe) and run:
```cmd
npm run seed-form-fields
```

### Method 2: From Git Bash
```bash
cmd.exe //c "npm run seed-form-fields"
```

### Method 3: Use the Windows Helper Script
```cmd
scripts\run-seed-windows.cmd
```

### Method 4: Direct Execution
```bash
cmd.exe //c "node_modules\.bin\tsx.cmd scripts\seed-form-fields.ts"
```

## Verification
After running, verify the data was seeded:
```bash
node scripts/verify-seeded-data.js
```

## What Was Fixed
The script now successfully seeds:
- ✅ 22 Appeal Types with categories
- ✅ 45 Root Causes mapped to appeal types
- ✅ 38 Corrective Actions
- ✅ 66 Preventive Measures (including KDP subcategories)
- ✅ 18 Supporting Document Types

All data is in the DynamoDB `admin-configurations` table.

## Full Documentation
See `docs/WINDOWS_TSX_ISSUE.md` and `docs/DEBUGGING_SUMMARY.md` for details.
