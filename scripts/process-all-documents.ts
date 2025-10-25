/**
 * Script to process all 38 reference documents
 * 
 * Usage:
 * 1. Upload all your DOCX files to S3: s3://your-bucket/documents/
 * 2. Update the documentKeys array below with your S3 keys
 * 3. Run: npx ts-node scripts/process-all-documents.ts
 * 
 * This script will:
 * - Convert each DOCX to TXT
 * - Create embeddings for each document
 * - Store results in DynamoDB
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });

import { processDocument } from '../src/lib/document-processor';
import { createEmbedding } from '../src/lib/openai-utils';
import { dynamoDbClient, DOCUMENTS_TABLE } from '../src/lib/aws-config';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

// All 38 template documents in S3
const documentKeys = [
  'documents/Bianca Boersma Appeal - rev2.docx',
  'documents/BR POA I (1).docx',
  'documents/Copy of Robert Harvey Appeal used sold as new - 7-29-2020.docx',
  'documents/Draft POA I - Maaz Ahmed - Inauthentic ed 1.docx',
  'documents/Draft POA I - Maaz Ahmed - Inauthentic rev ed.docx',
  'documents/Draft POA II- FLOLEAF NATURALS - Restricted product ed.docx',
  'documents/Draft POA II- FLOLEAF NATURALS - Restricted product.docx',
  'documents/Erica Sutton hacked POA (2).docx',
  'documents/Escalation I - Jennifer Smith - KDP ed (2).docx',
  'documents/Escalation I - Saarang Ayaz - Inauthenticity ed (1).docx',
  'documents/Escalation II - Mark Hanson - ODR Listing Removal ed (1).docx',
  'documents/Etsy Appeal I - Heartwood Wands. IP ed (3).docx',
  'documents/Evan Michalski eBay Inauthentic Appeal Draft (2).docx',
  'documents/FINAL Iron Brothers Supplements - Letter to US Legal Dept. ed (1).docx',
  'documents/Funds Appeal I -  Nova777 ed (1) (1).docx',
  'documents/Jan Pohnan fair pricing IV (2).docx',
  'documents/Kindpowers, LLC Appeal - SP III.docx',
  'documents/POA I - Adrian Vizireanu. Brand Registry ed (1) (1).docx',
  'documents/POA I - Believegroup - Cancelled Shipments ed (2).docx',
  'documents/POA I - Botir Rustamov ed (1) (1).docx',
  'documents/POA I - Brillias Boutique. Sales Velocity ed (1).docx',
  'documents/POA I - Carlos Shah - Restricted - 4-1-2024 ed (1).docx',
  'documents/POA I - Dimitri Jesse - Merc ed (3).docx',
  'documents/POA I - GenieMedia ed (10).docx',
  'documents/POA I - Kent Jameson - ACX ed (1).docx',
  'documents/POA I - Paula Guran - Copyright ed (1) (1).docx',
  'documents/POA I - Petru Nedelku - KDP ed (1).docx',
  'documents/POA I - Sandadi Reddy. FBA suspension ed (1) (1).docx',
  'documents/POA I - Tina Perebikosvky Inauthentic - 10-3-2025 ed.docx',
  'documents/POA I - Tina Perebikosvky Inauthentic - 10-3-2025.docx',
  'documents/POA I - Viking Investments - Verification ed.docx',
  'documents/POA I - Zachary Munoz - Review Manipulation ed (1) (2).docx',
  'documents/POA II - AK - Unsuitable inventory ed (5).docx',
  'documents/POA II - SA - Dropshipping ed (1).docx',
  'documents/POA III - FM -  Disease Claims ed (1).docx',
  'documents/POA III -Tina Perebikovsky Trademark Infringement - 8-31-2024 ed (1).docx',
  'documents/POA US.docx',
  'documents/Sanjay Gupta Appeal detail page abuse - 8-31-2020.docx',
  'documents/Template - EU Design POA.docx',
];

async function processAllDocuments() {
  console.log(`\n🚀 Starting to process ${documentKeys.length} documents...\n`);
  
  // Debug: Check if environment variables are loaded
  console.log('DEBUG: S3 Bucket:', process.env.NEXT_PUBLIC_AWS_S3_BUCKET);
  console.log('DEBUG: AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION);
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < documentKeys.length; i++) {
    const key = documentKeys[i];
    const documentName = key.split('/').pop() || key;

    try {
      console.log(`[${i + 1}/${documentKeys.length}] Processing: ${documentName}...`);

      // Step 1: Convert DOCX to TXT
      const { textContent, textS3Key } = await processDocument(key);
      console.log(`  ✓ Converted to TXT: ${textS3Key}`);

      // Step 2: Create embedding
      const embedding = await createEmbedding(textContent);
      console.log(`  ✓ Created embedding (${embedding.length} dimensions)`);

      // Step 3: Save to DynamoDB
      const documentId = uuidv4();
      const documentRecord = {
        id: documentId,
        documentName: documentName,
        s3Key: key,
        textS3Key: textS3Key,
        s3Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
        fileType: 'docx',
        uploadedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
        embeddingStatus: 'completed',
        textContent: textContent, // Store full text content for AI generation
        embedding: embedding,
        metadata: {
          originalKey: key,
          processedBy: 'batch-script',
        },
      };

      await dynamoDbClient.send(
        new PutCommand({
          TableName: DOCUMENTS_TABLE,
          Item: documentRecord,
        })
      );
      console.log(`  ✓ Saved to DynamoDB: ${documentId}`);
      console.log(`  ✅ Success!\n`);

      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to process ${documentName}:`, error);
      failCount++;
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Processing Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📄 Total: ${documentKeys.length}`);
  console.log('═══════════════════════════════════════\n');
}

// Run the script
processAllDocuments().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
