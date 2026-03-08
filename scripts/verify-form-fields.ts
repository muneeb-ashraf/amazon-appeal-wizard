// Verification script to check if form-fields config was seeded
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { getDynamoDbClient } from '../src/lib/aws-config';
import { getAdminConfigTable } from '../src/lib/config-loader';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

async function verifyFormFields() {
  const output: string[] = [];

  try {
    output.push('='.repeat(60));
    output.push('VERIFICATION: Form Fields Configuration');
    output.push('='.repeat(60));

    const dynamodb = getDynamoDbClient();
    const configTable = getAdminConfigTable();

    output.push(`\nTable: ${configTable}`);
    output.push(`\nQuerying for configId='form-fields'...`);

    const result = await dynamodb.send(
      new QueryCommand({
        TableName: configTable,
        KeyConditionExpression: 'configId = :configId',
        ExpressionAttributeValues: {
          ':configId': 'form-fields',
        },
      })
    );

    if (result.Items && result.Items.length > 0) {
      output.push(`\n✅ SUCCESS: Found ${result.Items.length} version(s) of form-fields config`);

      result.Items.forEach((item: any) => {
        output.push(`\n--- Version ${item.version} ---`);
        output.push(`Status: ${item.status}`);
        output.push(`Created: ${item.createdAt}`);
        output.push(`Created By: ${item.createdBy}`);

        if (item.configData) {
          const data = item.configData;
          output.push(`\nData Counts:`);
          output.push(`  - Appeal Types: ${data.appealTypes?.length || 0}`);
          output.push(`  - Root Causes: ${data.rootCauses?.length || 0}`);
          output.push(`  - Corrective Actions: ${data.correctiveActions?.length || 0}`);
          output.push(`  - Preventive Measures: ${data.preventiveMeasures?.length || 0}`);
          output.push(`  - Supporting Documents: ${data.supportingDocuments?.length || 0}`);
        }
      });
    } else {
      output.push('\n❌ NOT FOUND: No form-fields config exists in DynamoDB');
      output.push('\nThis means the seed script either:');
      output.push('1. Did not run successfully');
      output.push('2. Could not connect to DynamoDB');
      output.push('3. Had an error that was silently swallowed');
    }

    output.push('\n' + '='.repeat(60));

  } catch (error: any) {
    output.push('\n❌ ERROR during verification:');
    output.push(error.message);
    output.push('\nFull error:');
    output.push(JSON.stringify(error, null, 2));
  }

  // Write to file since console.log isn't working
  const outputText = output.join('\n');
  fs.writeFileSync(path.join(__dirname, '..', 'verification-result.txt'), outputText);

  // Also try stderr
  process.stderr.write(outputText + '\n');
}

verifyFormFields()
  .then(() => process.exit(0))
  .catch((error) => {
    const errorText = `Fatal error: ${error.message}\n${error.stack}`;
    fs.writeFileSync(path.join(__dirname, '..', 'verification-error.txt'), errorText);
    process.exit(1);
  });
