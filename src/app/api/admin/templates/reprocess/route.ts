// ============================================================================
// TEMPLATE REPROCESSING API
// POST - Regenerate embeddings for templates
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbClient, getAdminConfigTable } from '@/lib/aws-config';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { TemplatesConfig, ConfigurationRecord } from '@/lib/admin-config-types';
import { invalidateCache, loadActiveConfig } from '@/lib/config-loader';

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

    // TODO: Trigger actual embedding generation job
    // This would typically queue a background job to process the documents
    // For now, we just mark them as pending

    return NextResponse.json({
      success: true,
      message: documentIds
        ? `Marked ${documentIds.length} template(s) for reprocessing`
        : 'Marked all templates for reprocessing',
      documentsToProcess: documentIds
        ? updatedDocuments.filter((d) => documentIds.includes(d.id)).length
        : updatedDocuments.length,
    });
  } catch (error: any) {
    console.error('Error reprocessing templates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reprocess templates' },
      { status: 500 }
    );
  }
}
