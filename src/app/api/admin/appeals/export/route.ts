import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminAppealsTable } from '@/lib/aws-config';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { AdminAppealRecord } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { format = 'csv', status = 'all', dateRange } = body;

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

    // Filter by date range if provided
    if (dateRange?.start && dateRange?.end) {
      const startDate = new Date(dateRange.start).getTime();
      const endDate = new Date(dateRange.end).getTime();
      items = items.filter((item) => {
        const itemDate = new Date(item.createdAt).getTime();
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(items);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="appeals-export-${Date.now()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(items, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="appeals-export-${Date.now()}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid format' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting appeals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export appeals' },
      { status: 500 }
    );
  }
}

function generateCSV(appeals: AdminAppealRecord[]): string {
  const headers = [
    'Appeal ID',
    'Created At',
    'Status',
    'Full Name',
    'Email',
    'Store Name',
    'Seller ID',
    'Appeal Type',
    'Root Causes',
    'Corrective Actions',
    'Preventive Measures',
    'ASINs',
  ];

  const rows = appeals.map((appeal) => [
    appeal.appealId,
    appeal.createdAt,
    appeal.status,
    appeal.formData?.fullName || '',
    appeal.formData?.email || '',
    appeal.formData?.storeName || '',
    appeal.formData?.sellerId || '',
    appeal.formData?.appealType || '',
    (appeal.formData?.rootCauses || []).join('; '),
    (appeal.formData?.correctiveActionsTaken || []).join('; '),
    (appeal.formData?.preventiveMeasures || []).join('; '),
    (appeal.formData?.asins || []).join('; '),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}
