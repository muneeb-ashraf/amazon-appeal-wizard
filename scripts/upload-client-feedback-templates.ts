/**
 * Script to upload client feedback templates to S3
 *
 * This script uploads all DOCX templates from the client-feedback folder to S3
 * so they can be processed and their embeddings generated for AI training.
 *
 * Usage:
 * 1. Ensure AWS credentials are configured (.env.local)
 * 2. Run: npm run upload-feedback-templates
 * 3. Then run: npm run process-documents (to generate embeddings)
 */

// Load environment variables FIRST
import { config } from 'dotenv';
config({ path: '.env.local' });

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, getS3Bucket } from '../src/lib/aws-config';

const CLIENT_FEEDBACK_DIR = join(process.cwd(), 'client-feedback');

async function uploadClientFeedbackTemplates() {
  console.log('\n🚀 Starting to upload client feedback templates to S3...\n');
  console.log('DEBUG: S3 Bucket:', getS3Bucket());
  console.log('DEBUG: AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION);
  console.log('DEBUG: Source directory:', CLIENT_FEEDBACK_DIR);
  console.log('');

  // Get all DOCX files from client-feedback folder
  const files = readdirSync(CLIENT_FEEDBACK_DIR).filter(file =>
    file.toLowerCase().endsWith('.docx') &&
    (file.includes('POA') || file.includes('Appeal') || file.includes('Escalation'))
  );

  console.log(`📁 Found ${files.length} template files to upload\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const filePath = join(CLIENT_FEEDBACK_DIR, fileName);
    const s3Key = `documents/${fileName}`;

    try {
      console.log(`[${i + 1}/${files.length}] Uploading: ${fileName}...`);

      // Read file content
      const fileContent = readFileSync(filePath);

      // Upload to S3
      await s3Client.send(
        new PutObjectCommand({
          Bucket: getS3Bucket(),
          Key: s3Key,
          Body: fileContent,
          ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          Metadata: {
            uploadedBy: 'client-feedback-upload-script',
            uploadedAt: new Date().toISOString(),
            source: 'client-feedback'
          }
        })
      );

      console.log(`  ✓ Uploaded to: s3://${getS3Bucket()}/${s3Key}`);
      console.log(`  ✅ Success!\n`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed to upload ${fileName}:`, error);
      failCount++;
      console.log('');
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('📊 Upload Complete!');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📄 Total: ${files.length}`);
  console.log('═══════════════════════════════════════');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm run process-documents');
  console.log('2. This will generate embeddings for all templates');
  console.log('3. The AI will then use these templates for generating appeals\n');
}

// Run the script
uploadClientFeedbackTemplates().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
