// ============================================================================
// CONFIGURATION IMPORT API
// POST - Import configuration from JSON
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getAdminHistoryTable } from '@/lib/aws-config';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigType, ConfigurationRecord, ConfigurationHistoryRecord } from '@/lib/admin-config-types';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/config/[configType]/import
 * Import configuration from JSON file
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const { configType } = params;
    const body = await request.json();
    const { configData, description } = body;

    if (!configData) {
      return NextResponse.json(
        { success: false, error: 'Configuration data is required' },
        { status: 400 }
      );
    }

    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();

    // Create new draft version with imported data
    const newVersion = Date.now();
    const now = new Date().toISOString();
    const newConfig: ConfigurationRecord = {
      configId: configType as ConfigType,
      version: newVersion,
      status: 'draft',
      configData,
      createdAt: now,
      updatedAt: now,
      description: description || 'Imported from JSON file',
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
      description: description || 'Imported from JSON file',
      changeDetails: {
        after: configData,
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
      message: 'Configuration imported successfully as draft',
    });
  } catch (error: any) {
    console.error('Error importing configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import configuration' },
      { status: 500 }
    );
  }
}
