#!/usr/bin/env tsx
// ============================================================================
// VERIFY GEMINI MIGRATION
// ============================================================================

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { listGeminiFiles } from '../src/lib/gemini-rag-utils';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const ADMIN_CONFIG_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE || 'admin-configurations';

/**
 * Verify migration status
 */
async function verifyMigration() {
  console.log('🔍 Verifying Gemini migration status...\n');

  try {
    // Step 1: Check DynamoDB configuration
    console.log('📋 Checking DynamoDB configuration...');

    const configResult = await docClient.send(
      new GetCommand({
        TableName: ADMIN_CONFIG_TABLE,
        Key: {
          configId: 'templates',
        },
      })
    );

    if (!configResult.Item) {
      console.error('❌ No templates configuration found in DynamoDB');
      console.log('\nPlease run migration first: npm run migrate-to-gemini\n');
      process.exit(1);
    }

    const config = configResult.Item as any;
    const documents = config.configData?.documents || [];
    const settings = config.configData?.settings || {};

    console.log(`✅ Found configuration in DynamoDB`);
    console.log(`   Version: ${config.version}`);
    console.log(`   Status: ${config.status}`);
    console.log(`   Total documents: ${documents.length}`);
    console.log(`   Created at: ${config.createdAt}\n`);

    // Step 2: Check Gemini files
    console.log('📋 Checking Gemini File API...');

    const geminiFiles = await listGeminiFiles();
    console.log(`✅ Found ${geminiFiles.length} files in Gemini File API\n`);

    // Step 3: Verify document status
    console.log('📊 Document Status Summary:\n');

    const statusCounts = {
      total: documents.length,
      completed: 0,
      pending: 0,
      failed: 0,
      enabled: 0,
      disabled: 0,
      withGeminiId: 0,
      withoutGeminiId: 0,
    };

    documents.forEach((doc: any) => {
      if (doc.embeddingStatus === 'completed') statusCounts.completed++;
      if (doc.embeddingStatus === 'pending') statusCounts.pending++;
      if (doc.embeddingStatus === 'failed') statusCounts.failed++;
      if (doc.enabled) statusCounts.enabled++;
      if (!doc.enabled) statusCounts.disabled++;
      if (doc.geminiFileId) statusCounts.withGeminiId++;
      if (!doc.geminiFileId) statusCounts.withoutGeminiId++;
    });

    console.log(`Total documents:       ${statusCounts.total}`);
    console.log(`Completed:             ${statusCounts.completed} ✅`);
    console.log(`Pending:               ${statusCounts.pending} ⏳`);
    console.log(`Failed:                ${statusCounts.failed} ❌`);
    console.log(`Enabled:               ${statusCounts.enabled} ✅`);
    console.log(`Disabled:              ${statusCounts.disabled} ⚠️`);
    console.log(`With Gemini File ID:   ${statusCounts.withGeminiId} ✅`);
    console.log(`Without Gemini ID:     ${statusCounts.withoutGeminiId} ⚠️\n`);

    // Step 4: Check settings
    console.log('⚙️  Configuration Settings:\n');
    console.log(`Similarity Threshold:   ${settings.similarityThreshold || 'Not set'}`);
    console.log(`Max Relevant Documents: ${settings.maxRelevantDocuments || 'Not set'}`);
    console.log(`Gemini Corpus ID:       ${settings.geminiCorpusId || 'Not set'}`);
    console.log(`Use Gemini RAG:         ${settings.useGeminiRAG ? 'Yes ✅' : 'No ⚠️'}`);
    console.log(`Chunking Config:        ${settings.geminiChunkingConfig ? 'Configured ✅' : 'Not configured ⚠️'}\n`);

    // Step 5: Appeal type distribution
    console.log('📊 Appeal Type Distribution:\n');

    const appealTypeCounts: Record<string, number> = {};
    documents.forEach((doc: any) => {
      doc.appealTypes?.forEach((type: string) => {
        appealTypeCounts[type] = (appealTypeCounts[type] || 0) + 1;
      });
    });

    Object.entries(appealTypeCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type.padEnd(35)} ${count} templates`);
      });

    console.log('\n');

    // Step 6: List failed/pending documents
    const problematicDocs = documents.filter(
      (doc: any) => !doc.geminiFileId || doc.embeddingStatus !== 'completed'
    );

    if (problematicDocs.length > 0) {
      console.log('⚠️  Documents needing attention:\n');
      problematicDocs.forEach((doc: any) => {
        console.log(`  - ${doc.documentName}`);
        console.log(`    Status: ${doc.embeddingStatus}`);
        console.log(`    Gemini ID: ${doc.geminiFileId || 'Not uploaded'}`);
        console.log(`    Enabled: ${doc.enabled}\n`);
      });
    }

    // Step 7: Environment variable check
    console.log('🔐 Environment Variables:\n');

    const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const useGeminiRag = process.env.NEXT_PUBLIC_USE_GEMINI_RAG;

    console.log(`GOOGLE_GEMINI_API_KEY:      ${geminiApiKey ? '✅ Set' : '❌ Not set'}`);
    console.log(`NEXT_PUBLIC_USE_GEMINI_RAG: ${useGeminiRag || 'false'} ${useGeminiRag === 'true' ? '✅' : '⚠️'}\n`);

    // Step 8: Overall status
    console.log('='.repeat(80));
    console.log('✅ VERIFICATION SUMMARY');
    console.log('='.repeat(80));

    const allGood =
      statusCounts.completed === statusCounts.total &&
      statusCounts.withGeminiId === statusCounts.total &&
      geminiApiKey &&
      settings.geminiCorpusId;

    if (allGood) {
      console.log('\n✅ Migration verified successfully!');
      console.log('\nNext steps:');
      console.log('1. Set NEXT_PUBLIC_USE_GEMINI_RAG=true in .env.local');
      console.log('2. Test appeal generation for each appeal type');
      console.log('3. Monitor logs for errors');
      console.log('4. Deploy to production after testing\n');
    } else {
      console.log('\n⚠️  Migration incomplete or issues detected');
      console.log('\nAction items:');

      if (statusCounts.withoutGeminiId > 0) {
        console.log(`- Re-run migration for ${statusCounts.withoutGeminiId} documents without Gemini ID`);
      }

      if (statusCounts.failed > 0) {
        console.log(`- Investigate ${statusCounts.failed} failed documents`);
      }

      if (!geminiApiKey) {
        console.log('- Set GOOGLE_GEMINI_API_KEY in .env.local');
      }

      if (!settings.geminiCorpusId) {
        console.log('- Ensure geminiCorpusId is set in configuration');
      }

      console.log('\nRun migration again: npm run migrate-to-gemini\n');
    }

  } catch (error: any) {
    console.error('💥 Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyMigration().catch((error) => {
  console.error('💥 Error:', error);
  process.exit(1);
});
