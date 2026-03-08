// ============================================================================
// CONFIGURATION ROLLBACK API
// POST - Rollback to a previous version
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getAdminHistoryTable } from '@/lib/aws-config';
import { QueryCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigType, ConfigurationRecord, ConfigurationHistoryRecord } from '@/lib/admin-config-types';
import { invalidateCache } from '@/lib/config-loader';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/config/[configType]/rollback
 * Rollback to a previous version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const { configType } = params;
    const body = await request.json();
    const { targetVersion } = body;

    if (!targetVersion) {
      return NextResponse.json(
        { success: false, error: 'Target version is required' },
        { status: 400 }
      );
    }

    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();

    // Get the target version
    const targetResult = await dynamoDb.send(
      new GetCommand({
        TableName: configTable,
        Key: {
          configId: configType,
          version: targetVersion,
        },
      })
    );

    const targetConfig = targetResult.Item as ConfigurationRecord | undefined;

    if (!targetConfig) {
      return NextResponse.json(
        { success: false, error: 'Target version not found' },
        { status: 404 }
      );
    }

    // Get current active version
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
          ':configType': configType,
        },
        Limit: 1,
      })
    );

    const currentActive = activeResult.Items?.[0] as ConfigurationRecord | undefined;

    // Create new version with target config data
    const newVersion = Date.now();
    const now = new Date().toISOString();
    const newConfig: ConfigurationRecord = {
      configId: configType as ConfigType,
      version: newVersion,
      status: 'active',
      configData: targetConfig.configData,
      createdAt: now,
      updatedAt: now,
      description: `Rolled back to version ${targetVersion}`,
      parentVersion: currentActive?.version,
    };

    // Archive current active version
    if (currentActive) {
      await dynamoDb.send(
        new PutCommand({
          TableName: configTable,
          Item: {
            ...currentActive,
            status: 'archived',
            updatedAt: now,
          },
        })
      );
    }

    // Save new active version
    await dynamoDb.send(
      new PutCommand({
        TableName: configTable,
        Item: newConfig,
      })
    );

    // Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      timestamp: newVersion,
      configId: configType as ConfigType,
      version: newVersion,
      action: 'rolled_back',
      description: `Rolled back to version ${targetVersion}`,
      changeDetails: {
        before: currentActive?.configData,
        after: targetConfig.configData,
      },
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    // Invalidate cache
    invalidateCache(configType as ConfigType);

    return NextResponse.json({
      success: true,
      newConfig,
      message: `Successfully rolled back to version ${targetVersion}`,
    });
  } catch (error: any) {
    console.error('Error rolling back configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to rollback configuration' },
      { status: 500 }
    );
  }
}
