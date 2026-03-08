# Fix Build Error - Install Missing Packages

## Issue
The build is failing because two packages are missing:
- `react-hot-toast` (for toast notifications)
- `@monaco-editor/react` (for the code editor)

## Solution

### Run this command in your terminal:

```bash
cd B:\amazon-appeal-wizard
npm install
```

This will install the two packages I've added to `package.json`:
- `@monaco-editor/react@^4.6.0`
- `react-hot-toast@^2.4.1`

### Verify Installation

After npm install completes, check that the packages are installed:

```bash
npm list react-hot-toast
npm list @monaco-editor/react
```

You should see:
```
amz-appeal-pro@0.1.0
├── @monaco-editor/react@4.6.0
└── react-hot-toast@2.4.1
```

### Restart Dev Server

After installation:

```bash
npm run dev
```

Then visit: `http://localhost:3000/admin/ai-instructions`

---

## Alternative: Install Individually

If npm install doesn't work, try:

```bash
npm install react-hot-toast@2.4.1
npm install @monaco-editor/react@4.6.0
```

---

**The packages have been added to package.json** ✅

Just need to run `npm install` to download them!
