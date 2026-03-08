const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

async function createTables() {
  console.log('🚀 Creating DynamoDB Admin Tables...\n');
  console.log(`Region: ${process.env.NEXT_PUBLIC_AWS_REGION}`);
  console.log(`Access Key: ${process.env.NEXT_AWS_ACCESS_KEY_ID?.substring(0, 10)}...\n`);

  const client = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
    },
  });

  // Table 1: admin-configurations
  try {
    console.log('📝 Creating admin-configurations table...');
    await client.send(new CreateTableCommand({
      TableName: 'admin-configurations',
      AttributeDefinitions: [
        { AttributeName: 'configId', AttributeType: 'S' },
        { AttributeName: 'version', AttributeType: 'N' },
        { AttributeName: 'status', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'configId', KeyType: 'HASH' },
        { AttributeName: 'version', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'status-updatedAt-index',
        KeySchema: [
          { AttributeName: 'configId', KeyType: 'HASH' },
          { AttributeName: 'status', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log('✅ admin-configurations created successfully!\n');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  admin-configurations already exists, skipping...\n');
    } else {
      console.error('❌ Error creating admin-configurations:', error.message, '\n');
    }
  }

  // Table 2: admin-configuration-history
  try {
    console.log('📝 Creating admin-configuration-history table...');
    await client.send(new CreateTableCommand({
      TableName: 'admin-configuration-history',
      AttributeDefinitions: [
        { AttributeName: 'historyId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'N' },
        { AttributeName: 'configId', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'historyId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' },
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'configId-timestamp-index',
        KeySchema: [
          { AttributeName: 'configId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log('✅ admin-configuration-history created successfully!\n');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  admin-configuration-history already exists, skipping...\n');
    } else {
      console.error('❌ Error creating admin-configuration-history:', error.message, '\n');
    }
  }

  // Table 3: admin-test-appeals
  try {
    console.log('📝 Creating admin-test-appeals table...');
    await client.send(new CreateTableCommand({
      TableName: 'admin-test-appeals',
      AttributeDefinitions: [
        { AttributeName: 'testId', AttributeType: 'S' },
        { AttributeName: 'createdBy', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
      ],
      KeySchema: [
        { AttributeName: 'testId', KeyType: 'HASH' },
      ],
      GlobalSecondaryIndexes: [{
        IndexName: 'createdBy-createdAt-index',
        KeySchema: [
          { AttributeName: 'createdBy', KeyType: 'HASH' },
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      }],
      BillingMode: 'PAY_PER_REQUEST',
    }));
    console.log('✅ admin-test-appeals created successfully!\n');
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log('⚠️  admin-test-appeals already exists, skipping...\n');
    } else {
      console.error('❌ Error creating admin-test-appeals:', error.message, '\n');
    }
  }

  console.log('================================================');
  console.log('✅ All admin panel tables created!');
  console.log('\nNext steps:');
  console.log('1. Add to .env.local:');
  console.log('   NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE=admin-configurations');
  console.log('   NEXT_PUBLIC_DYNAMODB_ADMIN_HISTORY_TABLE=admin-configuration-history');
  console.log('   NEXT_PUBLIC_DYNAMODB_ADMIN_TEST_TABLE=admin-test-appeals');
  console.log('2. Run: npm run seed-admin');
  console.log('3. Start server: npm run dev');
  console.log('4. Visit: http://localhost:3000/admin');
  console.log('================================================\n');
}

createTables().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
