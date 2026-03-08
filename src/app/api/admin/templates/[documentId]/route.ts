// ============================================================================
// TEMPLATE DOCUMENT API
// GET - Preview template document
// DELETE - Delete template document
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getS3Client, getS3Bucket } from '@/lib/aws-config';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { TemplatesConfig, ConfigurationRecord } from '@/lib/admin-config-types';
import { invalidateCache, loadActiveConfig } from '@/lib/config-loader';
import { deleteFileFromGemini } from '@/lib/gemini-rag-utils';

const dynamoDb = getDynamoDbClient();
const s3Client = getS3Client();

/**
 * GET /api/admin/templates/[documentId]
 * Preview template document content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;

    // Get templates configuration
    const config = await loadActiveConfig<TemplatesConfig>('templates');
    const document = config?.configData?.documents.find((doc) => doc.id === documentId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get document from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: document.s3Bucket,
        Key: document.s3Key,
      })
    );

    // Convert stream to buffer
    const stream = s3Response.Body;
    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Document content not found' },
        { status: 404 }
      );
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // For .txt files, return text content
    // For .docx files, return base64 for download (parsing DOCX in browser is complex)
    if (document.fileType === 'txt') {
      const content = buffer.toString('utf-8');
      return NextResponse.json({
        success: true,
        document,
        content,
        contentType: 'text',
      });
    } else {
      // Return base64 for .docx files
      const base64 = buffer.toString('base64');
      return NextResponse.json({
        success: true,
        document,
        content: base64,
        contentType: 'docx',
      });
    }
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/templates/[documentId]
 * Delete template document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;

    // Get current templates configuration
    const tableName = getAdminConfigTable();
    const currentConfig = await loadActiveConfig<TemplatesConfig>('templates');
    const document = currentConfig?.configData?.documents.find((doc) => doc.id === documentId);

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: document.s3Bucket,
        Key: document.s3Key,
      })
    );

    // Delete from Gemini if it exists
    if (document.geminiFileId) {
      try {
        await deleteFileFromGemini(document.geminiFileId);
        console.log(`✅ Deleted from Gemini: ${document.geminiFileId}`);
      } catch (error: any) {
        console.error(`⚠️  Failed to delete from Gemini: ${error.message}`);
        // Continue anyway - the file is already deleted from S3 and DynamoDB
      }
    }

    // Remove from documents list
    const updatedDocuments = currentConfig?.configData?.documents.filter(
      (doc) => doc.id !== documentId
    ) || [];

    // Create new configuration version
    const newVersion = Date.now();
    const newConfig: ConfigurationRecord<TemplatesConfig> = {
      configId: 'templates',
      version: newVersion,
      status: 'active',
      configData: {
        documents: updatedDocuments,
        settings: currentConfig?.configData?.settings || {
          similarityThreshold: 0.75,
          maxRelevantDocuments: 5,
        },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: `Deleted template: ${document.documentName}`,
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
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
