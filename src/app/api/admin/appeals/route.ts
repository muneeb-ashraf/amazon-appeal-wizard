import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminAppealsTable } from '@/lib/aws-config';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { AdminAppealRecord, AdminAppealsListResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const searchQuery = searchParams.get('search') || '';

    const dynamodb = getDynamoDbClient();
    const tableName = getAdminAppealsTable();

    let items: AdminAppealRecord[] = [];

    if (status !== 'all') {
      // Use GSI to query by status
      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'status-createdAt-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': status,
        },
        ScanIndexForward: sortOrder === 'asc',
      });

      const result = await dynamodb.send(command);
      items = (result.Items || []) as AdminAppealRecord[];
    } else {
      // Scan all items
      const command = new ScanCommand({
        TableName: tableName,
      });

      const result = await dynamodb.send(command);
      items = (result.Items || []) as AdminAppealRecord[];
    }

    // Filter by search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = item.formData?.fullName?.toLowerCase() || '';
        const email = item.formData?.email?.toLowerCase() || '';
        const storeName = item.formData?.storeName?.toLowerCase() || '';
        return name.includes(query) || email.includes(query) || storeName.includes(query);
      });
    }

    // Sort items
    items.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortBy === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortBy === 'name') {
        aValue = a.formData?.fullName || '';
        bValue = b.formData?.fullName || '';
      } else if (sortBy === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else {
        aValue = a[sortBy as keyof AdminAppealRecord];
        bValue = b[sortBy as keyof AdminAppealRecord];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Paginate
    const total = items.length;
    const paginatedItems = items.slice(offset, offset + limit);

    const response: AdminAppealsListResponse = {
      success: true,
      appeals: paginatedItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching appeals:', error);
    return NextResponse.json(
      {
        success: false,
        appeals: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
        error: 'Failed to fetch appeals',
      },
      { status: 500 }
    );
  }
}
