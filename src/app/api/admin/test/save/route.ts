// ============================================================================
// TEST APPEAL SAVE API
// POST - Save generated test appeal to database
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getAdminTestTable } from '@/lib/aws-config';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestAppealRecord, ConfigurationRecord, AIInstructionsConfig } from '@/lib/admin-config-types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/test/save
 * Save generated appeal to test database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      aiInstructionsVersion,
      formFieldsVersion,
      formData,
      generatedAppeal,
      notes,
    } = body;

    if (!formData || !generatedAppeal) {
      return NextResponse.json(
        { success: false, error: 'Form data and generated appeal are required' },
        { status: 400 }
      );
    }

    const configTable = getAdminConfigTable();
    const testTable = getAdminTestTable();

    // Get AI instructions configuration
    let aiConfig: ConfigurationRecord<AIInstructionsConfig> | undefined;
    if (aiInstructionsVersion) {
      const result = await dynamoDb.send(
        new GetCommand({
          TableName: configTable,
          Key: {
            configId: 'ai-instructions',
            version: aiInstructionsVersion,
          },
        })
      );
      aiConfig = result.Item as ConfigurationRecord<AIInstructionsConfig> | undefined;
    }

    // Get form fields configuration (if specified)
    let formFieldsConfig: ConfigurationRecord | undefined;
    if (formFieldsVersion) {
      const result = await dynamoDb.send(
        new GetCommand({
          TableName: configTable,
          Key: {
            configId: 'form-fields',
            version: formFieldsVersion,
          },
        })
      );
      formFieldsConfig = result.Item as ConfigurationRecord | undefined;
    }

    // Create test record
    const testId = uuidv4();
    const now = new Date().toISOString();
    const testRecord: TestAppealRecord = {
      testId,
      configVersion: aiInstructionsVersion || Date.now(),
      configSnapshot: {
        aiInstructions: aiConfig?.configData,
        formFields: formFieldsConfig?.configData,
      },
      formData,
      generatedAppeal,
      createdAt: now,
      notes,
      // Add generation metadata
      metadata: {
        ragMethod: process.env.NEXT_PUBLIC_USE_GEMINI_RAG === 'true' ? 'gemini' : 'dynamodb',
        modelUsed: aiConfig?.configData?.globalSettings?.defaultModel || 'gpt-4o-mini',
        sectionsGenerated: 5,
      }
    };

    // Save test record
    await dynamoDb.send(
      new PutCommand({
        TableName: testTable,
        Item: testRecord,
      })
    );

    console.log('✅ Test appeal saved successfully:', testId);

    return NextResponse.json({
      success: true,
      testId,
      message: 'Test appeal saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving test appeal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save test appeal' },
      { status: 500 }
    );
  }
}
