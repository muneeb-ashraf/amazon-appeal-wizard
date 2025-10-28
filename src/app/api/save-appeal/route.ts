// ============================================================================
// API ROUTE: Save Complete Appeal to DynamoDB
// ============================================================================

import { NextRequest } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, APPEALS_TABLE } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

/**
 * POST handler for saving a complete appeal to the database
 * Body should include:
 * - formData: Appeal form data
 * - appealText: Complete appeal text (all sections combined)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formData, appealText } = body;

    if (!formData || !appealText) {
      return new Response(
        JSON.stringify({ error: 'Missing formData or appealText' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 Saving appeal to database for:', formData.sellerName);

    // Save to DynamoDB
    const appealId = uuidv4();
    const appealData = {
      id: appealId,
      sellerName: formData.sellerName,
      appealType: formData.appealType,
      appealText: appealText,
      createdAt: new Date().toISOString(),
      formData: formData,
    };

    await dynamoDbClient.send(
      new PutCommand({
        TableName: APPEALS_TABLE,
        Item: appealData,
      })
    );

    console.log('✅ Appeal saved successfully with ID:', appealId);

    return new Response(
      JSON.stringify({
        success: true,
        appealId: appealId,
        message: 'Appeal saved successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error saving appeal:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to save appeal',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
