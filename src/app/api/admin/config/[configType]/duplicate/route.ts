// ============================================================================
// CONFIGURATION DUPLICATE API
// POST - Duplicate a version as a new draft
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getAdminHistoryTable } from '@/lib/aws-config';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigType, ConfigurationRecord, ConfigurationHistoryRecord } from '@/lib/admin-config-types';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/config/[configType]/duplicate
 * Duplicate a version as a new draft
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const { configType } = params;
    const body = await request.json();
    const { sourceVersion, description } = body;

    if (!sourceVersion) {
      return NextResponse.json(
        { success: false, error: 'Source version is required' },
        { status: 400 }
      );
    }

    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();

    // Get the source version
    const sourceResult = await dynamoDb.send(
      new GetCommand({
        TableName: configTable,
        Key: {
          configId: configType,
          version: sourceVersion,
        },
      })
    );

    const sourceConfig = sourceResult.Item as ConfigurationRecord | undefined;

    if (!sourceConfig) {
      return NextResponse.json(
        { success: false, error: 'Source version not found' },
        { status: 404 }
      );
    }

    // Create new draft version
    const newVersion = Date.now();
    const now = new Date().toISOString();
    const newConfig: ConfigurationRecord = {
      configId: configType as ConfigType,
      version: newVersion,
      status: 'draft',
      configData: sourceConfig.configData,
      createdAt: now,
      updatedAt: now,
      description: description || `Duplicate of version ${sourceVersion}`,
      parentVersion: sourceVersion,
    };

    // Save new draft version
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
      action: 'created',
      description: `Duplicated from version ${sourceVersion}`,
      changeDetails: {
        after: sourceConfig.configData,
      },
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: 'Configuration duplicated successfully',
    });
  } catch (error: any) {
    console.error('Error duplicating configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to duplicate configuration' },
      { status: 500 }
    );
  }
}
