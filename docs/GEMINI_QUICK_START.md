# Gemini RAG Integration - Quick Start Checklist

## ✅ Implementation Status: COMPLETE

All code has been implemented. Follow these steps to migrate and deploy.

---

## 📋 Pre-Migration Checklist

Before starting migration, ensure:

- [ ] You have access to AWS S3 bucket with 38 template documents
- [ ] DynamoDB tables are set up and accessible
- [ ] You have a Google account for Gemini API access
- [ ] `.env.local` file exists with AWS and OpenAI credentials
- [ ] Development environment is working (`npm run dev`)

---

## 🚀 Migration Steps (15 minutes)

### Step 1: Get Gemini API Key (2 minutes)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AI...`)

### Step 2: Update Environment Variables (1 minute)

Edit `.env.local`:

```bash
# Add this section (replace with your actual key)
GOOGLE_GEMINI_API_KEY=AIza...your-actual-key-here
GOOGLE_GEMINI_MODEL=gemini-2.5-flash  # NEW: Specify model (fast and cost-effective)

# Add feature flag (keep as false for now)
NEXT_PUBLIC_USE_GEMINI_RAG=false
```

### Step 3: Run Migration (5-10 minutes)

```bash
npm run migrate-to-gemini
```

**What happens:**
- Downloads all 38 templates from S3
- Uploads each to Gemini File API
- Detects appeal types from filenames
- Saves configuration to DynamoDB
- Prints summary report

**Expected output:**
```
✅ Successful: 38/38
❌ Failed: 0/38

🎉 Migration complete!
```

### Step 4: Verify Migration (1 minute)

```bash
npm run verify-gemini
```

**What to check:**
- ✅ Total documents: 38
- ✅ With Gemini File ID: 38
- ✅ GOOGLE_GEMINI_API_KEY: Set
- ✅ All appeal types have templates

### Step 5: Test Locally (5 minutes)

Enable Gemini RAG in `.env.local`:

```bash
NEXT_PUBLIC_USE_GEMINI_RAG=true
```

Start development server:

```bash
npm run dev
```

Test appeal generation:
1. Go to http://localhost:3000
2. Generate an appeal for "KDP/ACX/Merch" appeal type
3. Check console logs for:
   ```
   ✨ Using Gemini File Search RAG
   ✅ Retrieved X relevant chunks from Gemini
   ```
4. Verify appeal quality is good

### Step 6: Deploy to Production (10 minutes)

1. **Add environment variables in AWS Amplify Console:**
   - Navigate to: Amplify → Your App → Environment Variables
   - Add: `GOOGLE_GEMINI_API_KEY` = `your-key`
   - Add: `NEXT_PUBLIC_USE_GEMINI_RAG` = `false` (initially)

2. **Deploy updated code:**
   ```bash
   git add .
   git commit -m "feat: integrate Gemini File Search RAG for template retrieval"
   git push origin main
   ```

3. **Wait for deployment** (AWS Amplify auto-deploys)

4. **Run migration in production:**
   - Option A: SSH to production and run `npm run migrate-to-gemini`
   - Option B: Create admin panel UI for migration (future enhancement)

5. **Verify production migration:**
   ```bash
   npm run verify-gemini
   ```

6. **Enable Gemini RAG in production:**
   - Go to Amplify Console → Environment Variables
   - Update: `NEXT_PUBLIC_USE_GEMINI_RAG` = `true`
   - Redeploy application

7. **Monitor production:**
   - CloudWatch Logs: `/aws/lambda/appeal-generation`
   - Test appeal generation for multiple appeal types
   - Monitor for errors or fallbacks

---

## 🔍 Verification Commands

Use these to check status at any time:

```bash
# Verify migration completed successfully
npm run verify-gemini

# Check what's in Gemini (requires GOOGLE_GEMINI_API_KEY)
# This is built into verify-gemini script

# Check DynamoDB configuration
# Use AWS Console → DynamoDB → admin-configurations → templates
```

---

## 📊 Expected Results

### After Migration

In DynamoDB `admin-configurations` table:
- 1 config record with `configId = 'templates'`
- 38 documents in `configData.documents` array
- Each document has `geminiFileId` field
- Settings include `geminiCorpusId` and `useGeminiRAG: true`

### After Enabling Gemini RAG

In console logs during appeal generation:
```
✨ Using Gemini File Search RAG
📝 Semantic query: Appeal type: kdp-acx-merch. Keywords: KDP, publishing...
📚 Found 8 enabled templates for appeal type: kdp-acx-merch
✅ Retrieved 20 relevant chunks from Gemini
✅ Completed section 1/5: Opening & Introduction (1234 chars)
```

---

## ⚠️ Troubleshooting

### Error: 404 models/gemini-1.5-pro not found

**Cause:** Gemini 1.5 models have been retired.

**Fix:**
1. Add to `.env.local`: `GOOGLE_GEMINI_MODEL=gemini-2.5-flash`
2. Run: `npm run test-gemini`
3. Restart dev server

**Available models:**
- `gemini-2.5-flash` - Fast, cost-effective (recommended default)
- `gemini-2.5-pro` - High-capability for complex reasoning

### Migration fails with "API key not set"
**Fix:** Add `GOOGLE_GEMINI_API_KEY` to `.env.local`

### Migration fails with "Failed to download from S3"
**Fix:** Check AWS credentials and S3 bucket access

### "No chunks retrieved from Gemini"
**Fix:**
1. Check that migration completed (`npm run verify-gemini`)
2. Verify Gemini API key is valid
3. Check console for specific error messages
4. System will automatically fall back to DynamoDB

### Appeal quality seems lower
**Fix:**
1. Check retrieved chunk relevance scores (should be > 0.7)
2. Verify correct templates are enabled for appeal type
3. Adjust `similarityThreshold` in DynamoDB configuration
4. Fall back to DynamoDB temporarily: `NEXT_PUBLIC_USE_GEMINI_RAG=false`

---

## 🛡️ Rollback Plan

If issues occur in production:

### Quick Rollback (Instant)
```bash
# In Amplify Console → Environment Variables
NEXT_PUBLIC_USE_GEMINI_RAG=false
```
Redeploy - System uses DynamoDB embeddings (legacy)

### Full Rollback (5 minutes)
```bash
git revert HEAD
git push origin main
```
Amplify auto-deploys previous version

---

## 📈 Success Metrics

Track these after deployment:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Gemini API Success Rate | > 95% | CloudWatch logs |
| Average Query Time | < 3 sec | CloudWatch metrics |
| Fallback Rate | < 5% | Count "falling back" in logs |
| Appeal Quality | Equal or better | Manual review |
| Lambda Timeout Rate | < 1% | CloudWatch metrics |

---

## 🎯 Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Implementation | - | ✅ Complete |
| Get Gemini API Key | 2 min | ⏳ Your turn |
| Run Migration | 10 min | ⏳ Your turn |
| Test Locally | 5 min | ⏳ Your turn |
| Deploy to Production | 10 min | ⏳ Your turn |
| Monitor Production | 1-2 weeks | ⏳ Your turn |
| Cleanup Legacy Code | 1 hour | ⏳ After verification |

**Total time to deploy:** ~30 minutes

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **GEMINI_QUICK_START.md** (this file) | Quick migration checklist |
| **docs/GEMINI_RAG_INTEGRATION.md** | Detailed integration guide |
| **docs/GEMINI_IMPLEMENTATION_SUMMARY.md** | Implementation summary |
| **README.md** | Updated with Gemini sections |

---

## ✅ Next Action

**👉 Get your Gemini API key and run migration:**

```bash
# 1. Get API key from https://makersuite.google.com/app/apikey
# 2. Add to .env.local
# 3. Run migration
npm run migrate-to-gemini
```

---

## 🆘 Need Help?

1. Check console logs for detailed error messages
2. Review `/docs/GEMINI_RAG_INTEGRATION.md` troubleshooting section
3. Verify all environment variables are set
4. Check Gemini API status: https://status.cloud.google.com/
5. Use fallback: `NEXT_PUBLIC_USE_GEMINI_RAG=false`

---

**🎉 You're ready to migrate! Good luck!**
