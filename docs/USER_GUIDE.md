# 📘 Admin Panel User Guide

## Welcome to Amazon Appeal Wizard Admin Panel

This guide will help you understand and use the admin panel to customize your appeal generation system.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [AI Instructions Editor](#ai-instructions-editor)
4. [Form Fields Manager](#form-fields-manager)
5. [Template Documents](#template-documents)
6. [Testing & Preview](#testing--preview)
7. [Version History](#version-history)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Getting Started

### Accessing the Admin Panel

1. Navigate to `http://your-domain.com/admin`
2. Enter your admin credentials
3. You'll see the dashboard with navigation sidebar

### First Time Setup

If this is your first time:
1. Run the seed script to populate initial data:
   ```bash
   npm run seed-admin-ts
   ```
2. Verify configurations in each section
3. Test the appeal generation
4. Make your first customizations

---

## Dashboard Overview

### Main Sections

**AI Instructions** 📝
- Customize how AI generates each section of appeals
- Adjust token limits and prompts
- Configure appeal-type-specific guidance

**Form Fields** 📋
- Manage appeal types
- Customize root causes, actions, and measures
- Control what users see in the form

**Templates** 📄
- Upload successful appeal examples
- Manage document library
- Configure similarity settings

**Testing** 🧪
- Generate test appeals with specific configurations
- Compare different versions
- Preview changes before activation

**History** 📜
- View all configuration changes
- Compare versions
- Rollback to previous configurations

---

## AI Instructions Editor

### Overview

The AI Instructions Editor allows you to customize how the AI generates each part of the appeal. Appeals are generated in 5 sections:

1. Opening & Introduction
2. Root Cause Analysis
3. Corrective Actions
4. Preventive Measures
5. Closing & Signature

### Editing a Section

1. **Navigate** to AI Instructions
2. **Select** a section to edit
3. **Modify** the prompt template
4. **Adjust** max tokens (100-4000)
5. **Save as Draft**
6. **Test** with the Testing page
7. **Activate** when satisfied

### Understanding Prompts

Prompts use placeholders that get replaced with actual data:

- `{fullName}` - User's name
- `{storeName}` - Store name
- `{appealType}` - Type of appeal
- `{rootCauses}` - Selected root causes
- `{correctiveActions}` - Actions taken
- `{preventiveMeasures}` - Future measures
- `{asins}` - Product ASINs

**Example Prompt**:
```
Generate a professional opening paragraph for an Amazon appeal.

Seller Information:
- Name: {fullName}
- Store: {storeName}
- Appeal Type: {appealType}

Requirements:
- Be respectful and professional
- Acknowledge the violation
- Express commitment to Amazon's policies
- Keep under 200 words
```

### Token Limits

**What are tokens?**
Tokens are pieces of text the AI processes. Approximately:
- 1 token ≈ 4 characters
- 100 tokens ≈ 75 words

**Recommended token limits**:
- Opening: 300-500 tokens
- Root Cause: 400-600 tokens
- Actions: 400-600 tokens
- Measures: 500-800 tokens
- Closing: 200-300 tokens

**Higher tokens** = Longer, more detailed responses (but costs more)
**Lower tokens** = Shorter, concise responses (cheaper)

### Tips for Good Prompts

✅ **DO**:
- Be specific about what you want
- Include examples of good output
- Use clear, structured instructions
- Test with various appeal types

❌ **DON'T**:
- Make prompts too long (keep under 2000 characters)
- Use vague instructions
- Forget to test after changes
- Activate without previewing

---

## Form Fields Manager

### Overview

Control what options users can select when creating appeals. This includes:
- Appeal types (suspension reasons)
- Root causes (why it happened)
- Corrective actions (what was fixed)
- Preventive measures (future prevention)
- Supporting documents (required files)

### Managing Appeal Types

**Add a New Appeal Type**:
1. Go to Form Fields > Appeal Types
2. Click "Add Appeal Type"
3. Enter value (e.g., `new-type`)
4. Enter label (e.g., "New Violation Type")
5. Set order for display
6. Enable/disable toggle
7. Save draft
8. Test and activate

**Edit Existing**:
1. Find the appeal type
2. Click edit icon
3. Modify label or order
4. Save changes

**Disable** (instead of delete):
1. Find the appeal type
2. Toggle "Enabled" off
3. Save - users won't see it

### Managing Root Causes

Root causes are specific to appeal types. Each cause can apply to one or more appeal types.

**Add a Root Cause**:
1. Go to Form Fields > Root Causes
2. Click "Add Root Cause"
3. Enter the cause text
4. Select category
5. **Important**: Select which appeal types this applies to
6. Save draft

**Example**:
- Cause: "Used an unauthorized supplier"
- Category: "Sourcing Issues"
- Appeal Types: [Inauthenticity, Supply Chain]

### Managing Actions & Measures

**Corrective Actions** = What you've already done
**Preventive Measures** = What you'll do going forward

Same process:
1. Add new item
2. Set category
3. Assign to appeal types (or leave empty for "all")
4. Enable/disable as needed

### Search & Filter

Use the search bar to find items quickly:
- Type keywords to filter
- Use filter chips to show only certain categories
- Clear search to see all items

---

## Template Documents

### Overview

Upload successful appeal examples that the system can reference for better results.

### Uploading Templates

1. **Go to** Templates section
2. **Click** "Upload Template"
3. **Select** file (.docx or .txt, max 10MB)
4. **Choose** appeal types this template applies to
5. **Add** tags (optional)
6. **Upload**

The system will:
- Extract text from the document
- Generate embeddings for similarity search
- Store in S3
- Make available for reference

### Managing Templates

**View Templates**:
- See all uploaded documents
- Filter by appeal type
- Sort by date or name

**Delete Templates**:
1. Find the template
2. Click delete icon
3. Confirm deletion
4. Template removed from S3

### Template Settings

**Similarity Threshold** (0.0 - 1.0):
- How similar a user's appeal must be to retrieve this template
- Higher = More strict (0.8 recommended)
- Lower = More lenient (0.6 minimum)

**Max Relevant Documents** (1-20):
- How many templates to retrieve per appeal
- More = More context for AI (but slower)
- Recommended: 3-5

---

## Testing & Preview

### Overview

**ALWAYS test before activating!** The testing page lets you generate appeals with draft configurations to see how they'll look.

### Generating a Test Appeal

1. **Go to** Testing page
2. **Select** AI Instructions version
   - "Active" = Current live version
   - Specific version = Your draft to test
3. **Select** Form Fields version (optional)
4. **Fill in** test data:
   - Appeal type
   - Seller name and store
   - Root causes (one per line)
   - Corrective actions (one per line)
   - Preventive measures (one per line)
5. **Add notes** (optional) - What you're testing
6. **Click** "Generate Test Appeal"
7. **Review** the generated appeal below

### Comparing Test Appeals

Compare two test appeals side-by-side:

1. **Generate** test appeal with active version
2. **Generate** another with your draft version
3. **Select** both tests (checkboxes)
4. **Click** "Compare Appeals"
5. **Review** differences:
   - 🟢 **Green** = Added in second appeal
   - 🔴 **Red** = Removed from first appeal
   - 🟡 **Yellow** = Changed between appeals
   - ⚪ **White** = Same in both

### Test History

All tests are saved automatically:
- View past tests
- See what version was used
- Review your notes
- Delete old tests

**Best Practice**: Add notes like "Testing new root cause prompt" so you remember what you were testing.

---

## Version History

### Understanding Versions

Every time you activate a configuration, a new version is created. Versions are numbered with timestamps.

**Version Lifecycle**:
1. **Draft** - Work in progress, not affecting live app
2. **Active** - Currently used by live appeal generation
3. **Archived** - Previous version, can be restored

### Viewing History

1. **Go to** History page
2. **Select** configuration type (AI Instructions, Form Fields, etc.)
3. **See** timeline of all changes:
   - When changed
   - Who changed it
   - What changed (description)
   - Action (created, updated, activated, rolled back)

### Comparing Versions

1. **Select** two versions (checkboxes)
2. **Click** "Compare Versions"
3. **Review** side-by-side JSON comparison
4. **See** what changed between versions

### Rolling Back

If something goes wrong, rollback to a previous version:

1. **Find** the version you want to restore
2. **Click** "Rollback to this version"
3. **Confirm** the action
4. **Wait** for confirmation
5. **Test** to verify rollback worked

**Note**: Rollback creates a new version with the old configuration. Your version history is preserved.

---

## Best Practices

### Configuration Management

✅ **DO**:
- Save drafts frequently
- Test before activating
- Add clear descriptions to changes
- Keep version notes
- Compare before/after when testing

❌ **DON'T**:
- Activate without testing
- Make multiple changes at once (test incrementally)
- Delete appeal types that are in use
- Skip the testing phase
- Forget to document why you made changes

### Testing Strategy

**Recommended Workflow**:
1. Make small change to draft
2. Save draft
3. Go to Testing
4. Generate test appeal with draft version
5. Generate test appeal with active version
6. Compare the two
7. If satisfied → Activate
8. If not → Go back and refine

**Test with**:
- Different appeal types
- Various combinations of causes/actions
- Edge cases (very long, very short inputs)
- Real seller scenarios

### Performance Tips

**Keep token limits reasonable**:
- Start conservative (400-600 tokens per section)
- Increase only if responses are too short
- Remember: Higher tokens = Higher cost

**Optimize prompts**:
- Remove unnecessary instructions
- Be concise but clear
- Test with minimal viable prompt first

**Manage templates**:
- Only upload high-quality templates
- Keep under 50 total templates
- Remove outdated templates
- Use specific appeal type assignments

---

## Troubleshooting

### Common Issues

#### "Configuration not loading"
**Solution**:
1. Check browser console for errors
2. Refresh the page
3. Clear browser cache
4. Check network tab for failed requests
5. Contact support if persists

#### "Changes not appearing in live form"
**Solution**:
1. Verify you activated the configuration (not just saved draft)
2. Wait 5 minutes for cache to expire
3. Hard refresh the live form (Ctrl+Shift+R)
4. Check configuration status is "Active"

#### "Generated appeal is too short/long"
**Solution**:
1. Adjust max tokens for that section
2. Modify prompt to request more/less detail
3. Test with different token limits
4. Compare with previous working version

#### "Upload failed"
**Solution**:
1. Check file size (max 10MB)
2. Verify file type (.docx or .txt only)
3. Try a different file
4. Check AWS S3 permissions
5. Check browser console for error details

#### "Can't activate configuration"
**Solution**:
1. Check for validation errors (red highlights)
2. Ensure all required fields are filled
3. Verify token limits are within range
4. Check for duplicate section orders
5. Review error message details

### Getting Help

If you're stuck:
1. Check this User Guide
2. Review the FAQ below
3. Check version history (did it work before?)
4. Try rollback to last working version
5. Contact support with:
   - What you were trying to do
   - What happened instead
   - Screenshots of any errors
   - Your browser and version

---

## FAQ

### General Questions

**Q: How often should I update configurations?**
A: Only when needed. Test quarterly or when you notice appeal success rates changing.

**Q: Can I have multiple active configurations?**
A: No, only one configuration can be active per type at a time.

**Q: What happens if I delete an appeal type that users have used?**
A: Don't delete - disable instead. Past appeals will still show the type in history.

**Q: How long are configurations cached?**
A: 5 minutes. Changes take effect within 5 minutes of activation.

### AI Instructions

**Q: What's the best token limit?**
A: Start with 400-600 tokens per section. Adjust based on output quality.

**Q: Can I use custom variables?**
A: No, only the predefined variables listed in the editor.

**Q: How do I make AI more/less formal?**
A: Adjust the prompt tone instructions. Add "Be extremely formal" or "Use casual language".

**Q: Why are my prompts not working?**
A: Check for syntax errors, test with simple prompts first, ensure variables are spelled correctly.

### Form Fields

**Q: Can I reorder items?**
A: Yes! Use the drag handle or edit the order number.

**Q: How do I remove an option?**
A: Don't delete - disable it with the toggle. This preserves historical data.

**Q: Can one action apply to multiple appeal types?**
A: Yes! Select multiple appeal types when editing, or leave empty for "all types".

### Templates

**Q: How many templates should I upload?**
A: 3-5 per appeal type is ideal. Quality over quantity.

**Q: What makes a good template?**
A: Successful appeals that follow Amazon's requirements, well-structured, professional tone.

**Q: Can I edit uploaded templates?**
A: No, upload a new corrected version and delete the old one.

### Testing

**Q: Do test appeals count toward costs?**
A: Yes, they use OpenAI API calls. But testing is crucial - worth the small cost.

**Q: How many tests should I run?**
A: At least 2-3 per major change, covering different appeal types.

**Q: Can I delete test history?**
A: Yes, but keep important tests for reference.

### Versioning

**Q: How many versions are kept?**
A: All versions are kept indefinitely. You can manually archive old ones.

**Q: Can I delete old versions?**
A: You can archive them, but not delete. Version history is important for compliance.

**Q: What happens when I rollback?**
A: A new version is created with the old configuration. Nothing is deleted.

---

## Keyboard Shortcuts

Speed up your workflow with these shortcuts:

- `Ctrl+S` - Save draft
- `Ctrl+Z` - Undo
- `Ctrl+F` - Search/Filter
- `Escape` - Close modals
- `Enter` - Confirm dialogs

---

## Tips for Success

1. **Start Small** - Make one change at a time
2. **Always Test** - Never activate without testing
3. **Document Changes** - Add clear descriptions
4. **Monitor Results** - Track appeal success rates
5. **Iterate** - Continuously improve based on feedback
6. **Keep Backups** - Version history is your safety net
7. **Use Templates** - Upload your best successful appeals
8. **Optimize Costs** - Start with lower token limits, increase as needed
9. **Mobile Check** - Test on mobile devices occasionally
10. **Stay Updated** - Check for new features and updates

---

## Support

Need help? Contact support:
- Email: support@your-domain.com
- GitHub Issues: [repository link]
- Documentation: `/docs` folder

---

**Version**: 1.0
**Last Updated**: March 7, 2026
**Status**: Complete
