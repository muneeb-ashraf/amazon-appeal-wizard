// ============================================================================
// EMBEDDINGS CACHE UTILITIES
// ============================================================================

import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, DOCUMENTS_TABLE } from './aws-config';
import { getAllDocumentTexts } from './document-processor';
import { createBatchEmbeddings } from './openai-utils';

// All template documents stored in S3
export const TEMPLATE_DOCUMENTS = [
  'documents/Bianca Boersma Appeal - rev2.docx',
  'documents/BR POA I (1).docx',
  'documents/Copy of Robert Harvey Appeal used sold as new - 7-29-2020.docx',
  'documents/Draft POA I - Maaz Ahmed - Inauthentic ed 1.docx',
  'documents/Draft POA I - Maaz Ahmed - Inauthentic rev ed.docx',
  'documents/Draft POA II- FLOLEAF NATURALS - Restricted product ed.docx',
  'documents/Draft POA II- FLOLEAF NATURALS - Restricted product.docx',
  'documents/Erica Sutton hacked POA (2).docx',
  'documents/Escalation I - Jennifer Smith - KDP ed (2).docx',
  'documents/Escalation I - Saarang Ayaz - Inauthenticity ed (1).docx',
  'documents/Escalation II - Mark Hanson - ODR Listing Removal ed (1).docx',
  'documents/Etsy Appeal I - Heartwood Wands. IP ed (3).docx',
  'documents/Evan Michalski eBay Inauthentic Appeal Draft (2).docx',
  'documents/FINAL Iron Brothers Supplements - Letter to US Legal Dept. ed (1).docx',
  'documents/Funds Appeal I -  Nova777 ed (1) (1).docx',
  'documents/Jan Pohnan fair pricing IV (2).docx',
  'documents/Kindpowers, LLC Appeal - SP III.docx',
  'documents/POA I - Adrian Vizireanu. Brand Registry ed (1) (1).docx',
  'documents/POA I - Believegroup - Cancelled Shipments ed (2).docx',
  'documents/POA I - Botir Rustamov ed (1) (1).docx',
  'documents/POA I - Brillias Boutique. Sales Velocity ed (1).docx',
  'documents/POA I - Carlos Shah - Restricted - 4-1-2024 ed (1).docx',
  'documents/POA I - Dimitri Jesse - Merc ed (3).docx',
  'documents/POA I - GenieMedia ed (10).docx',
  'documents/POA I - Kent Jameson - ACX ed (1).docx',
  'documents/POA I - Paula Guran - Copyright ed (1) (1).docx',
  'documents/POA I - Petru Nedelku - KDP ed (1).docx',
  'documents/POA I - Sandadi Reddy. FBA suspension ed (1) (1).docx',
  'documents/POA I - Tina Perebikosvky Inauthentic - 10-3-2025 ed.docx',
  'documents/POA I - Tina Perebikosvky Inauthentic - 10-3-2025.docx',
  'documents/POA I - Viking Investments - Verification ed.docx',
  'documents/POA I - Zachary Munoz - Review Manipulation ed (1) (2).docx',
  'documents/POA II - AK - Unsuitable inventory ed (5).docx',
  'documents/POA II - SA - Dropshipping ed (1).docx',
  'documents/POA III - FM -  Disease Claims ed (1).docx',
  'documents/POA III -Tina Perebikovsky Trademark Infringement - 8-31-2024 ed (1).docx',
  'documents/POA US.docx',
  'documents/Sanjay Gupta Appeal detail page abuse - 8-31-2020.docx',
  'documents/Template - EU Design POA.docx',
];

// Cache for document embeddings (in-memory cache)
let embeddingsCache: {
  documentTexts: string[];
  documentEmbeddings: number[][];
  documentNames: string[];
  lastUpdated: Date;
} | null = null;

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached embeddings from DynamoDB or generate them
 */
export async function getCachedEmbeddings(): Promise<{
  documentTexts: string[];
  documentEmbeddings: number[][];
  documentNames: string[];
}> {
  console.log('🔄 Calling getCachedEmbeddings()...');

  // Check if cache is valid
  if (
    embeddingsCache &&
    Date.now() - embeddingsCache.lastUpdated.getTime() < CACHE_DURATION_MS
  ) {
    console.log('✅ Using in-memory cached embeddings');
    return {
      documentTexts: embeddingsCache.documentTexts,
      documentEmbeddings: embeddingsCache.documentEmbeddings,
      documentNames: embeddingsCache.documentNames,
    };
  }

  console.log('⚠️  Cache miss or expired, fetching from DB...');

  // Try to get embeddings from DynamoDB
  try {
    const cachedFromDb = await getAllDocumentEmbeddingsFromDB();
    if (cachedFromDb && cachedFromDb.documentTexts.length > 0) {
      console.log('✅ Retrieved embeddings from DynamoDB');

      embeddingsCache = {
        documentTexts: cachedFromDb.documentTexts,
        documentEmbeddings: cachedFromDb.documentEmbeddings,
        documentNames: cachedFromDb.documentNames,
        lastUpdated: new Date(),
      };
      return {
        documentTexts: cachedFromDb.documentTexts,
        documentEmbeddings: cachedFromDb.documentEmbeddings,
        documentNames: cachedFromDb.documentNames,
      };
    } else {
      console.log('ℹ️  No embeddings found in DynamoDB, will generate fresh');
    }
  } catch (error) {
    console.warn('❌ Could not retrieve embeddings from DB:', error);
  }

  // Generate fresh embeddings as fallback
  console.log('🔄 Generating fresh embeddings for all documents...');

  const documentTexts = await getAllDocumentTexts(TEMPLATE_DOCUMENTS);
  console.log(`📄 Retrieved ${documentTexts.length} document texts`);

  const documentEmbeddings = await createBatchEmbeddings(documentTexts);
  console.log(`🔢 Created ${documentEmbeddings.length} embeddings`);

  // Extract document names from TEMPLATE_DOCUMENTS
  const documentNames = TEMPLATE_DOCUMENTS.map(path => {
    const parts = path.split('/');
    return parts[parts.length - 1] || path;
  });

  // Cache in memory
  embeddingsCache = {
    documentTexts,
    documentEmbeddings,
    documentNames,
    lastUpdated: new Date(),
  };

  console.log('✅ Embeddings cached in memory');

  return { documentTexts, documentEmbeddings, documentNames };
}

/**
 * Retrieve all document embeddings from DynamoDB individual records
 */
async function getAllDocumentEmbeddingsFromDB(): Promise<{
  documentTexts: string[];
  documentEmbeddings: number[][];
  documentNames: string[];
} | null> {
  try {
    console.log('🔍 Scanning DynamoDB for all document embeddings...');

    const result = await dynamoDbClient.send(
      new ScanCommand({
        TableName: DOCUMENTS_TABLE,
        FilterExpression: 'embeddingStatus = :status AND attribute_exists(embedding)',
        ExpressionAttributeValues: {
          ':status': 'completed'
        }
      })
    );

    if (!result.Items || result.Items.length === 0) {
      console.log('⚠️  No document embeddings found in DynamoDB');
      return null;
    }

    console.log(`📦 Found ${result.Items.length} documents with embeddings`);

    const documentTexts: string[] = [];
    const documentEmbeddings: number[][] = [];
    const documentNames: string[] = [];

    for (const item of result.Items) {
      if (item.textContent && item.embedding) {
        documentTexts.push(item.textContent);
        documentEmbeddings.push(item.embedding);
        // Extract document name from documentName field or s3Key as fallback
        const docName = item.documentName || (item.s3Key ? item.s3Key.split('/').pop() : 'Unknown');
        documentNames.push(docName);
      }
    }

    console.log(`✅ Loaded ${documentTexts.length} texts, ${documentEmbeddings.length} embeddings, and ${documentNames.length} names from DB`);

    if (documentTexts.length > 0 && documentEmbeddings.length > 0) {
      return {
        documentTexts,
        documentEmbeddings,
        documentNames
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error retrieving document embeddings from DB:', error);
    return null;
  }
}
