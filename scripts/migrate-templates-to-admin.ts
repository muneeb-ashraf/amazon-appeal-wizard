// ============================================================================
// TEMPLATE MIGRATION SCRIPT
// ============================================================================
// This script migrates existing templates from the amazon-documents table
// to the admin-configurations table so they appear in the admin dashboard.
//
// What this script does:
// - Scans amazon-documents table for all documents with embeddingStatus='completed'
// - Transforms each document to TemplateDocumentConfig format
// - Infers appeal types from document filenames
// - Creates a TemplatesConfig record in admin-configurations table
// - Creates a history record
//
// IMPORTANT: This is READ-ONLY for amazon-documents table - no data is modified
// Appeal generation continues using amazon-documents table unchanged
//
// Usage: npm run migrate-templates
// ============================================================================

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { getDynamoDbClient } from '../src/lib/aws-config';
import { getAdminConfigTable, getAdminHistoryTable } from '../src/lib/config-loader';
import { PutCommand, ScanCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import type {
  ConfigurationRecord,
  ConfigurationHistoryRecord,
  TemplatesConfig,
  TemplateDocumentConfig,
} from '../src/lib/admin-config-types';

const DOCUMENTS_TABLE = process.env.NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE || 'amazon-documents';
const S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET || 'amazon-appeal-documents';

/**
 * Infer appeal types from document filename
 * Maps common keywords in filenames to appeal type categories
 */
function inferAppealTypes(filename: string): string[] {
  const lower = filename.toLowerCase();
  const types: string[] = [];

  // Seller suspension types
  if (lower.includes('inauthentic') || lower.includes('supply chain')) {
    types.push('inauthenticity-supply-chain');
  }

  if (lower.includes('ip ') || lower.includes('copyright') || lower.includes('trademark') || lower.includes('patent')) {
    types.push('intellectual-property');
  }

  if (lower.includes('review') || lower.includes('manipulation') || lower.includes('code of conduct')) {
    types.push('seller-code-conduct');
  }

  if (lower.includes('related account') || lower.includes('multiple account')) {
    types.push('related-account');
  }

  if (lower.includes('drop') && lower.includes('ship')) {
    types.push('drop-shipping');
  }

  if (lower.includes('restricted') || lower.includes('disease') || lower.includes('supplement')) {
    types.push('restricted-products');
  }

  if (lower.includes('used sold as new') || lower.includes('odr') || lower.includes('condition')) {
    types.push('used-sold-as-new');
  }

  if (lower.includes('cancel') || lower.includes('shipment') || lower.includes('velocity')) {
    types.push('high-cancellation');
  }

  if (lower.includes('fair pricing') || lower.includes('pricing')) {
    types.push('marketplace-pricing');
  }

  if (lower.includes('verif') || lower.includes('utility')) {
    types.push('verification-failure');
  }

  if (lower.includes('hack') || lower.includes('compromised')) {
    types.push('account-compromised');
  }

  if (lower.includes('fraud') || lower.includes('deceptive')) {
    types.push('deceptive-activity');
  }

  // Listing issues
  if (lower.includes('detail page') || lower.includes('abuse')) {
    types.push('detail-page-abuse');
  }

  if (lower.includes('category') || lower.includes('approval')) {
    types.push('category-approval');
  }

  if (lower.includes('brand registry')) {
    types.push('brand-registry');
  }

  // KDP/ACX/Merch
  if (lower.includes('kdp') || lower.includes('acx') || lower.includes('publishing')) {
    types.push('kdp-acx-merch');
  }

  if (lower.includes('merch') || lower.includes('mba')) {
    types.push('merch-termination');
  }

  // FBA
  if (lower.includes('fba') || lower.includes('unsuitable inventory')) {
    types.push('fba-shipping');
  }

  // Relay
  if (lower.includes('relay')) {
    types.push('amazon-relay');
  }

  // Safety
  if (lower.includes('safety')) {
    types.push('safety-suspension');
  }

  // Variation
  if (lower.includes('variation')) {
    types.push('variation-abuse');
  }

  // If no matches, return 'other'
  return types.length > 0 ? types : ['other'];
}

/**
 * Extract tags from filename
 */
function extractTags(filename: string): string[] {
  const tags: string[] = [];
  const lower = filename.toLowerCase();

  // Extract common patterns
  if (lower.includes('escalation')) tags.push('escalation');
  if (lower.includes('poa')) tags.push('plan-of-action');
  if (lower.match(/ed \(\d+\)/)) tags.push('edited');
  if (lower.includes('draft')) tags.push('draft');
  if (lower.includes('final')) tags.push('final');
  if (lower.includes('appeal')) tags.push('appeal');
  if (lower.includes('funds')) tags.push('funds');
  if (lower.includes('etsy')) tags.push('etsy');
  if (lower.includes('ebay')) tags.push('ebay');
  if (lower.includes('template')) tags.push('template');

  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Generate description from filename
 */
function generateDescription(filename: string): string {
  // Remove path prefix and extension
  let name = filename.replace('documents/', '').replace(/\.docx?$/i, '');

  // Clean up common patterns
  name = name.replace(/\s+ed\s+\(\d+\)/g, ''); // Remove " ed (1)" patterns
  name = name.replace(/\s+\(\d+\)/g, ''); // Remove " (1)" patterns

  return `Template: ${name}`;
}

/**
 * Scan amazon-documents table for all completed embeddings
 */
async function scanDocumentsTable(dynamodb: any): Promise<any[]> {
  console.log(`\n🔍 Scanning ${DOCUMENTS_TABLE} table for completed embeddings...`);

  try {
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
      console.log('⚠️  No documents with completed embeddings found');
      return [];
    }

    console.log(`✅ Found ${result.Items.length} documents with completed embeddings`);
    return result.Items;
  } catch (error: any) {
    console.error('❌ Error scanning documents table:', error.message);
    throw error;
  }
}

/**
 * Transform DynamoDB document to TemplateDocumentConfig format
 */
function transformDocument(item: any): TemplateDocumentConfig {
  const documentName = item.documentName || (item.s3Key ? item.s3Key.split('/').pop() : 'Unknown');
  const s3Key = item.s3Key || '';

  return {
    id: item.documentId || uuidv4(),
    documentName,
    s3Key,
    s3Bucket: item.s3Bucket || S3_BUCKET,
    fileType: s3Key.endsWith('.txt') ? 'txt' : 'docx',
    appealTypes: inferAppealTypes(documentName),
    uploadedAt: item.uploadedAt || item.createdAt || new Date().toISOString(),
    uploadedBy: item.uploadedBy || 'legacy-system',
    processedAt: item.processedAt || new Date().toISOString(),
    embeddingStatus: 'completed',
    enabled: true,
    tags: extractTags(documentName),
    description: generateDescription(s3Key || documentName),
  };
}

/**
 * Archive existing active templates configs
 */
async function archiveExistingActiveConfigs(dynamodb: any, configTable: string) {
  console.log('🗄️  Archiving existing active template configurations...');

  try {
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: configTable,
        KeyConditionExpression: 'configId = :configId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':configId': 'templates',
          ':status': 'active',
        },
      })
    );

    if (result.Items && result.Items.length > 0) {
      console.log(`   Found ${result.Items.length} active config(s) to archive`);

      for (const item of result.Items) {
        await dynamodb.send(
          new UpdateCommand({
            TableName: configTable,
            Key: {
              configId: item.configId,
              version: item.version,
            },
            UpdateExpression: 'SET #status = :archived, updatedAt = :now',
            ExpressionAttributeNames: {
              '#status': 'status',
            },
            ExpressionAttributeValues: {
              ':archived': 'archived',
              ':now': new Date().toISOString(),
            },
          })
        );
        console.log(`   ✅ Archived version ${item.version}`);
      }
    } else {
      console.log('   No active configs found to archive');
    }
  } catch (error: any) {
    console.warn('   ⚠️  Error archiving configs (continuing anyway):', error.message);
  }
}

/**
 * Main migration function
 */
async function migrateTemplates() {
  console.log('\n🚀 Migrating Templates to Admin Dashboard...');
  console.log('================================================\n');

  const dynamodb = getDynamoDbClient();
  const configTable = getAdminConfigTable();
  const historyTable = getAdminHistoryTable();

  try {
    // Step 1: Scan amazon-documents table
    const documents = await scanDocumentsTable(dynamodb);

    if (documents.length === 0) {
      console.log('\n⚠️  No documents to migrate. Exiting.');
      return;
    }

    // Step 2: Transform documents to TemplateDocumentConfig format
    console.log(`\n📝 Transforming ${documents.length} documents...`);
    const templateDocuments: TemplateDocumentConfig[] = documents.map(transformDocument);

    // Show sample of inferred appeal types
    console.log('\n📋 Sample of inferred appeal types:');
    templateDocuments.slice(0, 5).forEach((doc) => {
      console.log(`   ${doc.documentName}`);
      console.log(`      Appeal Types: ${doc.appealTypes.join(', ')}`);
      console.log(`      Tags: ${doc.tags?.join(', ') || 'none'}`);
    });

    // Step 3: Create TemplatesConfig
    const templatesConfig: TemplatesConfig = {
      documents: templateDocuments,
      settings: {
        similarityThreshold: 0.75,
        maxRelevantDocuments: 5,
      },
    };

    // Step 4: Archive existing active configs
    await archiveExistingActiveConfigs(dynamodb, configTable);
    console.log('');

    // Step 5: Create configuration record
    const now = new Date().toISOString();
    const version = Date.now();

    const configRecord: ConfigurationRecord<TemplatesConfig> = {
      configId: 'templates',
      version,
      configData: templatesConfig,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: 'migration-script',
      description: `Migrated ${templateDocuments.length} existing templates from ${DOCUMENTS_TABLE} table`,
    };

    // Step 6: Save to admin-configurations table
    await dynamodb.send(
      new PutCommand({
        TableName: configTable,
        Item: configRecord,
      })
    );

    console.log(`\n✅ Saved Templates configuration (v${version}) to ${configTable}`);
    console.log(`   - Total Documents: ${templateDocuments.length}`);
    console.log(`   - Similarity Threshold: ${templatesConfig.settings.similarityThreshold}`);
    console.log(`   - Max Relevant Documents: ${templatesConfig.settings.maxRelevantDocuments}`);
    console.log(`   - Status: active`);

    // Step 7: Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      configId: 'templates',
      version,
      timestamp: Date.now(),
      action: 'created',
      changedBy: 'migration-script',
      description: `Migrated ${templateDocuments.length} templates from ${DOCUMENTS_TABLE} table`,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    console.log(`✅ Saved history record to ${historyTable}`);

    // Step 8: Show appeal type breakdown
    console.log('\n📊 Appeal Type Distribution:');
    const appealTypeCounts: Record<string, number> = {};
    templateDocuments.forEach((doc) => {
      doc.appealTypes.forEach((type) => {
        appealTypeCounts[type] = (appealTypeCounts[type] || 0) + 1;
      });
    });

    Object.entries(appealTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count} documents`);
      });

    console.log('\n================================================');
    console.log('✅ Migration completed successfully!');
    console.log(`\nMigrated ${templateDocuments.length} templates to admin dashboard`);
    console.log('\nNext Steps:');
    console.log('1. Access admin panel: http://localhost:3000/admin/templates');
    console.log('2. Verify template count shows ' + templateDocuments.length + ' (not "000")');
    console.log('3. Check template list displays all documents');
    console.log('4. Appeal generation continues using amazon-documents table\n');
  } catch (error: any) {
    console.error('\n❌ Error migrating templates:', error.message);

    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Table not found. Please run:');
      console.error('   npm run create-admin-tables\n');
    } else {
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

// Run the script
migrateTemplates()
  .then(() => {
    console.log('✅ Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
