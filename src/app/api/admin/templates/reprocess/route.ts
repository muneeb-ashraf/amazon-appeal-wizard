// ============================================================================
// TEMPLATE REPROCESSING API
// POST - Regenerate embeddings for templates
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable, getDocumentsTable } from '@/lib/aws-config';
import { PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { TemplatesConfig, ConfigurationRecord } from '@/lib/admin-config-types';
import { invalidateCache, loadActiveConfig } from '@/lib/config-loader';
import { processDocument } from '@/lib/document-processor';
import { createEmbedding } from '@/lib/openai-utils';

const dynamoDb = getDynamoDbClient();

/**
 * POST /api/admin/templates/reprocess
 * Regenerate embeddings for all or specific templates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentIds } = body; // Optional: specific document IDs to reprocess

    // Get current templates configuration
    const tableName = getAdminConfigTable();
    const currentConfig = await loadActiveConfig<TemplatesConfig>('templates');

    if (!currentConfig) {
      return NextResponse.json(
        { success: false, error: 'No templates configuration found' },
        { status: 404 }
      );
    }

    // Update embedding status for specified documents or all
    const updatedDocuments = currentConfig.configData.documents.map((doc) => {
      if (!documentIds || documentIds.includes(doc.id)) {
        return {
          ...doc,
          embeddingStatus: 'pending' as const,
          processedAt: undefined,
        };
      }
      return doc;
    });

    // Create new configuration version
    const newVersion = Date.now();
    const newConfig: ConfigurationRecord<TemplatesConfig> = {
      configId: 'templates',
      version: newVersion,
      status: 'active',
      configData: {
        documents: updatedDocuments,
        settings: currentConfig.configData.settings,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: documentIds
        ? `Reprocessing ${documentIds.length} template(s)`
        : 'Reprocessing all templates',
      parentVersion: currentConfig.version,
    };

    // Archive old active version
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

    // Save new active version
    await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: newConfig,
      })
    );

    // Invalidate cache
    invalidateCache('templates');

    // Process documents immediately to generate embeddings
    console.log('🔄 Starting embedding generation for documents...');

    const documentsTable = getDocumentsTable();
    const documentsToProcess = updatedDocuments.filter((doc) =>
      !documentIds || documentIds.includes(doc.id)
    );

    // Process each document and update status
    const processedDocuments = await Promise.all(
      updatedDocuments.map(async (doc) => {
        if (!documentIds || documentIds.includes(doc.id)) {
          try {
            console.log(`📄 Processing: ${doc.documentName}`);

            // Step 1: Convert document to text
            const { textContent, textS3Key } = await processDocument(doc.s3Key);
            console.log(`  ✓ Converted to text`);

            // Step 2: Create embedding
            const embedding = await createEmbedding(textContent);
            console.log(`  ✓ Created embedding (${embedding.length} dimensions)`);

            // Step 3: Find existing document record in DynamoDB
            // Search for document by s3Key to get its ID
            const { ScanCommand } = await import('@aws-sdk/lib-dynamodb');
            const scanResult = await dynamoDb.send(
              new ScanCommand({
                TableName: documentsTable,
                FilterExpression: 's3Key = :s3Key',
                ExpressionAttributeValues: {
                  ':s3Key': doc.s3Key,
                },
                Limit: 1,
              })
            );

            const existingDoc = scanResult.Items?.[0];
            const docId = existingDoc?.id || doc.id;

            // Step 4: Save updated document to DynamoDB
            const documentRecord = {
              id: docId,
              documentName: doc.documentName,
              s3Key: doc.s3Key,
              textS3Key: textS3Key,
              s3Bucket: process.env.NEXT_PUBLIC_AWS_S3_BUCKET,
              fileType: 'docx',
              uploadedAt: existingDoc?.uploadedAt || new Date().toISOString(),
              processedAt: new Date().toISOString(),
              embeddingStatus: 'completed',
              textContent: textContent,
              embedding: embedding,
              metadata: {
                ...(existingDoc?.metadata || {}),
                reprocessedBy: 'admin-panel',
                reprocessedAt: new Date().toISOString(),
              },
            };

            await dynamoDb.send(
              new PutCommand({
                TableName: documentsTable,
                Item: documentRecord,
              })
            );

            console.log(`  ✅ Successfully processed: ${doc.documentName}`);

            return {
              ...doc,
              embeddingStatus: 'completed' as const,
              processedAt: new Date().toISOString(),
            };
          } catch (error) {
            console.error(`  ❌ Failed to process ${doc.documentName}:`, error);
            return {
              ...doc,
              embeddingStatus: 'failed' as const,
            };
          }
        }
        return doc;
      })
    );

    // Update configuration with processed documents
    const finalConfig: ConfigurationRecord<TemplatesConfig> = {
      ...newConfig,
      configData: {
        documents: processedDocuments,
        settings: currentConfig.configData.settings,
      },
      updatedAt: new Date().toISOString(),
    };

    // Save final configuration
    await dynamoDb.send(
      new PutCommand({
        TableName: tableName,
        Item: finalConfig,
      })
    );

    invalidateCache('templates');

    const successCount = processedDocuments.filter(d => d.embeddingStatus === 'completed').length;
    const failedCount = processedDocuments.filter(d => d.embeddingStatus === 'failed').length;

    return NextResponse.json({
      success: true,
      message: documentIds
        ? `Reprocessed ${successCount} template(s) successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`
        : `Reprocessed all templates: ${successCount} succeeded${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      documentsProcessed: successCount,
      documentsFailed: failedCount,
    });
  } catch (error: any) {
    console.error('Error reprocessing templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reprocess templates' },
      { status: 500 }
    );
  }
}
