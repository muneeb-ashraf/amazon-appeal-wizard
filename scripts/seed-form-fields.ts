// ============================================================================
// FORM FIELDS SEED SCRIPT
// ============================================================================
// This script seeds the admin panel database with comprehensive form field
// defaults extracted from constants.ts.
//
// What this script does:
// - Extracts all form field data from constants.ts:
//   * 22 Appeal Types with category mapping
//   * 30+ Root Causes mapped to appeal types
//   * 40+ Corrective Actions with categories
//   * 50+ Preventive Measures with categories (including kdpPublishing)
//   * 17 Supporting Document Types with categories
// - Seeds them into the admin-configurations DynamoDB table
// - Creates a history record in admin-configuration-history
// - These can be customized later via the admin dashboard
//
// Usage: npm run seed-form-fields
// ============================================================================

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { getDynamoDbClient } from '../src/lib/aws-config';
import { getAdminConfigTable, getAdminHistoryTable } from '../src/lib/config-loader';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  APPEAL_TYPES,
  ROOT_CAUSES,
  CORRECTIVE_ACTIONS,
  PREVENTIVE_MEASURES,
  SUPPORTING_DOCUMENT_TYPES,
} from '../src/lib/constants';
import type {
  ConfigurationRecord,
  ConfigurationHistoryRecord,
  FormFieldsConfig,
  AppealTypeConfig,
  RootCauseConfig,
  CorrectiveActionConfig,
  PreventiveMeasureConfig,
  SupportingDocumentConfig,
} from '../src/lib/admin-config-types';

/**
 * Map appeal type values to their categories
 */
function getAppealTypeCategory(
  value: string
): 'seller-suspension' | 'listing-issue' | 'kdp-acx' | 'fba' | 'relay' | 'other' {
  // Seller suspension types
  if (
    [
      'inauthenticity-supply-chain',
      'intellectual-property',
      'seller-code-conduct',
      'related-account',
      'drop-shipping',
      'restricted-products',
      'used-sold-as-new',
      'high-cancellation',
      'marketplace-pricing',
      'verification-failure',
      'account-compromised',
      'deceptive-activity',
      'safety-suspension',
      'variation-abuse',
    ].includes(value)
  ) {
    return 'seller-suspension';
  }

  // Listing issues
  if (
    ['detail-page-abuse', 'category-approval', 'brand-registry'].includes(value)
  ) {
    return 'listing-issue';
  }

  // KDP/ACX/Merch
  if (['kdp-acx-merch', 'merch-termination'].includes(value)) {
    return 'kdp-acx';
  }

  // FBA
  if (value === 'fba-shipping') {
    return 'fba';
  }

  // Amazon Relay
  if (value === 'amazon-relay') {
    return 'relay';
  }

  // Other
  return 'other';
}

/**
 * Transform appeal types from constants to AppealTypeConfig format
 */
function transformAppealTypes(): AppealTypeConfig[] {
  console.log(`📋 Transforming ${APPEAL_TYPES.length} appeal types...`);

  return APPEAL_TYPES.map((type, index) => ({
    value: type.value,
    label: type.label,
    enabled: true,
    order: index + 1,
    category: getAppealTypeCategory(type.value),
  }));
}

/**
 * Transform root causes from nested object to flat array
 */
function transformRootCauses(): RootCauseConfig[] {
  console.log(`📋 Transforming root causes...`);

  const rootCauses: RootCauseConfig[] = [];
  let globalOrder = 1;

  Object.entries(ROOT_CAUSES).forEach(([appealType, causes]) => {
    causes.forEach((cause, causeIndex) => {
      rootCauses.push({
        id: `rc-${appealType}-${causeIndex}`,
        text: cause,
        appealTypes: [appealType],
        enabled: true,
        order: globalOrder++,
      });
    });
  });

  console.log(`   Created ${rootCauses.length} root causes`);
  return rootCauses;
}

/**
 * Map corrective action category to appeal types
 */
function getCorrectiveActionAppealTypes(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    general: ['*'], // All appeal types
    inauthenticity: ['inauthenticity-supply-chain'],
    intellectualProperty: ['intellectual-property'],
    codeOfConduct: ['seller-code-conduct'],
    restrictedProducts: ['restricted-products'],
    verificationFailure: ['verification-failure'],
    relatedAccount: ['related-account'],
    detailPageAbuse: ['detail-page-abuse'],
    categoryApproval: ['category-approval'],
    kdpAcxMerch: ['kdp-acx-merch', 'merch-termination'],
    relay: ['amazon-relay'],
    merch: ['merch-termination'],
  };

  return categoryMap[category] || ['*'];
}

/**
 * Transform corrective actions from nested object to flat array
 */
function transformCorrectiveActions(): CorrectiveActionConfig[] {
  console.log(`📋 Transforming corrective actions...`);

  const actions: CorrectiveActionConfig[] = [];
  let globalOrder = 1;

  Object.entries(CORRECTIVE_ACTIONS).forEach(([category, actionList]) => {
    actionList.forEach((action, actionIndex) => {
      actions.push({
        id: `ca-${category}-${actionIndex}`,
        text: action,
        category,
        appealTypes: getCorrectiveActionAppealTypes(category),
        enabled: true,
        order: globalOrder++,
      });
    });
  });

  console.log(`   Created ${actions.length} corrective actions`);
  return actions;
}

/**
 * Map preventive measure category to appeal types
 */
function getPreventiveMeasureAppealTypes(category: string): string[] {
  const categoryMap: Record<string, string[]> = {
    sourcing: ['inauthenticity-supply-chain', 'intellectual-property'],
    listing: ['detail-page-abuse', 'category-approval', 'restricted-products'],
    reviewManipulation: ['seller-code-conduct'],
    operations: ['*'], // General operations apply to all
    // KDP Publishing sub-categories
    contentCopyright: ['kdp-acx-merch', 'merch-termination'],
    coverDesign: ['kdp-acx-merch', 'merch-termination'],
    titleMetadata: ['kdp-acx-merch', 'merch-termination'],
    contentQuality: ['kdp-acx-merch', 'merch-termination'],
    authorVerification: ['kdp-acx-merch', 'merch-termination'],
  };

  return categoryMap[category] || ['*'];
}

/**
 * Transform preventive measures from nested object to flat array
 * Handles special kdpPublishing nested structure
 */
function transformPreventiveMeasures(): PreventiveMeasureConfig[] {
  console.log(`📋 Transforming preventive measures...`);

  const measures: PreventiveMeasureConfig[] = [];
  let globalOrder = 1;

  Object.entries(PREVENTIVE_MEASURES).forEach(([category, value]) => {
    // Check if this is the kdpPublishing nested object
    if (category === 'kdpPublishing' && typeof value === 'object' && !Array.isArray(value)) {
      // Handle nested kdpPublishing categories
      Object.entries(value).forEach(([subCategory, measureList]) => {
        if (Array.isArray(measureList)) {
          measureList.forEach((measure, measureIndex) => {
            measures.push({
              id: `pm-kdp-${subCategory}-${measureIndex}`,
              text: measure,
              category: subCategory, // Use sub-category name
              appealTypes: getPreventiveMeasureAppealTypes(subCategory),
              enabled: true,
              order: globalOrder++,
            });
          });
        }
      });
    } else if (Array.isArray(value)) {
      // Handle regular categories
      value.forEach((measure, measureIndex) => {
        measures.push({
          id: `pm-${category}-${measureIndex}`,
          text: measure,
          category,
          appealTypes: getPreventiveMeasureAppealTypes(category),
          enabled: true,
          order: globalOrder++,
        });
      });
    }
  });

  console.log(`   Created ${measures.length} preventive measures`);
  return measures;
}

/**
 * Transform supporting document types
 */
function transformSupportingDocuments(): SupportingDocumentConfig[] {
  console.log(`📋 Transforming ${SUPPORTING_DOCUMENT_TYPES.length} supporting document types...`);

  return SUPPORTING_DOCUMENT_TYPES.map((doc, index) => ({
    value: doc.value,
    label: doc.label,
    appealTypes: ['*'], // All by default
    enabled: true,
    order: index + 1,
  }));
}

/**
 * Create Form Fields configuration from constants.ts
 */
function createFormFieldsFromConstants(): FormFieldsConfig {
  console.log(`\n📝 Extracting form fields from constants.ts...`);

  const appealTypes = transformAppealTypes();
  const rootCauses = transformRootCauses();
  const correctiveActions = transformCorrectiveActions();
  const preventiveMeasures = transformPreventiveMeasures();
  const supportingDocuments = transformSupportingDocuments();

  console.log(`\n✅ Transformation complete:`);
  console.log(`   - Appeal Types: ${appealTypes.length}`);
  console.log(`   - Root Causes: ${rootCauses.length}`);
  console.log(`   - Corrective Actions: ${correctiveActions.length}`);
  console.log(`   - Preventive Measures: ${preventiveMeasures.length}`);
  console.log(`   - Supporting Documents: ${supportingDocuments.length}`);

  return {
    appealTypes,
    rootCauses,
    correctiveActions,
    preventiveMeasures,
    supportingDocuments,
  };
}

/**
 * Archive all existing active form-fields configs
 */
async function archiveExistingActiveConfigs(dynamodb: any, configTable: string) {
  console.log('🗄️  Archiving existing active configurations...');

  try {
    // Query for all active form-fields configs
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: configTable,
        KeyConditionExpression: 'configId = :configId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':configId': 'form-fields',
          ':status': 'active',
        },
      })
    );

    if (result.Items && result.Items.length > 0) {
      console.log(`   Found ${result.Items.length} active config(s) to archive`);

      // Archive each active config
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
 * Seed the Form Fields configuration
 */
async function seedFormFields() {
  console.log('\n🚀 Seeding Form Fields from constants.ts defaults...');
  console.log('================================================\n');

  const dynamodb = getDynamoDbClient();
  const configTable = getAdminConfigTable();
  const historyTable = getAdminHistoryTable();

  try {
    // Archive existing active configs first
    await archiveExistingActiveConfigs(dynamodb, configTable);
    console.log('');

    const configData = createFormFieldsFromConstants();
    const now = new Date().toISOString();
    const version = Date.now();

    // Create configuration record
    const configRecord: ConfigurationRecord<FormFieldsConfig> = {
      configId: 'form-fields',
      version,
      configData,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system-seed',
      description: 'Initial seed from constants.ts - Contains comprehensive default form fields',
    };

    // Save to configurations table
    await dynamodb.send(
      new PutCommand({
        TableName: configTable,
        Item: configRecord,
      })
    );

    console.log(`\n✅ Saved Form Fields configuration (v${version}) to ${configTable}`);
    console.log(`   - Appeal Types: ${configData.appealTypes.length}`);
    console.log(`   - Root Causes: ${configData.rootCauses.length}`);
    console.log(`   - Corrective Actions: ${configData.correctiveActions.length}`);
    console.log(`   - Preventive Measures: ${configData.preventiveMeasures.length}`);
    console.log(`   - Supporting Documents: ${configData.supportingDocuments.length}`);
    console.log(`   - Status: active`);

    // Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      configId: 'form-fields',
      version,
      timestamp: Date.now(),
      action: 'created',
      changedBy: 'system-seed',
      description: `Initial seed from constants.ts - Seeded ${configData.appealTypes.length} appeal types, ${configData.rootCauses.length} root causes, ${configData.correctiveActions.length} corrective actions, ${configData.preventiveMeasures.length} preventive measures, ${configData.supportingDocuments.length} supporting documents`,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    console.log(`✅ Saved history record to ${historyTable}`);

    console.log('\n================================================');
    console.log('✅ Form Fields seeded successfully!');
    console.log('\nCategory Breakdown:');

    // Show appeal type categories
    const categoryCounts = configData.appealTypes.reduce((acc, type) => {
      const cat = type.category || 'other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nAppeal Type Categories:');
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count} types`);
    });

    console.log('\nNext Steps:');
    console.log('1. Access admin panel: http://localhost:3000/admin/form-fields');
    console.log('2. You will see all form field tabs populated with data:');
    console.log('   - Appeal Types (22 types)');
    console.log('   - Root Causes (30+ causes)');
    console.log('   - Corrective Actions (40+ actions)');
    console.log('   - Preventive Measures (50+ measures)');
    console.log('   - Supporting Documents (17 types)');
    console.log('3. Customize the fields as needed for your specific use case');
    console.log('4. Changes will reflect immediately in the main form\n');

  } catch (error: any) {
    console.error('\n❌ Error seeding Form Fields:', error.message);

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
seedFormFields()
  .then(() => {
    console.log('✅ Seed complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
