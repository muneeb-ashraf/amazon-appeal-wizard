// ============================================================================
// LIST CONFIGURATION VERSIONS API ENDPOINT
// List all versions of a configuration type
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient } from '@/lib/aws-config';
import { getAdminConfigTable } from '@/lib/config-loader';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigType, ConfigStatus } from '@/lib/admin-config-types';

/**
 * GET /api/admin/config/:configType/versions
 * List all versions of a configuration type
 * Query params: status (optional), limit (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const configType = params.configType as ConfigType;
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as ConfigStatus | null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

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
    const tableName = getAdminConfigTable();

    // Query parameters
    const queryParams: any = {
      TableName: tableName,
      KeyConditionExpression: 'configId = :configId',
      ExpressionAttributeValues: {
        ':configId': configType,
      },
      Limit: Math.min(limit, 100), // Max 100 items
      ScanIndexForward: false, // Most recent first
    };

    // Add status filter if provided
    if (status) {
      queryParams.FilterExpression = '#status = :status';
      queryParams.ExpressionAttributeNames = {
        '#status': 'status',
      };
      queryParams.ExpressionAttributeValues[':status'] = status;
    }

    const result = await dynamoDb.send(new QueryCommand(queryParams));

    return NextResponse.json({
      success: true,
      configs: result.Items || [],
      count: result.Items?.length || 0,
    });
  } catch (error: any) {
    console.error('[Admin API] Error listing config versions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list configuration versions',
      },
      { status: 500 }
    );
  }
}
