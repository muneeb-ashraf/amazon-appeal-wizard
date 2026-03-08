// ============================================================================
// TEMPLATE MANAGEMENT API
// GET - List all templates
// POST - Upload new template
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getS3Client, getS3Bucket } from '@/lib/aws-config';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { TemplatesConfig, ConfigurationRecord } from '@/lib/admin-config-types';
import { invalidateCache, loadActiveConfig } from '@/lib/config-loader';
import { uploadFileToGemini } from '@/lib/gemini-rag-utils';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const dynamoDb = getDynamoDbClient();
const s3Client = getS3Client();

/**
 * GET /api/admin/templates
 * List all template documents
 */
export async function GET() {
  try {
    // Load active templates configuration
    const config = await loadActiveConfig<TemplatesConfig>('templates');

    return NextResponse.json({
      success: true,
      documents: config?.configData?.documents || [],
      settings: config?.configData?.settings || {
        similarityThreshold: 0.75,
        maxRelevantDocuments: 5,
      },
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates
 * Upload new template document
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const appealTypes = JSON.parse(formData.get('appealTypes') as string || '[]');
    const description = formData.get('description') as string || '';
    const tags = JSON.parse(formData.get('tags') as string || '[]');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'txt';
    if (fileType !== 'docx' && fileType !== 'txt') {
      return NextResponse.json(
        { success: false, error: 'Only .docx and .txt files are supported' },
        { status: 400 }
      );
    }

    // Generate unique ID and S3 key
    const documentId = uuidv4();
    const timestamp = Date.now();
    const s3Key = `templates/${timestamp}-${file.name}`;
    const bucket = getS3Bucket();

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    );

    // Upload to Gemini (if feature is enabled)
    let geminiFileId: string | undefined;
    const useGeminiRAG = process.env.NEXT_PUBLIC_USE_GEMINI_RAG === 'true';

    if (useGeminiRAG) {
      try {
        // Save buffer to temp file for Gemini upload
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, file.name);
        fs.writeFileSync(tempPath, buffer);

        // Determine MIME type
        const mimeType = fileType === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'text/plain';

        // Upload to Gemini
        geminiFileId = await uploadFileToGemini(tempPath, mimeType, file.name);
        console.log(`✅ Uploaded to Gemini: ${geminiFileId}`);

        // Clean up temp file
        fs.unlinkSync(tempPath);
      } catch (error: any) {
        console.error(`⚠️  Failed to upload to Gemini: ${error.message}`);
        // Continue anyway - file is in S3, can be uploaded to Gemini later
      }
    }

    // Get current templates configuration
    const tableName = getAdminConfigTable();
    const currentConfig = await loadActiveConfig<TemplatesConfig>('templates');
    const currentDocuments = currentConfig?.configData?.documents || [];

    // Create new document metadata
    const newDocument = {
      id: documentId,
      documentName: file.name,
      s3Key,
      s3Bucket: bucket,
      fileType,
      appealTypes,
      uploadedAt: new Date().toISOString(),
      processedAt: undefined,
      embeddingStatus: geminiFileId ? 'completed' as const : 'pending' as const,
      enabled: true,
      tags,
      description,
      geminiFileId,
      geminiUploadedAt: geminiFileId ? new Date().toISOString() : undefined,
    };

    // Create new configuration version
    const newVersion = Date.now();
    const newConfig: ConfigurationRecord<TemplatesConfig> = {
      configId: 'templates',
      version: newVersion,
      status: 'active',
      configData: {
        documents: [...currentDocuments, newDocument],
        settings: currentConfig?.configData?.settings || {
          similarityThreshold: 0.75,
          maxRelevantDocuments: 5,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: `Added template: ${file.name}`,
      parentVersion: currentConfig?.version,
    };

    // Archive old active version
    if (currentConfig) {
      await dynamoDb.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...currentConfig,
            status: 'archived',
            updatedAt: new Date().toISOString(),
          },
        })
      );
    }

    // Save new active version
    await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: newConfig,
      })
    );

    // Invalidate cache
    invalidateCache('templates');

    return NextResponse.json({
      success: true,
      document: newDocument,
      message: 'Template uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload template' },
      { status: 500 }
    );
  }
}
