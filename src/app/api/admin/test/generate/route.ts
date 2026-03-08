// ============================================================================
// TEST APPEAL GENERATION API
// POST - Generate test appeal with specific configuration version
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getAdminTestTable } from '@/lib/aws-config';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { TestAppealRecord, ConfigurationRecord, AIInstructionsConfig } from '@/lib/admin-config-types';
import { v4 as uuidv4 } from 'uuid';
import {
  generateAppealSection,
  generateAppealSectionWithContext,
} from '@/lib/openai-utils';
import { queryGeminiFileSearch } from '@/lib/gemini-rag-utils';
import { getCachedEmbeddings } from '@/lib/embeddings-cache';
import { AppealFormData } from '@/types';

// 5 sections × 30s each + overhead = 3 minutes
export const maxDuration = 180;
export const dynamic = 'force-dynamic';

const dynamoDb = getDynamoDbClient();

/**
 * Adapt test form data to AppealFormData interface
 */
function adaptTestFormDataToAppealFormData(testFormData: any): AppealFormData {
  return {
    // Map test fields
    appealType: testFormData.appealType || '',
    fullName: testFormData.fullName || 'Test Seller',
    storeName: testFormData.storeName || 'Test Store',
    rootCauses: testFormData.rootCauses || [],
    correctiveActionsTaken: testFormData.correctiveActionsTaken || [],
    preventiveMeasures: testFormData.preventiveMeasures || [],

    // Required fields with test defaults
    email: testFormData.email || 'test@example.com',
    sellerId: testFormData.sellerId || 'A1234567890TEST',
    asins: testFormData.asins || [],

    // Optional detail fields
    rootCauseDetails: testFormData.rootCauseDetails || '',
    unauthorizedSupplier: testFormData.unauthorizedSupplier || '',
    relatedAccountReason: testFormData.relatedAccountReason || '',
    categoryRejectionReason: testFormData.categoryRejectionReason || '',
    detailPageAbuseArea: testFormData.detailPageAbuseArea || [],
    correctiveActionsDetails: testFormData.correctiveActionsDetails || '',
    preventiveMeasuresDetails: testFormData.preventiveMeasuresDetails || '',

    // Documents
    uploadedDocuments: testFormData.uploadedDocuments || [],
  };
}

/**
 * Generate real test appeal using the production appeal generation system
 */
async function generateRealTestAppeal(
  formData: any,
  aiConfig: ConfigurationRecord<AIInstructionsConfig> | undefined
): Promise<string> {
  // Adapt test form data to full AppealFormData
  const adaptedFormData = adaptTestFormDataToAppealFormData(formData);

  // Get sections from specific config version or defaults
  let sections;
  if (aiConfig?.configData?.sections) {
    // Use sections from the specific version being tested
    sections = aiConfig.configData.sections.map(section => ({
      id: section.order,
      name: section.name,
      prompt: section.userPromptTemplate,
      maxTokens: section.maxTokens
    }));
  } else {
    // Fallback to default sections (will be loaded from openai-utils)
    sections = [
      { id: 1, name: 'Opening & Introduction', prompt: '', maxTokens: 700 },
      { id: 2, name: 'Root Cause Analysis', prompt: '', maxTokens: 800 },
      { id: 3, name: 'Corrective Actions', prompt: '', maxTokens: 800 },
      { id: 4, name: 'Preventive Measures', prompt: '', maxTokens: 1000 },
      { id: 5, name: 'Closing & Signature', prompt: '', maxTokens: 600 }
    ];
  }

  // Feature flag: Use Gemini RAG or DynamoDB embeddings
  const USE_GEMINI_RAG = process.env.NEXT_PUBLIC_USE_GEMINI_RAG === 'true';

  const generatedSections: string[] = [];

  // Generate each of the 5 sections sequentially
  for (let i = 0; i < sections.length; i++) {
    const sectionId = sections[i].id;

    console.log(`📝 Generating test section ${sectionId}/5: ${sections[i].name}`);

    let sectionText: string;

    try {
      if (USE_GEMINI_RAG) {
        // Use Gemini RAG path
        try {
          const { retrievedChunks } = await queryGeminiFileSearch(
            adaptedFormData,
            sectionId
          );

          sectionText = await generateAppealSection(
            sectionId,
            adaptedFormData,
            retrievedChunks,
            generatedSections
          );
        } catch (geminiError) {
          console.warn('⚠️  Gemini RAG failed, falling back to DynamoDB');
          // Fallback to DynamoDB
          const { documentTexts, documentEmbeddings, documentNames } =
            await getCachedEmbeddings();

          sectionText = await generateAppealSectionWithContext(
            sectionId,
            adaptedFormData,
            documentTexts,
            documentEmbeddings,
            documentNames,
            generatedSections
          );
        }
      } else {
        // Use DynamoDB embeddings path
        const { documentTexts, documentEmbeddings, documentNames } =
          await getCachedEmbeddings();

        sectionText = await generateAppealSectionWithContext(
          sectionId,
          adaptedFormData,
          documentTexts,
          documentEmbeddings,
          documentNames,
          generatedSections
        );
      }

      generatedSections.push(sectionText);
    } catch (error) {
      console.error(`❌ Failed to generate section ${sectionId}:`, error);
      // Return partial appeal with error marker
      generatedSections.push(`[ERROR: Failed to generate ${sections[i].name}]`);
    }
  }

  // Join all sections with double newlines
  return generatedSections.join('\n\n');
}

/**
 * POST /api/admin/test/generate
 * Generate appeal with specific configuration version for testing
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      aiInstructionsVersion,
      formFieldsVersion,
      formData,
      notes,
    } = body;

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Form data is required' },
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

    // Generate appeal using the real appeal generation system
    const generatedAppeal = await generateRealTestAppeal(formData, aiConfig);

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

    return NextResponse.json({
      success: true,
      testId,
      generatedAppeal,
      message: 'Test appeal generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating test appeal:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate test appeal' },
      { status: 500 }
    );
  }
}

