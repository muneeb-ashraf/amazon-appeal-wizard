# 🎉 Phase 2: AI Instructions Editor - Complete!

## Quick Start

```bash
# Start the development server
npm run dev

# Open in browser
http://localhost:3000/admin/ai-instructions
```

---

## ✅ What You Can Do Now

### Full AI Instructions Editing
- ✏️ **Edit all 5 sections** of appeal generation prompts
- 📝 **Monaco code editor** with syntax highlighting for variables
- 🎚️ **Token limit sliders** (100-2000 range) with estimates
- 🔤 **Insert 16 variables** via dropdown menu
- 🎨 **Customize system & user prompts** separately
- ⚙️ **Global settings** for model, temperature, retries, timeout
- 💾 **Save drafts** and **activate** when ready
- ⌨️ **Keyboard shortcuts** (Ctrl+S to save)

---

## 🎯 New Features

### 1. Visual Section Editor
- Collapsible sections with numbered badges
- Editable names and descriptions
- Reorder with up/down arrows
- Delete with confirmation
- Add new sections on the fly

### 2. Monaco Code Editor
- Professional VS Code-style editor
- Blue highlighting for `{variables}`
- Line numbers and word wrap
- Custom theme optimized for prompts

### 3. Variable System
- 16 available variables with descriptions
- Click to insert at cursor
- Examples for each variable
- Real-time insertion

### 4. Token Management
- Visual slider (100-2000 range)
- Character estimates (~750 per 1000 tokens)
- Word estimates (~750 per 1000 tokens)
- Smart warnings for low/high limits

### 5. Draft & Activate Workflow
- Save changes as draft
- Test before activating
- One active config at a time
- Version tracking

---

## 📋 Available Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{appealType}` | Type of appeal | inauthenticity-supply-chain |
| `{fullName}` | Seller's name | John Smith |
| `{storeName}` | Store name | Smith's Store |
| `{email}` | Email address | seller@example.com |
| `{sellerId}` | Merchant token | A1B2C3D4E5F6G |
| `{asins}` | Product ASINs | B001ABC123 |
| `{rootCauses}` | Selected causes | Operating retail arbitrage... |
| `{rootCauseDetails}` | Additional details | Sourced from TJ Maxx... |
| `{correctiveActionsTaken}` | Actions taken | Removed all listings... |
| `{correctiveActionsDetails}` | Action details | Implemented verification... |
| `{preventiveMeasures}` | Measures | Only authorized distributors... |
| `{preventiveMeasuresDetails}` | Measure details | Created supplier checklist... |

Plus 4 more conditional variables!

---

## 🎨 UI Features

- **Professional design** with Tailwind CSS
- **Smooth animations** for collapse/expand
- **Toast notifications** for feedback
- **Loading states** during API calls
- **Info banners** with usage tips
- **Confirmation dialogs** for safety
- **Unsaved changes** indicator
- **Help text** throughout

---

## 🚀 Quick Guide

### Edit a Section
1. Click section to expand
2. Edit name/description
3. Switch between System/User prompt tabs
4. Click "Insert Variable" to add variables
5. Type or paste prompt text
6. Adjust token limit slider
7. Changes tracked automatically

### Save Changes
1. Make edits in any section
2. "Unsaved changes" appears in header
3. Click "Save Draft" or press Ctrl+S
4. Toast notification confirms save
5. Draft version created

### Activate Configuration
1. Save draft first (must have no unsaved changes)
2. Click "Activate" button
3. Confirm activation
4. Previous active config archived
5. New config becomes live

### Add/Remove Sections
- Click "+ Add New Section" at bottom
- Click delete icon on any section
- Reorder with up/down arrows
- Each section numbered automatically

---

## 💡 Best Practices

### System Prompts
- Focus on **style and tone**
- Describe **what the AI should do**
- Keep it **concise** (1-3 sentences)
- Example: "Write a professional, concise introduction"

### User Prompt Templates
- Include **relevant variables**
- Provide **context** for the AI
- Structure the **data clearly**
- Example: "Write introduction for {appealType}. Seller: {fullName}"

### Token Limits
- Start with **300-500** for most sections
- Use **200-300** for introductions/closings
- Use **500-1000** for detailed analysis
- Monitor output quality and adjust

### Temperature
- **0.5-0.7** recommended (balanced)
- **Lower** for more consistent output
- **Higher** for more creative variations

---

## 🐛 Troubleshooting

### Issue: Changes not saving
**Solution**: Check browser console for errors, ensure DynamoDB tables exist

### Issue: Variables not inserting
**Solution**: Click the variable name in dropdown, cursor must be in Monaco editor

### Issue: Token limit warnings
**Solution**: Warnings are informational only, adjust based on your needs

### Issue: Monaco editor not loading
**Solution**: Check internet connection (CDN-based), refresh page

---

## 📊 Current Status

**Phase 2**: ✅ Complete (100%)
**Overall Progress**: ~20% of total plan

**What's working**:
- ✅ Full AI instructions editing
- ✅ Monaco code editor
- ✅ Variable insertion
- ✅ Token limit management
- ✅ Save draft/activate workflow
- ✅ Global settings
- ✅ Section management

**Next (Phase 3)**:
- Form Fields Editor
- Drag-and-drop reordering
- Appeal type management
- Root causes editing
- Actions & measures

---

## 🎓 Examples

### Example System Prompt
```
You are an expert Amazon appeal writer. Write a professional root cause
analysis that clearly identifies what went wrong, shows deep understanding
of the issue, and takes full responsibility without making excuses.
```

### Example User Prompt Template
```
Write a root cause analysis for an Amazon appeal.

Appeal Type: {appealType}
Root Causes Selected: {rootCauses}
Additional Details: {rootCauseDetails}

The analysis should be specific, take responsibility, and show understanding
of why this violated Amazon's policies.
```

---

## 📁 Files Created

```
src/components/admin/ai-instructions/
├── AIInstructionsEditor.tsx      (300+ lines)
├── SectionEditor.tsx              (250+ lines)
├── PromptEditor.tsx               (70 lines)
├── TokenLimitSlider.tsx           (80 lines)
└── VariableInserter.tsx           (180 lines)
```

**Total**: ~880 lines of production code

---

## 🎊 You're Ready!

Phase 2 is complete and ready to use!

**Try it now**:
1. `npm run dev`
2. Visit `/admin/ai-instructions`
3. Edit a section
4. Save draft
5. Activate when ready

**Documentation**:
- `PHASE_2_COMPLETE.md` - Full technical details
- This file - Quick reference guide
- Inline help in the UI

---

**Questions?** Check the UI help text and tooltips - they're designed to guide you!

**Ready for Phase 3?** The Form Fields Editor is next! 🚀
