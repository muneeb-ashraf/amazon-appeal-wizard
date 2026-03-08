// ============================================================================
// ADMIN DATABASE SEED SCRIPT
// ============================================================================
// This is the PRIMARY script for seeding the admin panel database with
// comprehensive AI instructions extracted from openai-utils.ts APPEAL_SECTIONS.
//
// What this script does:
// - Extracts all 5 sections with comprehensive default instructions (~18,500 chars)
// - Seeds them into the admin-configurations DynamoDB table
// - Creates a history record in admin-configurations-history
// - These can be customized later via the admin dashboard
//
// The APPEAL_SECTIONS in openai-utils.ts serves as:
// 1. The source of truth for default instructions
// 2. A fallback if the database config is missing
//
// Usage: npm run seed-admin
// ============================================================================

import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local explicitly
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { getDynamoDbClient } from '../src/lib/aws-config';
import { getAdminConfigTable, getAdminHistoryTable } from '../src/lib/config-loader';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { APPEAL_SECTIONS } from '../src/lib/openai-utils';
import type {
  ConfigurationRecord,
  ConfigurationHistoryRecord,
  AIInstructionsConfig,
  AppealTypeGuidance,
} from '../src/lib/admin-config-types';

/**
 * Extract appeal type guidance from openai-utils.ts getAppealTypeGuidance()
 * Source: lines 700-748 in openai-utils.ts
 */
function extractAppealTypeGuidance(): AppealTypeGuidance[] {
  // Map from getAppealTypeGuidance() function
  const guidanceMap: Record<string, string> = {
    'inauthenticity-supply-chain': 'Focus on: Supply chain documentation, invoice authenticity verification, supplier communication records, product sourcing timeline.',
    'intellectual-property': 'Focus on: Trademark/copyright/patent documentation, authorization letters from rights owners, product sourcing verification, cease-and-desist responses.',
    'seller-code-conduct': 'Focus on: Policy violations identified, training implemented, account practices review, compliance verification process.',
    'related-account': 'Focus on: Account relationships explanation, business justification, operational independence, financial separation.',
    'drop-shipping': 'Focus on: Inventory documentation, supplier agreements, fulfillment process, order handling procedures.',
    'restricted-products': 'Focus on: Product categorization review, approval documentation, compliance verification, restricted items removal.',
    'used-sold-as-new': 'Focus on: Product condition verification, quality control process, supplier agreements, return handling procedures.',
    'high-cancellation': 'Focus on: Cancellation root causes, inventory accuracy improvements, fulfillment process upgrades, customer communication.',
    'marketplace-pricing': 'Focus on: Pricing strategy review, competitive analysis justification, value proposition documentation, pricing policy compliance.',
    'verification-failure': 'Focus on: Document authenticity, identity verification, business registration, address confirmation.',
    'account-compromised': 'Focus on: Security breach timeline, unauthorized access evidence, account recovery steps, security enhancement measures.',
    'deceptive-activity': 'Focus on: Activity investigation findings, policy compliance review, operational changes, transparency improvements.',
    'detail-page-abuse': 'Focus on: Listing accuracy review, content verification, image authenticity, detail page guidelines compliance.',
    'category-approval': 'Focus on: Category requirements documentation, qualification verification, compliance evidence, approval criteria satisfaction.',
    'kdp-acx-merch': 'Focus on: Content originality verification, intellectual property clearance, publishing guidelines compliance, trademark usage review.',
    'fba-shipping': 'Focus on: Shipping performance metrics, carrier documentation, delivery tracking, customer communication improvements.',
    'amazon-relay': 'Focus on: Load compliance, carrier documentation, delivery performance, DOT regulation adherence.',
    'brand-registry': 'Focus on: Trademark documentation, brand ownership verification, enrollment requirements, intellectual property evidence.',
    'safety-suspension': 'Focus on: Product safety testing, certification documentation, compliance verification, hazard assessment.',
    'variation-abuse': 'Focus on: Variation relationship accuracy, parent-child structure compliance, attribute consistency, listing guidelines adherence.',
    'merch-termination': 'Focus on: Design originality, trademark clearance, content policy compliance, intellectual property verification.',
    'other': 'Focus on: Specific violation documentation, policy compliance review, corrective actions taken, preventive measures implemented.',
  };

  return Object.entries(guidanceMap).map(([appealType, guidanceText]) => {
    // Extract emphasis points from "Focus on:" section
    const focusMatch = guidanceText.match(/Focus on: (.+)/);
    const emphasizePoints = focusMatch?.[1]
      ?.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0) || [];

    return {
      appealType,
      additionalInstructions: guidanceText,
      emphasize: emphasizePoints,
      avoid: [],
      toneAdjustments: {
        formality: 'professional' as const,
        urgency: 'high' as const,
      },
    };
  });
}

/**
 * Generate comprehensive system prompt for each section
 */
function generateSystemPrompt(section: typeof APPEAL_SECTIONS[0]): string {
  const basePrompt = `You are an expert Amazon seller appeal writer with deep knowledge of Amazon's policies and successful appeal strategies.

You have access to successful Amazon appeal template documents. Study their style, depth, and structure CAREFULLY.

Generate ONLY the ${section.name} section of the appeal letter.

CRITICAL INSTRUCTIONS:
- Follow the detailed instructions in the user prompt exactly
- Use a professional, concise tone appropriate for Amazon Seller Performance
- Be specific and avoid placeholder text or generic statements
- Match the depth and specificity of successful template documents
- Use proper Amazon terminology for the appeal type (e.g., "Intellectual Property" not "IP infringement")`;

  // Add section-specific scope instructions
  if (section.id === 1) {
    // Opening & Introduction
    return basePrompt + `

SCOPE: OPENING STATEMENT & ACKNOWLEDGMENT
- Professional greeting (if appropriate based on appeal type)
- Case number reference (if provided)
- Clear acknowledgment of the suspension/issue
- Brief context setting for the appeal`;
  }

  if (section.id === 2) {
    // Root Cause Analysis
    return basePrompt + `

SCOPE: ROOT CAUSE DIAGNOSIS ONLY
- Explain WHAT went wrong (the problem, not the solution)
- Explain WHY it happened (underlying causes)
- Describe HOW you discovered the problem
- DO NOT include corrective actions (that's Section 3)
- DO NOT include preventive measures (that's Section 4)

INTELLECTUAL PROPERTY LANGUAGE:
- Use full proper nouns: "Intellectual Property" not "IP"
- "trademark" not "TM"
- "copyright" not "(c)"`;
  }

  if (section.id === 3) {
    // Corrective Actions
    return basePrompt + `

SCOPE: COMPLETED CORRECTIVE ACTIONS ONLY
- Use PAST TENSE for all actions (e.g., "I removed", "I implemented", "I completed")
- Describe one-time fixes that have already been completed
- Reference uploaded documents with specific details (dates, quantities, etc.)
- DO NOT include ongoing practices or future plans (that's Section 4)

DOCUMENT REFERENCES:
- Always reference supporting documents when available
- Include specific details from documents (e.g., "Invoice #12345 dated March 1, 2024")`;
  }

  if (section.id === 4) {
    // Preventive Measures
    return basePrompt + `

SCOPE: ONGOING PREVENTIVE MEASURES ONLY
- Use PRESENT TENSE for ongoing practices (e.g., "I conduct", "I maintain", "I review")
- Use FUTURE TENSE for new processes being implemented (e.g., "I will conduct", "I will review")
- Describe violation-specific routines (NOT generic business practices)
- Link measures directly to the root cause and corrective actions
- Include 10-15 specific preventive measures organized by 2-4 violation-specific categories

CRITICAL DISTINCTION FROM SECTION 3:
- Section 3 (Corrective Actions): One-time fixes already completed (PAST tense)
- Section 4 (Preventive Measures): Ongoing practices to prevent recurrence (PRESENT/FUTURE tense)`;
  }

  if (section.id === 5) {
    // Closing & Signature
    return basePrompt + `

SCOPE: CLOSING & SIGNATURE
- Professional closing statement
- Commitment to compliance
- Contact information

SIGNATURE FORMAT REQUIREMENTS:
- Full Name (required)
- Store Name (required)
- Merchant Token ID (MANDATORY - use exact value provided)
- Email (required)
- Phone (if provided)`;
  }

  return basePrompt;
}

/**
 * Create AI Instructions configuration from the hardcoded APPEAL_SECTIONS
 */
function createAIInstructionsFromHardcodedDefaults(): AIInstructionsConfig {
  console.log(`📝 Extracting ${APPEAL_SECTIONS.length} sections from openai-utils.ts...`);

  return {
    sections: APPEAL_SECTIONS.map((section) => ({
      id: `section-${section.id}`,
      name: section.name,
      description: `${section.name}: Generates the ${section.name.toLowerCase()} portion of the appeal letter with comprehensive instructions and proper scope boundaries.`,
      systemPrompt: generateSystemPrompt(section),
      userPromptTemplate: section.prompt,
      maxTokens: section.maxTokens,
      temperature: 0.85,
      order: section.id,
    })),
    appealTypeGuidance: extractAppealTypeGuidance(),
    globalSettings: {
      defaultModel: 'gpt-4o-mini',
      defaultTemperature: 0.85,
      maxRetries: 3,
      timeoutMs: 25000,
    },
  };
}

/**
 * Archive all existing active AI Instructions configs
 */
async function archiveExistingActiveConfigs(dynamodb: any, configTable: string) {
  console.log('🗄️  Archiving existing active configurations...');

  try {
    // Query for all active ai-instructions configs
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: configTable,
        KeyConditionExpression: 'configId = :configId',
        FilterExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':configId': 'ai-instructions',
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
 * Seed the AI Instructions configuration
 */
async function seedAIInstructions() {
  console.log('\n🚀 Seeding AI Instructions from openai-utils.ts defaults...');
  console.log('================================================\n');

  const dynamodb = getDynamoDbClient();
  const configTable = getAdminConfigTable();
  const historyTable = getAdminHistoryTable();

  try {
    // Archive existing active configs first
    await archiveExistingActiveConfigs(dynamodb, configTable);
    console.log('');

    const configData = createAIInstructionsFromHardcodedDefaults();
    const now = new Date().toISOString();
    const version = 1;

    // Create configuration record
    const configRecord: ConfigurationRecord<AIInstructionsConfig> = {
      configId: 'ai-instructions',
      version,
      configData,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: 'system-seed',
      description: 'Initial seed from openai-utils.ts APPEAL_SECTIONS - Contains comprehensive default instructions',
    };

    // Save to configurations table
    await dynamodb.send(
      new PutCommand({
        TableName: configTable,
        Item: configRecord,
      })
    );

    console.log(`✅ Saved AI Instructions configuration (v${version}) to ${configTable}`);
    console.log(`   - Sections: ${configData.sections.length}`);
    console.log(`   - Appeal Type Guidance: ${configData.appealTypeGuidance.length} entries`);
    console.log(`   - Status: active`);

    // Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      configId: 'ai-instructions',
      version,
      timestamp: Date.now(),
      action: 'created',
      changedBy: 'system-seed',
      description: `Initial seed from openai-utils.ts - Seeded ${configData.sections.length} sections with comprehensive default prompts`,
    };

    await dynamodb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    console.log(`✅ Saved history record to ${historyTable}`);

    console.log('\n================================================');
    console.log('✅ AI Instructions seeded successfully!');
    console.log('\nSeeded Configuration Details:');
    console.log(`   Model: ${configData.globalSettings?.defaultModel || 'gpt-4o-mini'}`);
    console.log(`   Temperature: ${configData.globalSettings?.defaultTemperature || 0.85}`);
    console.log(`   Max Retries: ${configData.globalSettings?.maxRetries || 3}`);
    console.log(`   Timeout: ${configData.globalSettings?.timeoutMs || 25000}ms`);
    console.log('\nSeeded Sections:');
    configData.sections.forEach((section) => {
      console.log(`   ${section.order}. ${section.name}`);
      console.log(`      - Max Tokens: ${section.maxTokens}`);
      console.log(`      - Prompt Length: ${section.userPromptTemplate.length} characters`);
      console.log(`      - System Prompt Length: ${section.systemPrompt.length} characters`);
    });

    console.log('\nNext Steps:');
    console.log('1. Access admin panel: http://localhost:3000/admin');
    console.log('2. Go to "AI Instructions" in the sidebar');
    console.log('3. You will see all 5 sections with the comprehensive default prompts');
    console.log('4. Customize the prompts as needed for your specific use case');
    console.log('5. Test changes using the "Testing" page before activating\n');

  } catch (error: any) {
    console.error('\n❌ Error seeding AI Instructions:', error.message);

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
seedAIInstructions()
  .then(() => {
    console.log('✅ Seed complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
