// ============================================================================
// API ROUTE: Save Complete Appeal to DynamoDB
// ============================================================================

import { NextRequest } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, getAdminAppealsTable } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';
import type { AdminAppealRecord } from '@/types';

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
    const { formData, appealText, metadata = {} } = body;

    if (!formData || !appealText) {
      return new Response(
        JSON.stringify({ error: 'Missing formData or appealText' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('💾 Saving appeal to database for:', formData.fullName || formData.sellerName);

    // Save to admin-appeals table
    const appealId = uuidv4();
    const now = new Date().toISOString();

    const appealRecord: AdminAppealRecord = {
      appealId,
      createdAt: now,
      updatedAt: now,
      status: 'completed',
      formData: {
        fullName: formData.fullName || '',
        storeName: formData.storeName || '',
        email: formData.email || '',
        sellerId: formData.sellerId || '',
        appealType: formData.appealType || '',
        rootCauses: formData.rootCauses || [],
        correctiveActionsTaken: formData.correctiveActionsTaken || [],
        preventiveMeasures: formData.preventiveMeasures || [],
        asins: formData.asins || [],
        rootCauseDetails: formData.rootCauseDetails,
        correctiveActionsDetails: formData.correctiveActionsDetails,
        preventiveMeasuresDetails: formData.preventiveMeasuresDetails,
      },
      generatedAppeal: appealText,
      generationMetadata: {
        sectionsGenerated: metadata.sectionsGenerated || [],
        totalTokens: metadata.totalTokens,
        generationTimeMs: metadata.generationTimeMs,
        aiInstructionsVersion: metadata.aiInstructionsVersion,
        formFieldsVersion: metadata.formFieldsVersion,
      },
      uploadedDocuments: formData.uploadedDocuments?.map((doc: any) => ({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        type: doc.type,
        s3Key: doc.s3Key,
      })) || [],
    };

    const tableName = getAdminAppealsTable();

    await dynamoDbClient.send(
      new PutCommand({
        TableName: tableName,
        Item: appealRecord,
      })
    );

    console.log('✅ Appeal saved successfully to', tableName, 'with ID:', appealId);

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
