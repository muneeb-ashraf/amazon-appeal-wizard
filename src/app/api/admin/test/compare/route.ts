// ============================================================================
// TEST COMPARISON API
// POST - Compare two test appeals or active vs draft
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminTestTable, getAdminConfigTable } from '@/lib/aws-config';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigurationRecord } from '@/lib/admin-config-types';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/test/compare
 * Compare two test appeals or active config vs draft config
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId1, testId2, compareType } = body;

    if (compareType === 'active-vs-draft') {
      // Compare active configuration with draft configuration
      return await compareActiveVsDraft();
    }

    if (!testId1 || !testId2) {
      return NextResponse.json(
        { success: false, error: 'Two test IDs are required' },
        { status: 400 }
      );
    }

    const testTable = getAdminTestTable();

    // Fetch both tests
    const [result1, result2] = await Promise.all([
      dynamoDb.send(
        new ScanCommand({
          TableName: testTable,
          FilterExpression: 'testId = :testId',
          ExpressionAttributeValues: { ':testId': testId1 },
          Limit: 1,
        })
      ),
      dynamoDb.send(
        new ScanCommand({
          TableName: testTable,
          FilterExpression: 'testId = :testId',
          ExpressionAttributeValues: { ':testId': testId2 },
          Limit: 1,
        })
      ),
    ]);

    const test1 = result1.Items?.[0];
    const test2 = result2.Items?.[0];

    if (!test1 || !test2) {
      return NextResponse.json(
        { success: false, error: 'One or both tests not found' },
        { status: 404 }
      );
    }

    // Calculate differences
    const differences = calculateDifferences(
      test1.generatedAppeal,
      test2.generatedAppeal
    );

    return NextResponse.json({
      success: true,
      comparison: {
        test1,
        test2,
        differences,
      },
    });
  } catch (error: any) {
    console.error('Error comparing tests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to compare tests' },
      { status: 500 }
    );
  }
}

/**
 * Compare active configuration with draft configuration
 */
async function compareActiveVsDraft() {
  const configTable = getAdminConfigTable();

  // Get active AI instructions
  const activeResult = await dynamoDb.send(
    new QueryCommand({
      TableName: configTable,
      IndexName: 'status-updatedAt-index',
      KeyConditionExpression: '#status = :active',
      FilterExpression: '#configId = :configType',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#configId': 'configId',
      },
      ExpressionAttributeValues: {
        ':active': 'active',
        ':configType': 'ai-instructions',
      },
      Limit: 1,
    })
  );

  // Get draft AI instructions
  const draftResult = await dynamoDb.send(
    new QueryCommand({
      TableName: configTable,
      IndexName: 'status-updatedAt-index',
      KeyConditionExpression: '#status = :draft',
      FilterExpression: '#configId = :configType',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#configId': 'configId',
      },
      ExpressionAttributeValues: {
        ':draft': 'draft',
        ':configType': 'ai-instructions',
      },
      Limit: 1,
    })
  );

  const activeConfig = activeResult.Items?.[0] as ConfigurationRecord | undefined;
  const draftConfig = draftResult.Items?.[0] as ConfigurationRecord | undefined;

  if (!activeConfig && !draftConfig) {
    return NextResponse.json(
      { success: false, error: 'No active or draft configuration found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    comparison: {
      active: activeConfig,
      draft: draftConfig,
      differences: calculateConfigDifferences(
        activeConfig?.configData,
        draftConfig?.configData
      ),
    },
  });
}

/**
 * Calculate differences between two texts
 */
function calculateDifferences(text1: string, text2: string) {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  const differences = [];
  const maxLines = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i] || '';
    const line2 = lines2[i] || '';

    if (line1 !== line2) {
      differences.push({
        lineNumber: i + 1,
        type: line1 && line2 ? 'changed' : line1 ? 'removed' : 'added',
        value1: line1,
        value2: line2,
      });
    }
  }

  return differences;
}

/**
 * Calculate differences between two configuration objects
 */
function calculateConfigDifferences(config1: any, config2: any) {
  if (!config1 || !config2) {
    return [];
  }

  const differences = [];
  const json1 = JSON.stringify(config1, null, 2);
  const json2 = JSON.stringify(config2, null, 2);

  return calculateDifferences(json1, json2);
}
