import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminAppealsTable } from '@/lib/aws-config';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import type { AdminAppealRecord } from '@/types';

interface RouteParams {
  params: {
    appealId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { appealId } = params;

    const dynamodb = getDynamoDbClient();
    const tableName = getAdminAppealsTable();

    const command = new GetCommand({
      TableName: tableName,
      Key: {
        appealId,
      },
    });

    const result = await dynamodb.send(command);

    if (!result.Item) {
      return NextResponse.json(
        { success: false, error: 'Appeal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appeal: result.Item as AdminAppealRecord,
    });
  } catch (error) {
    console.error('Error fetching appeal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appeal' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { appealId } = params;

    const dynamodb = getDynamoDbClient();
    const tableName = getAdminAppealsTable();

    // Delete the appeal
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        appealId,
      },
    });

    await dynamodb.send(command);

    return NextResponse.json({
      success: true,
      message: 'Appeal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting appeal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete appeal' },
      { status: 500 }
    );
  }
}
