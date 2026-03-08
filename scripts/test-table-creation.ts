// Simple test script for table creation
import 'dotenv/config';
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';

const config: any = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'eu-north-1',
};

const accessKeyId = process.env.NEXT_AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.NEXT_AWS_SECRET_ACCESS_KEY;

if (accessKeyId && secretAccessKey) {
  config.credentials = { accessKeyId, secretAccessKey };
}

const client = new DynamoDBClient(config);

async function createTable() {
  try {
    console.log('Starting table creation...');
    console.log('Region:', config.region);
    console.log('Access Key:', accessKeyId ? accessKeyId.substring(0, 8) + '...' : 'Not found');

    const result = await client.send(new CreateTableCommand({
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
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-updatedAt-index',
          KeySchema: [
            { AttributeName: 'configId', KeyType: 'HASH' },
            { AttributeName: 'status', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
    }));

    console.log('SUCCESS! Table created:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('ERROR:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

createTable();
