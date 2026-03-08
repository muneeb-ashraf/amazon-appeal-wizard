// ============================================================================
// CREATE/UPDATE CONFIGURATION API ENDPOINT
// Create new draft configuration or update existing draft
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient } from '@/lib/aws-config';
import { getAdminConfigTable, getAdminHistoryTable } from '@/lib/config-loader';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import {
  ConfigType,
  ConfigurationRecord,
  ConfigurationHistoryRecord,
} from '@/lib/admin-config-types';

/**
 * POST /api/admin/config
 * Create new draft configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configType, configData, description, status = 'draft' } = body;

    // Validate required fields
    if (!configType || !configData) {
      return NextResponse.json(
        {
          success: false,
          error: 'configType and configData are required',
        },
        { status: 400 }
      );
    }

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

    // Validate status
    if (!['draft', 'active'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'status must be "draft" or "active"',
        },
        { status: 400 }
      );
    }

    const dynamoDb = getDynamoDbClient();
    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();
    const now = new Date().toISOString();
    const version = Date.now(); // Use timestamp as version number

    // Create configuration record
    const config: ConfigurationRecord = {
      configId: configType as ConfigType,
      version,
      status,
      configData,
      createdAt: now,
      updatedAt: now,
      createdBy: 'admin', // TODO: Get from auth context
      description: description || 'New configuration',
    };

    // Save configuration
    await dynamoDb.send(
      new PutCommand({
        TableName: configTable,
        Item: config,
      })
    );

    // Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      timestamp: version,
      configId: configType as ConfigType,
      version,
      action: 'created',
      changedBy: 'admin', // TODO: Get from auth context
      description: description || 'New configuration created',
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

    console.log(`✅ [Admin API] Created ${configType} config version ${version}`);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('[Admin API] Error creating config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/config
 * Update existing draft configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { configType, version, configData, description } = body;

    // Validate required fields
    if (!configType || !version || !configData) {
      return NextResponse.json(
        {
          success: false,
          error: 'configType, version, and configData are required',
        },
        { status: 400 }
      );
    }

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

    const dynamoDb = getDynamoDbClient();
    const configTable = getAdminConfigTable();
    const historyTable = getAdminHistoryTable();
    const now = new Date().toISOString();

    // Load existing config to get old data
    const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const existing = await dynamoDb.send(
      new GetCommand({
        TableName: configTable,
        Key: {
          configId: configType,
          version: version,
        },
      })
    );

    if (!existing.Item) {
      return NextResponse.json(
        {
          success: false,
          error: `Configuration not found: ${configType} version ${version}`,
        },
        { status: 404 }
      );
    }

    // Only drafts can be updated
    if (existing.Item.status !== 'draft') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only draft configurations can be updated',
        },
        { status: 400 }
      );
    }

    // Update configuration
    const config: ConfigurationRecord = {
      ...existing.Item,
      configData,
      updatedAt: now,
      description: description || existing.Item.description,
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: configTable,
        Item: config,
      })
    );

    // Create history record
    const historyRecord: ConfigurationHistoryRecord = {
      historyId: uuidv4(),
      timestamp: Date.now(),
      configId: configType as ConfigType,
      version,
      action: 'updated',
      changedBy: 'admin', // TODO: Get from auth context
      description: description || 'Configuration updated',
      changeDetails: {
        before: existing.Item.configData,
        after: configData,
      },
    };

    await dynamoDb.send(
      new PutCommand({
        TableName: historyTable,
        Item: historyRecord,
      })
    );

    console.log(`✅ [Admin API] Updated ${configType} config version ${version}`);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('[Admin API] Error updating config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update configuration',
      },
      { status: 500 }
    );
  }
}
