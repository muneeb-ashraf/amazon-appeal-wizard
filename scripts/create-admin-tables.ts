// ============================================================================
// CREATE ADMIN DYNAMODB TABLES SCRIPT
// Creates all 3 required admin panel tables using AWS SDK
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
 * Create admin-configurations table
 */
async function createConfigurationsTable() {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE || 'admin-configurations';

  console.log(`\n📝 Creating table: ${tableName}...`);

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists, skipping...`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'configId', AttributeType: 'S' },
      { AttributeName: 'version', AttributeType: 'N' },
      { AttributeName: 'status', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'configId', KeyType: 'HASH' },
      { AttributeName: 'version', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'status-updatedAt-index',
        KeySchema: [
          { AttributeName: 'configId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
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
  console.log(`   - Partition Key: configId (String)`);
  console.log(`   - Sort Key: version (Number)`);
  console.log(`   - GSI: status-updatedAt-index`);
  console.log(`   - Billing: Pay-per-request`);
}

/**
 * Create admin-configuration-history table
 */
async function createHistoryTable() {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_HISTORY_TABLE || 'admin-configuration-history';

  console.log(`\n📝 Creating table: ${tableName}...`);

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists, skipping...`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'historyId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' },
      { AttributeName: 'configId', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'historyId', KeyType: 'HASH' },
      { AttributeName: 'timestamp', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'configId-timestamp-index',
        KeySchema: [
          { AttributeName: 'configId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
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
  console.log(`   - Partition Key: historyId (String)`);
  console.log(`   - Sort Key: timestamp (Number)`);
  console.log(`   - GSI: configId-timestamp-index`);
  console.log(`   - Billing: Pay-per-request`);
}

/**
 * Create admin-test-appeals table
 */
async function createTestAppealsTable() {
  const tableName = process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_TEST_TABLE || 'admin-test-appeals';

  console.log(`\n📝 Creating table: ${tableName}...`);

  if (await tableExists(tableName)) {
    console.log(`✅ Table ${tableName} already exists, skipping...`);
    return;
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    AttributeDefinitions: [
      { AttributeName: 'testId', AttributeType: 'S' },
      { AttributeName: 'createdBy', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'testId', KeyType: 'HASH' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'createdBy-createdAt-index',
        KeySchema: [
          { AttributeName: 'createdBy', KeyType: 'HASH' },
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
  console.log(`   - Partition Key: testId (String)`);
  console.log(`   - GSI: createdBy-createdAt-index`);
  console.log(`   - Billing: Pay-per-request`);
}

/**
 * Main function
 */
async function createAllTables() {
  console.log('🚀 Creating DynamoDB tables for Admin Panel...');
  console.log('================================================\n');

  const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || 'us-east-1';
  console.log(`📍 Region: ${region}`);

  try {
    // Create all 3 tables
    await createConfigurationsTable();
    await createHistoryTable();
    await createTestAppealsTable();

    console.log('\n================================================');
    console.log('✅ All admin panel tables created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run seed-admin');
    console.log('2. Start server: npm run dev');
    console.log('3. Visit: http://localhost:3000/admin');
    console.log('\n💰 Expected monthly cost: ~$0.26');
    console.log('================================================\n');
  } catch (error: any) {
    console.error('\n❌ Error creating tables:', error.message);

    if (error.name === 'ResourceInUseException') {
      console.log('\n⚠️  Some tables already exist. This is OK!');
      console.log('Run: npm run seed-admin to populate data.\n');
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
createAllTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
