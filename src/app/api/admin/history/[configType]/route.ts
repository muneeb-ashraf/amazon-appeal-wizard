// ============================================================================
// CONFIGURATION HISTORY API ENDPOINT
// Get change history for a configuration type
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient } from '@/lib/aws-config';
import { getAdminHistoryTable } from '@/lib/config-loader';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { ConfigType } from '@/lib/admin-config-types';

/**
 * GET /api/admin/history/:configType
 * Get change history for a configuration type
 * Query params: limit (optional, default 50)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const configType = params.configType as ConfigType;
    const searchParams = request.nextUrl.searchParams;
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
    const historyTable = getAdminHistoryTable();

    // Query history by config type
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: historyTable,
        IndexName: 'configId-timestamp-index',
        KeyConditionExpression: 'configId = :configId',
        ExpressionAttributeValues: {
          ':configId': configType,
        },
        Limit: Math.min(limit, 100),
        ScanIndexForward: false, // Most recent first
      })
    );

    return NextResponse.json({
      success: true,
      history: result.Items || [],
      count: result.Items?.length || 0,
    });
  } catch (error: any) {
    console.error('[Admin API] Error fetching history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch configuration history',
      },
      { status: 500 }
    );
  }
}
