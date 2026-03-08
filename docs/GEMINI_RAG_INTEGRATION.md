# Gemini File Search RAG Integration

## Overview

This document describes the implementation of Google Gemini File Search RAG (Retrieval-Augmented Generation) integration for the Amazon Appeal Wizard. The system replaces the current DynamoDB-based OpenAI embedding approach with Gemini's managed RAG infrastructure.

## Architecture

### Before (DynamoDB Embeddings)
```
Form Submission → getCachedEmbeddings() → DynamoDB scan → createEmbedding(userQuery)
→ cosineSimilarity search → Top 20 templates → OpenAI generation → Appeal sections
```

### After (Gemini File Search RAG)
```
Form Submission → Build semantic query → Query Gemini File Search (with appealType filter)
→ Retrieve relevant chunks (top 20, score > 0.7) → Format context with citations
→ OpenAI generation with RAG context → Appeal section
```

## Key Benefits

1. **Eliminate manual embedding management** - Gemini handles embeddings automatically
2. **Better semantic search** - Gemini's embeddings are optimized for document retrieval
3. **Automatic chunking and indexing** - No need to manually chunk documents
4. **Free storage and query-time embeddings** - Cost savings vs. managing our own vector DB
5. **Simplified architecture** - Less code to maintain
6. **Admin-friendly template management** - Upload/delete templates easily

## Implementation Files

### Core Files Created

1. **`/src/lib/gemini-rag-utils.ts`** (~300 lines)
   - Core RAG integration module
   - Functions:
     - `queryGeminiFileSearch()` - Query Gemini for relevant templates
     - `buildSemanticQuery()` - Build semantic query from form data
     - `formatRetrievedContext()` - Format retrieved chunks for OpenAI
     - `uploadFileToGemini()` - Upload template to Gemini
     - `deleteFileFromGemini()` - Delete template from Gemini
     - `listGeminiFiles()` - List all Gemini files

2. **`/scripts/migrate-to-gemini-file-search.ts`** (~250 lines)
   - Migration script to upload all 38 templates from S3 to Gemini
   - Detects appeal types from filenames
   - Saves metadata to DynamoDB admin-configurations table
   - Run with: `npm run migrate-to-gemini`

### Modified Files

1. **`/src/app/api/generate-appeal-section/route.ts`**
   - Added feature flag: `NEXT_PUBLIC_USE_GEMINI_RAG`
   - Integrated Gemini RAG with automatic fallback to DynamoDB embeddings
   - Error handling and logging

2. **`/src/lib/admin-config-types.ts`**
   - Added `geminiFileId` and `geminiUploadedAt` to `TemplateDocumentConfig`
   - Added `geminiCorpusId`, `useGeminiRAG`, and `geminiChunkingConfig` to `TemplatesConfig.settings`

3. **`/package.json`**
   - Added `@google/generative-ai` dependency
   - Added `migrate-to-gemini` script

4. **`.env.local`**
   - Added `GOOGLE_GEMINI_API_KEY` (needs to be set)
   - Added `NEXT_PUBLIC_USE_GEMINI_RAG=false` (feature flag, set to `true` after migration)

## Environment Setup

### Required Environment Variables

Add these to your `.env.local`:

```bash
# Google Gemini API Key (REQUIRED)
GOOGLE_GEMINI_API_KEY=your-actual-gemini-api-key-here

# Feature Flag (set to true after successful migration)
NEXT_PUBLIC_USE_GEMINI_RAG=false
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to `.env.local`

## Migration Steps

### Phase 1: Setup (COMPLETED ✅)

- [x] Install `@google/generative-ai` package
- [x] Add environment variables to `.env.local`
- [x] Create Gemini RAG utility module
- [x] Create migration script
- [x] Update type definitions
- [x] Integrate into API with feature flag

### Phase 2: Migration (TODO)

1. **Update `.env.local` with your Gemini API key:**
   ```bash
   GOOGLE_GEMINI_API_KEY=your-actual-key-here
   ```

2. **Run the migration script:**
   ```bash
   npm run migrate-to-gemini
   ```

   This will:
   - Download all 38 templates from S3
   - Upload them to Gemini File API
   - Save metadata to DynamoDB `admin-configurations` table
   - Print a summary report

3. **Verify migration success:**
   - Check that all 38 templates were uploaded successfully
   - Review the configuration saved to DynamoDB
   - Ensure no errors in the migration log

### Phase 3: Testing (TODO)

1. **Enable Gemini RAG:**
   ```bash
   # In .env.local
   NEXT_PUBLIC_USE_GEMINI_RAG=true
   ```

2. **Test appeal generation for each appeal type:**
   - Test at least one appeal for each of the 19+ appeal types
   - Verify that retrieved templates are relevant
   - Check that appeal quality matches or exceeds baseline

3. **Monitor logs:**
   - Check console logs for Gemini query times
   - Verify retrieved chunk relevance scores (should be > 0.7)
   - Monitor for any Gemini API errors

4. **Performance benchmarks:**
   - Query time: < 3 seconds per RAG query
   - API success rate: > 95%
   - Lambda timeout rate: < 1%

### Phase 4: Production Deployment (TODO)

1. **Deploy to production:**
   - Ensure `GOOGLE_GEMINI_API_KEY` is set in production environment
   - Run migration in production (or promote from staging)
   - Set `NEXT_PUBLIC_USE_GEMINI_RAG=true` in production

2. **Monitor production:**
   - CloudWatch logs for errors
   - Appeal generation success rate
   - User feedback on quality

3. **Rollback strategy (if needed):**
   ```bash
   # Option A: Disable feature flag
   NEXT_PUBLIC_USE_GEMINI_RAG=false

   # Option B: Git revert
   git revert <commit-hash>
   git push origin main
   ```

### Phase 5: Cleanup (After 1-2 weeks of stable production)

Only perform cleanup after verifying stable production operation:

1. **Remove legacy code:**
   - Delete `/src/lib/embeddings-cache.ts`
   - Remove embedding functions from `/src/lib/openai-utils.ts`:
     - `createEmbedding()`
     - `createBatchEmbeddings()`
     - `cosineSimilarity()`
     - `findRelevantDocuments()`
     - `generateAppealSectionWithContext()`
   - Remove feature flag logic from `/src/app/api/generate-appeal-section/route.ts`

2. **Drop DynamoDB table:**
   ```bash
   # Run after 1-2 weeks of verified stable production
   aws dynamodb delete-table --table-name amazon-documents --region eu-north-1
   ```

3. **Update documentation:**
   - Remove references to DynamoDB embeddings
   - Update architecture diagrams

## API Reference

### `queryGeminiFileSearch(formData, sectionId?)`

Query Gemini File Search for relevant template chunks.

**Parameters:**
- `formData: AppealFormData` - The appeal form data
- `sectionId?: number` - Optional section ID (1-5) for more targeted retrieval

**Returns:**
```typescript
{
  retrievedChunks: string[];
  citations: Array<{
    documentName: string;
    score: number;
    chunkIndex: number;
  }>;
}
```

**Example:**
```typescript
const { retrievedChunks, citations } = await queryGeminiFileSearch(formData, 2);
console.log(`Retrieved ${retrievedChunks.length} chunks`);
```

### `buildSemanticQuery(formData)`

Build a semantic query from form data for RAG retrieval.

**Parameters:**
- `formData: AppealFormData` - The appeal form data

**Returns:**
- `string` - Semantic query text

**Example:**
```typescript
const query = buildSemanticQuery(formData);
// "Appeal type: kdp-acx-merch. Keywords: KDP, publishing, content. Root causes: Unintentional similarity. Actions taken: Removed content, Hired editor. Prevention: Plagiarism checks."
```

### `formatRetrievedContext(chunks, citations)`

Format retrieved chunks into context string for OpenAI.

**Parameters:**
- `chunks: string[]` - Retrieved text chunks
- `citations: Array<{documentName, score, chunkIndex}>` - Citation metadata

**Returns:**
- `string` - Formatted context string

## Configuration

### DynamoDB Configuration Structure

The migration script saves configuration to `admin-configurations` table:

```typescript
{
  configId: 'templates',
  version: 1234567890, // timestamp
  status: 'active',
  configData: {
    documents: [
      {
        id: 'files/abc123...',
        documentName: 'POA I - Petru Nedelku - KDP ed (1).docx',
        s3Key: 'documents/POA I - Petru Nedelku - KDP ed (1).docx',
        s3Bucket: 'amazon-appeal-documents',
        fileType: 'docx',
        appealTypes: ['kdp-acx-merch'],
        uploadedAt: '2024-03-07T10:00:00Z',
        geminiFileId: 'files/abc123...',
        geminiUploadedAt: '2024-03-07T10:00:00Z',
        embeddingStatus: 'completed',
        enabled: true,
        tags: ['KDP', 'publishing', 'plan-of-action']
      },
      // ... 37 more templates
    ],
    settings: {
      similarityThreshold: 0.7,
      maxRelevantDocuments: 20,
      geminiCorpusId: 'gemini-file-search',
      useGeminiRAG: true,
      geminiChunkingConfig: {
        maxTokensPerChunk: 1024,
        maxOverlapTokens: 128
      }
    }
  },
  createdAt: '2024-03-07T10:00:00Z',
  updatedAt: '2024-03-07T10:00:00Z',
  description: 'Migrated templates to Gemini File Search'
}
```

## Appeal Type Keywords

Keywords used for boosting relevance scores:

```typescript
{
  'related-account': ['related', 'multiple accounts', 'password policy'],
  'kdp-acx-merch': ['KDP', 'ACX', 'Merch', 'publishing', 'book', 'content'],
  'amazon-relay': ['Relay', 'carrier', 'driver', 'VIN-match', 'ELD'],
  'intellectual-property': ['IP', 'copyright', 'trademark', 'USPTO'],
  'seller-code-conduct': ['review manipulation', 'forged'],
  'drop-shipping': ['dropship', 'packing slip', 'seller-of-record'],
  'restricted-products': ['restricted', 'disease claims', 'FDA', 'COA'],
  'used-sold-as-new': ['used sold as new', 'condition', 'ODR'],
  'high-cancellation': ['cancellation', 'sales velocity', 'inventory'],
  'verification-failure': ['verification', 'utility bill', 'document'],
  // ... more appeal types
}
```

## Troubleshooting

### Migration Fails

**Symptom:** Migration script exits with errors

**Solutions:**
1. Check that `GOOGLE_GEMINI_API_KEY` is set correctly in `.env.local`
2. Verify AWS credentials have S3 read access
3. Check that all 38 templates exist in S3 bucket
4. Look for rate limiting errors (script has 1-second delays between uploads)

### Gemini RAG Returns No Results

**Symptom:** `retrievedChunks.length === 0`

**Solutions:**
1. Check that migration completed successfully
2. Verify `geminiCorpusId` is set in DynamoDB configuration
3. Check Gemini API key is valid
4. Review console logs for Gemini API errors
5. System will automatically fall back to DynamoDB embeddings

### Appeal Quality Issues

**Symptom:** Generated appeals are lower quality than before

**Solutions:**
1. Review retrieved chunks and relevance scores
2. Check that appeal type detection is working correctly
3. Adjust `similarityThreshold` (default 0.7) in configuration
4. Increase `maxRelevantDocuments` (default 20) if needed
5. Verify that templates for the specific appeal type are enabled

## Feature Flag Behavior

```typescript
// Feature flag in .env.local
NEXT_PUBLIC_USE_GEMINI_RAG=false  // Uses DynamoDB embeddings (legacy)
NEXT_PUBLIC_USE_GEMINI_RAG=true   // Uses Gemini File Search RAG (new)
```

**Fallback Logic:**
- If Gemini RAG is enabled but fails, system automatically falls back to DynamoDB embeddings
- Fallback is logged in CloudWatch for monitoring
- No user-facing errors due to fallback mechanism

## Performance Metrics

### Target Metrics
- **Query time:** < 3 seconds per RAG query
- **API success rate:** > 95%
- **Lambda timeout rate:** < 1%
- **Relevance score:** > 0.7 average

### Monitoring
- CloudWatch logs: `/aws/lambda/appeal-generation`
- Metrics: InvocationErrors, Duration, ThrottleCount
- Custom metrics: Gemini query time, fallback rate

## Cost Analysis

### Before (DynamoDB Embeddings)
- DynamoDB `amazon-documents` table: ~$10/month
- OpenAI embedding creation: ~$5/month
- Total: ~$15/month

### After (Gemini File Search RAG)
- Gemini File API storage: $0 (free tier)
- Gemini query embeddings: $0 (free tier)
- Gemini retrieval: $0 (free tier, usage-based pricing TBD)
- DynamoDB savings: -$10/month (after table deletion)
- Net savings: ~$10-15/month

## Next Steps

1. ✅ **Setup complete** - Environment configured, code implemented
2. ⏳ **Add Gemini API key** - Update `.env.local` with actual key
3. ⏳ **Run migration** - Execute `npm run migrate-to-gemini`
4. ⏳ **Test thoroughly** - Verify appeal quality across all appeal types
5. ⏳ **Deploy to production** - Enable feature flag in production
6. ⏳ **Monitor for 1-2 weeks** - Ensure stable operation
7. ⏳ **Cleanup legacy code** - Remove DynamoDB embeddings after verification

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error messages
2. Review this documentation
3. Check Gemini API status: https://status.cloud.google.com/
4. File issue in GitHub repository

## References

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini File API](https://ai.google.dev/api/files)
- [Google Generative AI Node.js SDK](https://github.com/google/generative-ai-js)
- [RAG Best Practices](https://ai.google.dev/docs/rag)
