// ============================================================================
// CONFIGURATION EXPORT API
// GET - Export configuration as JSON
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable } from '@/lib/aws-config';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigurationRecord } from '@/lib/admin-config-types';

const dynamoDb = getDynamoDbClient();

/**
 * GET /api/admin/config/[configType]/export?version=123456
 * Export configuration as downloadable JSON
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const { configType } = params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    const configTable = getAdminConfigTable();
    let config: ConfigurationRecord | undefined;

    if (version) {
      // Get specific version
      const result = await dynamoDb.send(
        new GetCommand({
          TableName: configTable,
          Key: {
            configId: configType,
            version: parseInt(version),
          },
        })
      );
      config = result.Item as ConfigurationRecord | undefined;
    } else {
      // Get active version
      const result = await dynamoDb.send(
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
      config = result.Items?.[0] as ConfigurationRecord | undefined;
    }

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      );
    }

    // Create export object with metadata
    const exportData = {
      exportedAt: new Date().toISOString(),
      configType,
      version: config.version,
      status: config.status,
      description: config.description,
      configData: config.configData,
      metadata: {
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
        createdBy: config.createdBy,
        parentVersion: config.parentVersion,
      },
    };

    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${configType}-v${config.version}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting configuration:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to export configuration' },
      { status: 500 }
    );
  }
}
