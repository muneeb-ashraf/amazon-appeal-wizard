// ============================================================================
// CREATE APPEALS DYNAMODB TABLE SCRIPT
// Creates the admin-appeals table for storing generated appeals
// ============================================================================

import 'dotenv/config';
import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

// Initialize DynamoDB client
const getDynamoDBClient = () => {
  const config: any = {
    region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1',
  };

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ||
                      process.env.NEXT_AWS_ACCESS_KEY_ID ||
                      process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID;

  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ||
                          process.env.NEXT_AWS_SECRET_ACCESS_KEY ||
                          process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY;

  if (accessKeyId && secretAccessKey) {
    config.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }

  return new DynamoDBClient(config);
};

const dynamodb = getDynamoDBClient();

/**
 * Check if table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return false;
    }
    throw error;
  }
}

/**
 * Create admin-appeals table
 */
async function createAppealsTable() {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_APPEALS_TABLE || 'admin-appeals';

  console.log(`\n📝 Creating table: ${tableName}...`);

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists, skipping...`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'appealId', AttributeType: 'S' },
      { AttributeName: 'status', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'appealId', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'status-createdAt-index',
        KeySchema: [
          { AttributeName: 'status', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  });

  await dynamodb.send(command);
  console.log(`✅ Table ${tableName} created successfully!`);
  console.log(`   - Partition Key: appealId (String UUID)`);
  console.log(`   - GSI: status-createdAt-index`);
  console.log(`   - Billing: Pay-per-request`);
  console.log(`\nTable Schema:`);
  console.log(`   - appealId: String (UUID)`);
  console.log(`   - createdAt: String (ISO timestamp)`);
  console.log(`   - updatedAt: String (ISO timestamp)`);
  console.log(`   - status: String ("completed" | "failed" | "pending")`);
  console.log(`   - formData: Map (user input data)`);
  console.log(`   - generatedAppeal: String (full appeal text)`);
  console.log(`   - generationMetadata: Map (AI metadata)`);
  console.log(`   - uploadedDocuments: List<Map> (optional)`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating Appeals DynamoDB Table...');
  console.log('================================================\n');

  const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  console.log(`📍 Region: ${region}`);

  try {
    await createAppealsTable();

    console.log('\n================================================');
    console.log('✅ Appeals table created successfully!');
    console.log('\nNext steps:');
    console.log('1. Update .env.local with table name if needed');
    console.log('2. Start server: npm run dev');
    console.log('3. Generate appeals to populate the table');
    console.log('\n💰 Expected monthly cost: ~$0.09 (minimal usage)');
    console.log('================================================\n');
  } catch (error: any) {
    console.error('\n❌ Error creating table:', error.message);

    if (error.name === 'ResourceInUseException') {
      console.log('\n⚠️  Table already exists. This is OK!');
    } else if (error.name === 'UnrecognizedClientException' || error.message?.includes('credentials')) {
      console.error('\n⚠️  AWS credentials issue detected.');
      console.error('Please ensure your .env.local has valid AWS credentials:');
      console.error('  - AWS_ACCESS_KEY_ID');
      console.error('  - AWS_SECRET_ACCESS_KEY');
      console.error('  - AWS_REGION (or NEXT_PUBLIC_AWS_REGION)\n');
    } else {
      console.error('\nFull error:', error);
    }

    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
