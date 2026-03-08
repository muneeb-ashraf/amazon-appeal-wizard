import 'dotenv/config';
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { writeFileSync } from 'fs';

const log: string[] = [];
const addLog = (msg: string) => {
  log.push(msg);
  writeFileSync('table-creation-log.txt', log.join('\n'));
};

async function main() {
  addLog('=== DynamoDB Table Creation ===');
  addLog(`Time: ${new Date().toISOString()}`);
  addLog(`Region: ${process.env.NEXT_PUBLIC_AWS_REGION}`);
  addLog(`Access Key: ${process.env.NEXT_AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);

  const client = new DynamoDBClient({
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
    credentials: {
      accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Table 1: admin-configurations
  try {
    addLog('\nCreating admin-configurations table...');
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
    addLog('✅ admin-configurations created!');
  } catch (e: any) {
    addLog(`❌ Error: ${e.message}`);
  }

  // Table 2: admin-configuration-history
  try {
    addLog('\nCreating admin-configuration-history table...');
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
    addLog('✅ admin-configuration-history created!');
  } catch (e: any) {
    addLog(`❌ Error: ${e.message}`);
  }

  // Table 3: admin-test-appeals
  try {
    addLog('\nCreating admin-test-appeals table...');
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
    addLog('✅ admin-test-appeals created!');
  } catch (e: any) {
    addLog(`❌ Error: ${e.message}`);
  }

  addLog('\n=== COMPLETE ===');
}

main().then(() => {
  console.log('Check table-creation-log.txt for results');
}).catch(e => {
  addLog(`FATAL ERROR: ${e.message}`);
});
