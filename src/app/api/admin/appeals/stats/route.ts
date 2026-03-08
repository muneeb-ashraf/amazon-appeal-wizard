import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminAppealsTable } from '@/lib/aws-config';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import type { AdminAppealRecord, AdminAppealStatsResponse } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const dynamodb = getDynamoDbClient();
    const tableName = getAdminAppealsTable();

    // Scan all appeals
    const command = new ScanCommand({
      TableName: tableName,
    });

    const result = await dynamodb.send(command);
    const appeals = (result.Items || []) as AdminAppealRecord[];

    // Calculate statistics
    const totalAppeals = appeals.length;
    const completedAppeals = appeals.filter((a) => a.status === 'completed').length;
    const failedAppeals = appeals.filter((a) => a.status === 'failed').length;
    const pendingAppeals = appeals.filter((a) => a.status === 'pending').length;
    const successRate = totalAppeals > 0 ? (completedAppeals / totalAppeals) * 100 : 0;

    // Calculate average generation time
    const generationTimes = appeals
      .filter((a) => a.generationMetadata?.generationTimeMs)
      .map((a) => a.generationMetadata.generationTimeMs!);

    const avgGenerationTime = generationTimes.length > 0
      ? generationTimes.reduce((sum, time) => sum + time, 0) / generationTimes.length
      : undefined;

    // Count appeals by type
    const appealsByType: Record<string, number> = {};
    appeals.forEach((appeal) => {
      const type = appeal.formData?.appealType || 'unknown';
      appealsByType[type] = (appealsByType[type] || 0) + 1;
    });

    const response: AdminAppealStatsResponse = {
      success: true,
      stats: {
        totalAppeals,
        completedAppeals,
        failedAppeals,
        pendingAppeals,
        successRate: Math.round(successRate * 100) / 100,
        avgGenerationTime: avgGenerationTime ? Math.round(avgGenerationTime) : undefined,
        appealsByType,
      },
    };

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Error fetching appeal stats:', error);
    return NextResponse.json(
      {
        success: false,
        stats: {
          totalAppeals: 0,
          completedAppeals: 0,
          failedAppeals: 0,
          pendingAppeals: 0,
          successRate: 0,
        },
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}
