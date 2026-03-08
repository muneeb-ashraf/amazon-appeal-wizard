// ============================================================================
// ACTIVATE CONFIGURATION API ENDPOINT
// Make a draft configuration active (and archive previous active)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient } from '@/lib/aws-config';
import { getAdminConfigTable, getAdminHistoryTable, invalidateCache } from '@/lib/config-loader';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  ConfigType,
  ConfigurationRecord,
  ConfigurationHistoryRecord,
} from '@/lib/admin-config-types';

/**
 * POST /api/admin/config/:configType/activate
 * Activate a specific version (archive current active, activate new one)
 * Body: { version: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const configType = params.configType as ConfigType;
    const body = await request.json();
    const { version } = body;

    // Validate config type
    if (!['ai-instructions', 'form-fields', 'templates'].includes(configType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid config type: ${configType}`,
        },
        { status: 400 }
      );
    }

    // Validate version
    if (!version || typeof version !== 'number') {
      return NextResponse.json(
        {
          success: false,
          error: 'version is required and must be a number',
        },
        { status: 400 }
      );
    }

    const dynamoDb = getDynamoDbClient();
    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();
    const now = new Date().toISOString();

    // Step 1: Get the config to activate
    const targetConfig = await dynamoDb.send(
      new GetCommand({
        TableName: configTable,
        Key: {
          configId: configType,
          version: version,
        },
      })
    );

    if (!targetConfig.Item) {
      return NextResponse.json(
        {
          success: false,
          error: `Configuration not found: ${configType} version ${version}`,
        },
        { status: 404 }
      );
    }

    // Step 2: Find current active config (if any)
    const activeConfigs = await dynamoDb.send(
      new QueryCommand({
        TableName: configTable,
        IndexName: 'status-updatedAt-index',
        KeyConditionExpression: 'configId = :configId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':configId': configType,
          ':status': 'active',
        },
        Limit: 1,
      })
    );

    // Step 3: Archive current active config
    if (activeConfigs.Items && activeConfigs.Items.length > 0) {
      const currentActive = activeConfigs.Items[0];

      await dynamoDb.send(
        new UpdateCommand({
          TableName: configTable,
          Key: {
            configId: configType,
            version: currentActive.version,
          },
          UpdateExpression: 'SET #status = :archived, updatedAt = :now',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':archived': 'archived',
            ':now': now,
          },
        })
      );

      console.log(`📦 [Admin API] Archived ${configType} version ${currentActive.version}`);
    }

    // Step 4: Activate new config
    await dynamoDb.send(
      new UpdateCommand({
        TableName: configTable,
        Key: {
          configId: configType,
          version: version,
        },
        UpdateExpression: 'SET #status = :active, updatedAt = :now',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':active': 'active',
          ':now': now,
        },
      })
    );

    // Step 5: Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      timestamp: Date.now(),
      configId: configType,
      version,
      action: 'activated',
      changedBy: 'admin', // TODO: Get from auth context
      description: `Activated version ${version}`,
      changeDetails: {
        before: activeConfigs.Items?.[0] || null,
        after: { ...targetConfig.Item, status: 'active', updatedAt: now },
      },
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    // Step 6: Invalidate cache
    invalidateCache(configType);

    console.log(`✅ [Admin API] Activated ${configType} version ${version}`);

    return NextResponse.json({
      success: true,
      message: `Configuration ${configType} version ${version} activated successfully`,
      config: { ...targetConfig.Item, status: 'active', updatedAt: now },
    });
  } catch (error: any) {
    console.error('[Admin API] Error activating config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to activate configuration',
      },
      { status: 500 }
    );
  }
}
