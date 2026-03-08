# Windows tsx Output Issue - Resolved

## Problem
When running TypeScript scripts with `tsx` via npm scripts on Windows using Git Bash, the script executes but produces **no console output whatsoever**, even though:
- The script completes successfully (exit code 0)
- The script performs its operations (e.g., writes to DynamoDB)
- console.log statements exist in the code

## Root Cause
On Windows, npm/npx needs to use the `.cmd` wrapper for tsx, but Git Bash was attempting to execute the POSIX shell script version (`tsx`) instead of the Windows batch file (`tsx.cmd`). The shell script version was swallowing all stdout/stderr output.

## Solution

### Option 1: Use Windows Command Prompt (Recommended for Windows)
Instead of Git Bash, use Windows cmd.exe:

```bash
npm run seed-form-fields
```

### Option 2: Explicitly use cmd.exe from Git Bash
```bash
cmd.exe //c "npm run seed-form-fields"
```

Or run the script directly:
```bash
cmd.exe //c "node_modules\.bin\tsx.cmd scripts\seed-form-fields.ts"
```

### Option 3: Use PowerShell
```powershell
npm run seed-form-fields
```

### Option 4: Compile to JavaScript first
For more reliability on Windows, compile TypeScript to JavaScript:

1. Add a compile script to package.json:
```json
{
  "scripts": {
    "compile-scripts": "tsc scripts/*.ts --outDir scripts/dist --module commonjs --esModuleInterop --resolveJsonModule --skipLibCheck"
  }
}
```

2. Run the compiled JavaScript:
```bash
node scripts/dist/seed-form-fields.js
```

## Verification
The seed-form-fields.ts script was successfully tested and confirmed to:
- Archive existing active configurations
- Create new form-fields configuration with:
  - 22 Appeal Types
  - 45 Root Causes
  - 38 Corrective Actions
  - 66 Preventive Measures
  - 18 Supporting Documents
- Save to DynamoDB admin-configurations table
- Create history record in admin-configuration-history table

## Testing Other Scripts
If you encounter similar issues with other TypeScript scripts (seed-admin.ts, test-appeal-generation.ts, etc.), use the same solution.

## Files Affected
- scripts/seed-form-fields.ts
- scripts/seed-admin.ts
- scripts/test-appeal-generation.ts
- scripts/validate-env.ts
- Any other scripts run via tsx

## Environment
- OS: Windows (tested on Windows with Git Bash)
- Node: v22.14.0
- tsx: v4.20.6
- Shell: Git Bash (MINGW64)
