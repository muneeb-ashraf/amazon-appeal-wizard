// ============================================================================
// TEST APPEAL API
// GET - Get specific test appeal
// DELETE - Delete test appeal
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminTestTable } from '@/lib/aws-config';
import { ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDb = getDynamoDbClient();

/**
 * GET /api/admin/test/[testId]
 * Get specific test appeal by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const testTable = getAdminTestTable();

    // Scan for test (in production, use GetCommand with proper key structure)
    const result = await dynamoDb.send(
      new ScanCommand({
        TableName: testTable,
        FilterExpression: 'testId = :testId',
        ExpressionAttributeValues: {
          ':testId': testId,
        },
        Limit: 1,
      })
    );

    const test = result.Items?.[0];

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      test,
    });
  } catch (error: any) {
    console.error('Error fetching test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/test/[testId]
 * Delete test appeal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const testTable = getAdminTestTable();

    // First, find the test to get its key
    const scanResult = await dynamoDb.send(
      new ScanCommand({
        TableName: testTable,
        FilterExpression: 'testId = :testId',
        ExpressionAttributeValues: {
          ':testId': testId,
        },
        Limit: 1,
      })
    );

    const test = scanResult.Items?.[0];

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Delete the test
    await dynamoDb.send(
      new DeleteCommand({
        TableName: testTable,
        Key: {
          testId: test.testId,
        },
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Test deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting test:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}
