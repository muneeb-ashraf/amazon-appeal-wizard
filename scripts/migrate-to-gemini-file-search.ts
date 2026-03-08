#!/usr/bin/env tsx
// ============================================================================
// MIGRATE TEMPLATES TO GEMINI FILE SEARCH
// ============================================================================

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { uploadFileToGemini, listGeminiFiles } from '../src/lib/gemini-rag-utils';
import { TEMPLATE_DOCUMENTS } from '../src/lib/embeddings-cache';
import * as fs from 'fs';
import * as os from 'os';

// Initialize AWS clients
const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
  },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const BUCKET_NAME = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'amazon-appeal-documents';
const ADMIN_CONFIG_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE || 'admin-configurations';

/**
 * Detect appeal type from filename
 */
function detectAppealTypeFromFilename(fileName: string): string[] {
  const lowerFileName = fileName.toLowerCase();
  const appealTypes: string[] = [];

  // KDP/ACX/Merch
  if (lowerFileName.includes('kdp') || lowerFileName.includes('acx') || lowerFileName.includes('merch')) {
    appealTypes.push('kdp-acx-merch');
  }

  // Relay
  if (lowerFileName.includes('relay')) {
    appealTypes.push('amazon-relay');
  }

  // IP/Trademark/Copyright
  if (lowerFileName.includes('ip') || lowerFileName.includes('trademark') || lowerFileName.includes('copyright')) {
    appealTypes.push('intellectual-property');
  }

  // Inauthenticity
  if (lowerFileName.includes('inauthentic') || lowerFileName.includes('inauthenticity')) {
    appealTypes.push('inauthenticity-supply-chain');
  }

  // Restricted Products
  if (lowerFileName.includes('restricted') || lowerFileName.includes('disease')) {
    appealTypes.push('restricted-products');
  }

  // Drop-shipping
  if (lowerFileName.includes('dropship')) {
    appealTypes.push('drop-shipping');
  }

  // Used sold as new / ODR
  if (lowerFileName.includes('used sold as new') || lowerFileName.includes('odr')) {
    appealTypes.push('used-sold-as-new');
  }

  // Brand Registry
  if (lowerFileName.includes('brand registry')) {
    appealTypes.push('brand-registry');
  }

  // Verification
  if (lowerFileName.includes('verification')) {
    appealTypes.push('verification-failure');
  }

  // Hacked/Compromised
  if (lowerFileName.includes('hack') || lowerFileName.includes('compromised')) {
    appealTypes.push('account-compromised');
  }

  // Review Manipulation
  if (lowerFileName.includes('review manipulation')) {
    appealTypes.push('seller-code-conduct');
  }

  // Sales Velocity / Cancellation
  if (lowerFileName.includes('velocity') || lowerFileName.includes('cancellation')) {
    appealTypes.push('high-cancellation');
  }

  // FBA
  if (lowerFileName.includes('fba')) {
    appealTypes.push('fba-shipping');
  }

  // Detail Page Abuse
  if (lowerFileName.includes('detail page')) {
    appealTypes.push('detail-page-abuse');
  }

  // Fair Pricing
  if (lowerFileName.includes('fair pricing')) {
    appealTypes.push('marketplace-pricing');
  }

  // Default to 'other' if no specific type detected
  if (appealTypes.length === 0) {
    appealTypes.push('other');
  }

  return appealTypes;
}

/**
 * Extract tags from filename
 */
function extractTagsFromFilename(fileName: string): string[] {
  const tags: string[] = [];
  const lowerFileName = fileName.toLowerCase();

  // Extract common tags
  if (lowerFileName.includes('poa')) tags.push('plan-of-action');
  if (lowerFileName.includes('appeal')) tags.push('appeal');
  if (lowerFileName.includes('escalation')) tags.push('escalation');
  if (lowerFileName.includes('draft')) tags.push('draft');
  if (lowerFileName.includes('final')) tags.push('final');
  if (lowerFileName.includes('ed')) tags.push('edited');

  return tags;
}

/**
 * Download file from S3 to temporary location
 */
async function downloadFromS3(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const body = await response.Body?.transformToByteArray();

  if (!body) {
    throw new Error(`Failed to download ${s3Key} from S3`);
  }

  // Create temporary file
  const tempDir = os.tmpdir();
  const fileName = path.basename(s3Key);
  const tempPath = path.join(tempDir, fileName);

  fs.writeFileSync(tempPath, body);

  return tempPath;
}

/**
 * Get MIME type from filename
 */
function getMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.txt': 'text/plain',
    '.pdf': 'application/pdf',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Main migration function
 */
async function migrateTemplates() {
  console.log('🚀 Starting migration to Gemini File Search...\n');

  const migrationResults: Array<{
    fileName: string;
    s3Key: string;
    geminiFileId: string;
    appealTypes: string[];
    tags: string[];
    success: boolean;
    error?: string;
  }> = [];

  // Step 1: List existing Gemini files to avoid duplicates
  console.log('📋 Checking existing Gemini files...');
  const existingFiles = await listGeminiFiles();
  console.log(`Found ${existingFiles.length} existing files in Gemini\n`);

  // Step 2: Process each template document
  for (let i = 0; i < TEMPLATE_DOCUMENTS.length; i++) {
    const s3Key = TEMPLATE_DOCUMENTS[i];
    const fileName = path.basename(s3Key);

    console.log(`\n[${i + 1}/${TEMPLATE_DOCUMENTS.length}] Processing: ${fileName}`);

    try {
      // Check if already uploaded
      const existingFile = existingFiles.find((f) => f.displayName === fileName);
      if (existingFile) {
        console.log(`  ✅ Already exists in Gemini: ${existingFile.name}`);
        migrationResults.push({
          fileName,
          s3Key,
          geminiFileId: existingFile.name,
          appealTypes: detectAppealTypeFromFilename(fileName),
          tags: extractTagsFromFilename(fileName),
          success: true,
        });
        continue;
      }

      // Download from S3
      console.log(`  📥 Downloading from S3...`);
      const tempPath = await downloadFromS3(s3Key);

      // Detect appeal type and tags
      const appealTypes = detectAppealTypeFromFilename(fileName);
      const tags = extractTagsFromFilename(fileName);

      console.log(`  🏷️  Appeal types: ${appealTypes.join(', ')}`);
      console.log(`  🏷️  Tags: ${tags.join(', ')}`);

      // Upload to Gemini
      console.log(`  📤 Uploading to Gemini...`);
      const mimeType = getMimeType(fileName);
      const geminiFileId = await uploadFileToGemini(tempPath, mimeType, fileName);

      // Clean up temp file
      fs.unlinkSync(tempPath);

      console.log(`  ✅ Success! Gemini File ID: ${geminiFileId}`);

      migrationResults.push({
        fileName,
        s3Key,
        geminiFileId,
        appealTypes,
        tags,
        success: true,
      });

      // Rate limiting: wait 1 second between uploads
      await new Promise((resolve) => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      migrationResults.push({
        fileName,
        s3Key,
        geminiFileId: '',
        appealTypes: detectAppealTypeFromFilename(fileName),
        tags: extractTagsFromFilename(fileName),
        success: false,
        error: error.message,
      });
    }
  }

  // Step 3: Save configuration to DynamoDB
  console.log('\n\n📝 Saving configuration to DynamoDB...');

  const documents = migrationResults.map((result) => ({
    id: result.geminiFileId || `pending-${Date.now()}`,
    documentName: result.fileName,
    s3Key: result.s3Key,
    s3Bucket: BUCKET_NAME,
    fileType: result.fileName.endsWith('.docx') ? 'docx' : 'txt',
    appealTypes: result.appealTypes,
    uploadedAt: new Date().toISOString(),
    geminiFileId: result.geminiFileId,
    geminiUploadedAt: result.success ? new Date().toISOString() : undefined,
    embeddingStatus: result.success ? 'completed' : 'failed',
    enabled: result.success,
    tags: result.tags,
  }));

  const configData = {
    documents,
    settings: {
      similarityThreshold: 0.7,
      maxRelevantDocuments: 20,
      geminiCorpusId: 'gemini-file-search', // Placeholder - update when corpus API is available
      useGeminiRAG: true,
      geminiChunkingConfig: {
        maxTokensPerChunk: 1024,
        maxOverlapTokens: 128,
      },
    },
  };

  const configRecord = {
    configId: 'templates',
    version: Date.now(),
    status: 'active',
    configData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'Migrated templates to Gemini File Search',
  };

  await docClient.send(
    new PutCommand({
      TableName: ADMIN_CONFIG_TABLE,
      Item: configRecord,
    })
  );

  console.log('✅ Configuration saved to DynamoDB\n');

  // Step 4: Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(80));

  const successful = migrationResults.filter((r) => r.success).length;
  const failed = migrationResults.filter((r) => !r.success).length;

  console.log(`\n✅ Successful: ${successful}/${TEMPLATE_DOCUMENTS.length}`);
  console.log(`❌ Failed: ${failed}/${TEMPLATE_DOCUMENTS.length}`);

  if (failed > 0) {
    console.log('\n❌ Failed uploads:');
    migrationResults
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.fileName}: ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Migration complete!');
  console.log('='.repeat(80));
  console.log('\nNext steps:');
  console.log('1. Set NEXT_PUBLIC_USE_GEMINI_RAG=true in .env.local to enable Gemini RAG');
  console.log('2. Test appeal generation for each appeal type');
  console.log('3. Monitor CloudWatch logs for errors');
  console.log('4. After 1-2 weeks of stable operation, remove legacy embedding code');
}

// Run migration
migrateTemplates().catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
