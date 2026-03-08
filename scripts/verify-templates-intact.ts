// ============================================================================
// VERIFY TEMPLATES INTEGRITY
// ============================================================================
// This script verifies that the original templates in amazon-documents table
// are still intact with embeddings and text content for appeal generation
// ============================================================================

import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { getDynamoDbClient } from '../src/lib/aws-config';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { TEMPLATE_DOCUMENTS } from '../src/lib/embeddings-cache';

const DOCUMENTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE || 'amazon-documents';

async function verifyTemplatesIntact() {
  const output: string[] = [];

  try {
    output.push('='.repeat(80));
    output.push('VERIFICATION: Amazon Documents Table Integrity');
    output.push('='.repeat(80));

    const dynamodb = getDynamoDbClient();

    output.push(`\nTable: ${DOCUMENTS_TABLE}`);
    output.push(`\nScanning for all documents with embeddings...`);

    // Scan for all documents with completed embeddings
    const result = await dynamodb.send(
      new ScanCommand({
        TableName: DOCUMENTS_TABLE,
        FilterExpression: 'embeddingStatus = :status AND attribute_exists(embedding)',
        ExpressionAttributeValues: {
          ':status': 'completed',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      output.push('\n❌ CRITICAL: No documents found with completed embeddings!');
      output.push('Appeal generation will NOT work!');
    } else {
      output.push(`\n✅ Found ${result.Items.length} documents with completed embeddings`);

      // Check integrity of each document
      let validCount = 0;
      let missingTextCount = 0;
      let missingEmbeddingCount = 0;
      const issues: string[] = [];

      output.push('\n' + '-'.repeat(80));
      output.push('DOCUMENT INTEGRITY CHECK:');
      output.push('-'.repeat(80));

      for (const item of result.Items) {
        const docName = item.documentName || item.s3Key || 'Unknown';
        let isValid = true;

        // Check required fields
        if (!item.textContent || item.textContent.length === 0) {
          issues.push(`❌ ${docName}: Missing textContent`);
          missingTextCount++;
          isValid = false;
        }

        if (!item.embedding || !Array.isArray(item.embedding) || item.embedding.length === 0) {
          issues.push(`❌ ${docName}: Missing or invalid embedding`);
          missingEmbeddingCount++;
          isValid = false;
        }

        if (isValid) {
          validCount++;
          output.push(`✅ ${docName}`);
          output.push(`   - Text Content: ${item.textContent.length} chars`);
          output.push(`   - Embedding: ${item.embedding.length} dimensions`);
          output.push(`   - S3 Key: ${item.s3Key || 'N/A'}`);
          output.push(`   - Status: ${item.embeddingStatus}`);
        }
      }

      // Summary
      output.push('\n' + '='.repeat(80));
      output.push('INTEGRITY SUMMARY:');
      output.push('='.repeat(80));
      output.push(`Total Documents: ${result.Items.length}`);
      output.push(`Valid (Ready for Appeal Generation): ${validCount}`);
      output.push(`Missing Text Content: ${missingTextCount}`);
      output.push(`Missing/Invalid Embeddings: ${missingEmbeddingCount}`);

      if (issues.length > 0) {
        output.push('\n⚠️  ISSUES FOUND:');
        issues.forEach(issue => output.push(`   ${issue}`));
      }

      // Check against hardcoded list
      output.push('\n' + '='.repeat(80));
      output.push('COMPARISON WITH HARDCODED TEMPLATE LIST:');
      output.push('='.repeat(80));
      output.push(`Hardcoded Template Paths: ${TEMPLATE_DOCUMENTS.length}`);

      const s3Keys = result.Items.map(item => item.s3Key).filter(Boolean);
      const foundInHardcoded = TEMPLATE_DOCUMENTS.filter(path => s3Keys.includes(path));
      const notFoundInHardcoded = TEMPLATE_DOCUMENTS.filter(path => !s3Keys.includes(path));

      output.push(`Templates Found in DB: ${foundInHardcoded.length} / ${TEMPLATE_DOCUMENTS.length}`);

      if (notFoundInHardcoded.length > 0) {
        output.push(`\n⚠️  Templates in hardcoded list but NOT in DB:`);
        notFoundInHardcoded.forEach(path => output.push(`   - ${path}`));
      }

      // Check for extra templates in DB not in hardcoded list
      const extraTemplates = s3Keys.filter(key => !TEMPLATE_DOCUMENTS.includes(key));
      if (extraTemplates.length > 0) {
        output.push(`\n✅ Additional templates in DB (not in hardcoded list): ${extraTemplates.length}`);
        extraTemplates.forEach(key => output.push(`   + ${key}`));
      }

      // Final verdict
      output.push('\n' + '='.repeat(80));
      output.push('APPEAL GENERATION STATUS:');
      output.push('='.repeat(80));

      if (validCount >= 38) {
        output.push('✅ PASS: Templates are intact and ready for appeal generation');
        output.push(`   ${validCount} valid templates with embeddings available`);
        output.push('   Appeal generation will work correctly');
      } else if (validCount > 0) {
        output.push('⚠️  WARNING: Some templates may be missing or invalid');
        output.push(`   Only ${validCount} valid templates found (expected at least 38)`);
        output.push('   Appeal generation may have reduced effectiveness');
      } else {
        output.push('❌ FAIL: No valid templates available');
        output.push('   Appeal generation will NOT work!');
        output.push('   Need to re-process documents');
      }

      // Test embedding structure
      if (result.Items.length > 0 && result.Items[0].embedding) {
        const sampleEmbedding = result.Items[0].embedding;
        output.push('\n' + '-'.repeat(80));
        output.push('SAMPLE EMBEDDING CHECK:');
        output.push('-'.repeat(80));
        output.push(`Document: ${result.Items[0].documentName || result.Items[0].s3Key}`);
        output.push(`Embedding Type: ${Array.isArray(sampleEmbedding) ? 'Array' : typeof sampleEmbedding}`);
        output.push(`Embedding Length: ${sampleEmbedding.length} dimensions`);
        output.push(`First 5 values: [${sampleEmbedding.slice(0, 5).join(', ')}...]`);
        output.push(`Value types: ${typeof sampleEmbedding[0]}`);

        // Check if valid numbers
        const allNumbers = sampleEmbedding.every((val: any) => typeof val === 'number' && !isNaN(val));
        output.push(`All values are valid numbers: ${allNumbers ? '✅ Yes' : '❌ No'}`);
      }
    }

    output.push('\n' + '='.repeat(80));

  } catch (error: any) {
    output.push('\n❌ ERROR during verification:');
    output.push(error.message);
    output.push('\nFull error:');
    output.push(JSON.stringify(error, null, 2));
  }

  // Write to file
  const outputText = output.join('\n');
  const outputPath = path.join(__dirname, '..', 'template-integrity-report.txt');
  fs.writeFileSync(outputPath, outputText);

  // Also write to stderr for immediate viewing
  process.stderr.write(outputText + '\n');

  console.log(`\n📄 Report saved to: template-integrity-report.txt`);
}

verifyTemplatesIntact()
  .then(() => process.exit(0))
  .catch((error) => {
    const errorText = `Fatal error: ${error.message}\n${error.stack}`;
    fs.writeFileSync(path.join(__dirname, '..', 'template-verification-error.txt'), errorText);
    process.exit(1);
  });
