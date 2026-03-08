// ============================================================================
// TEST HISTORY API
// GET - List all test appeals
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminTestTable } from '@/lib/aws-config';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDb = getDynamoDbClient();

/**
 * GET /api/admin/test/history
 * List all test appeals
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const testTable = getAdminTestTable();

    // Scan test appeals (in production, consider using a GSI for better performance)
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: testTable,
        Limit: Math.min(limit, 100),
      })
    );

    // Sort by creation date descending
    const tests = (result.Items || []).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      success: true,
      tests,
      count: tests.length,
    });
  } catch (error: any) {
    console.error('Error fetching test history:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test history' },
      { status: 500 }
    );
  }
}
