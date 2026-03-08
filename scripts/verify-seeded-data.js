const dotenv = require('dotenv');
const path = require('path');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const client = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY,
  },
});

const dynamodb = DynamoDBDocumentClient.from(client);

async function verifyData() {
  console.log('\n🔍 Verifying seeded form-fields data in DynamoDB...\n');
  
  try {
    // Query for form-fields configs
    const result = await dynamodb.send(
      new QueryCommand({
        TableName: process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE,
        KeyConditionExpression: 'configId = :configId',
        ExpressionAttributeValues: {
          ':configId': 'form-fields',
        },
        ScanIndexForward: false, // Get latest first
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log('❌ No form-fields configurations found in DynamoDB');
      return;
    }

    console.log(`✅ Found ${result.Items.length} form-fields configuration(s)\n`);

    result.Items.forEach((item, index) => {
      console.log(`Configuration #${index + 1}:`);
      console.log(`   - Version: ${item.version}`);
      console.log(`   - Status: ${item.status}`);
      console.log(`   - Created: ${item.createdAt}`);
      console.log(`   - Created By: ${item.createdBy}`);
      
      if (item.configData) {
        console.log(`   - Appeal Types: ${item.configData.appealTypes?.length || 0}`);
        console.log(`   - Root Causes: ${item.configData.rootCauses?.length || 0}`);
        console.log(`   - Corrective Actions: ${item.configData.correctiveActions?.length || 0}`);
        console.log(`   - Preventive Measures: ${item.configData.preventiveMeasures?.length || 0}`);
        console.log(`   - Supporting Documents: ${item.configData.supportingDocuments?.length || 0}`);
      }
      console.log('');
    });

    // Show sample data from the active config
    const activeConfig = result.Items.find(item => item.status === 'active');
    if (activeConfig && activeConfig.configData) {
      console.log('📋 Sample data from active configuration:\n');
      
      if (activeConfig.configData.appealTypes?.length > 0) {
        console.log('First 3 Appeal Types:');
        activeConfig.configData.appealTypes.slice(0, 3).forEach(type => {
          console.log(`   - ${type.label} (${type.category})`);
        });
        console.log('');
      }

      if (activeConfig.configData.preventiveMeasures?.length > 0) {
        console.log('First 3 Preventive Measures:');
        activeConfig.configData.preventiveMeasures.slice(0, 3).forEach(measure => {
          console.log(`   - ${measure.text.substring(0, 60)}...`);
        });
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error querying DynamoDB:', error.message);
    console.error('Full error:', error);
  }
}

verifyData()
  .then(() => {
    console.log('✅ Verification complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
