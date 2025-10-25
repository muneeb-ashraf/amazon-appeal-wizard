// ============================================================================
// API ROUTE: Generate Appeal
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAppealWithContext } from '@/lib/openai-utils';
import { getAllDocumentTexts } from '@/lib/document-processor';
import { createBatchEmbeddings } from '@/lib/openai-utils';
import { PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, APPEALS_TABLE, DOCUMENTS_TABLE } from '@/lib/aws-config';
import { v4 as uuidv4 } from 'uuid';

// All 38 template documents stored in S3
const TEMPLATE_DOCUMENTS = [
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
  lastUpdated: Date;
} | null = null;

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get or create cached embeddings for template documents
 */
async function getCachedEmbeddings(): Promise<{
  documentTexts: string[];
  documentEmbeddings: number[][];
}> {
  // Check if cache is valid
  if (
    embeddingsCache &&
    Date.now() - embeddingsCache.lastUpdated.getTime() < CACHE_DURATION_MS
  ) {
    console.log('Using cached embeddings');
    return {
      documentTexts: embeddingsCache.documentTexts,
      documentEmbeddings: embeddingsCache.documentEmbeddings,
    };
  }

  console.log('Cache miss or expired, generating new embeddings...');

  // Try to get embeddings from DynamoDB individual document records first
  try {
    const cachedFromDb = await getAllDocumentEmbeddingsFromDB();
    if (cachedFromDb && cachedFromDb.documentTexts.length > 0) {
      console.log('✅ Retrieved embeddings from DynamoDB individual documents');
      console.log(`� Document texts count: ${cachedFromDb.documentTexts?.length || 0}`);
      console.log(`� Embeddings count: ${cachedFromDb.documentEmbeddings?.length || 0}`);
      
      embeddingsCache = {
        documentTexts: cachedFromDb.documentTexts,
        documentEmbeddings: cachedFromDb.documentEmbeddings,
        lastUpdated: new Date(),
      };
      return {
        documentTexts: cachedFromDb.documentTexts,
        documentEmbeddings: cachedFromDb.documentEmbeddings,
      };
    } else {
      console.log('ℹ️  No embeddings found in DynamoDB, will generate fresh');
    }
  } catch (error) {
    console.warn('❌ Could not retrieve embeddings from DB:', error);
  }

  // Generate fresh embeddings
  console.log('Generating fresh embeddings for all documents...');
  
  // Get all document texts (getAllDocumentTexts handles the path conversion)
  const documentTexts = await getAllDocumentTexts(TEMPLATE_DOCUMENTS);
  
  console.log(`Retrieved ${documentTexts.length} document texts`);

  // Create embeddings
  const documentEmbeddings = await createBatchEmbeddings(documentTexts);
  
  console.log(`Created ${documentEmbeddings.length} embeddings`);

  // Cache in memory only (DynamoDB has 400KB item size limit, so we store individually)
  embeddingsCache = {
    documentTexts,
    documentEmbeddings,
    lastUpdated: new Date(),
  };

  console.log('✅ Embeddings cached in memory (not saving to DB due to size limits)');

  return { documentTexts, documentEmbeddings };
}

/**
 * Retrieve all document embeddings from DynamoDB individual records
 */
async function getAllDocumentEmbeddingsFromDB(): Promise<{
  documentTexts: string[];
  documentEmbeddings: number[][];
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

    for (const item of result.Items) {
      if (item.textContent && item.embedding) {
        documentTexts.push(item.textContent);
        documentEmbeddings.push(item.embedding);
      }
    }

    console.log(`✅ Loaded ${documentTexts.length} texts and ${documentEmbeddings.length} embeddings from DB`);

    if (documentTexts.length > 0 && documentEmbeddings.length > 0) {
      return {
        documentTexts,
        documentEmbeddings
      };
    }

    return null;
  } catch (error) {
    console.error('❌ Error retrieving document embeddings from DB:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { formData } = await request.json();

    if (!formData) {
      return NextResponse.json(
        { success: false, error: 'Form data is required' },
        { status: 400 }
      );
    }

    console.log('Generating appeal for:', formData.fullName);

    // Generate a unique ID for this appeal
    const appealId = uuidv4();

    let appealText = '';

    try {
      // Get or generate cached embeddings
      console.log('🔄 Calling getCachedEmbeddings()...');
      const { documentTexts, documentEmbeddings } = await getCachedEmbeddings();

      console.log(`📊 Received from getCachedEmbeddings:`);
      console.log(`   - documentTexts: ${documentTexts?.length || 0} items`);
      console.log(`   - documentEmbeddings: ${documentEmbeddings?.length || 0} items`);
      console.log(`   - documentTexts is array: ${Array.isArray(documentTexts)}`);
      console.log(`   - documentEmbeddings is array: ${Array.isArray(documentEmbeddings)}`);

      if (documentTexts.length > 0 && documentEmbeddings.length > 0) {
        console.log(`✅ Using ${documentTexts.length} template documents for AI generation`);
        
        // Generate appeal using AI with context
        appealText = await generateAppealWithContext(
          formData,
          documentTexts,
          documentEmbeddings
        );
      } else {
        console.warn('No template documents available, using fallback');
        appealText = generateBasicAppeal(formData);
      }
    } catch (aiError) {
      console.error('Error in AI generation:', aiError);
      console.log('Falling back to basic appeal generation');
      appealText = generateBasicAppeal(formData);
    }

    // Save to DynamoDB
    const appealRecord = {
      id: appealId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      formData: formData,
      appealText: appealText,
      status: 'completed',
    };

    await dynamoDbClient.send(
      new PutCommand({
        TableName: APPEALS_TABLE,
        Item: appealRecord,
      })
    );

    console.log('Appeal saved successfully:', appealId);

    return NextResponse.json({
      success: true,
      appealId,
      appealText,
    });
  } catch (error) {
    console.error('Error generating appeal:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate appeal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a basic appeal without AI (fallback)
 */
function generateBasicAppeal(formData: any): string {
  const sections = [];

  // Header
  sections.push(`Dear Amazon Seller Performance Team,\n`);
  sections.push(
    `My name is ${formData.fullName}, and I am the owner of ${formData.storeName}. I am writing to appeal the ${formData.appealType} issue affecting my Amazon seller account (${formData.email}).\n`
  );

  // Section A: Root Cause
  sections.push(`A. The root cause of the issue\n`);
  sections.push(
    `After conducting a thorough review of my account and Amazon's policies, I have identified the following root causes:\n`
  );
  if (formData.rootCauses && formData.rootCauses.length > 0) {
    formData.rootCauses.forEach((cause: string) => {
      sections.push(`• ${cause}\n`);
    });
  }
  if (formData.rootCauseDetails) {
    sections.push(`\n${formData.rootCauseDetails}\n`);
  }
  sections.push(
    `\nI take full responsibility for this oversight and understand the importance of maintaining Amazon's high standards.\n`
  );

  // Section B: Corrective Actions
  sections.push(`\nB. The actions I have taken to resolve the issue\n`);
  sections.push(
    `To immediately address this issue, I have completed the following corrective actions:\n`
  );
  if (formData.correctiveActionsTaken && formData.correctiveActionsTaken.length > 0) {
    formData.correctiveActionsTaken.forEach((action: string) => {
      sections.push(`• ${action}\n`);
    });
  }
  if (formData.correctiveActionsDetails) {
    sections.push(`\n${formData.correctiveActionsDetails}\n`);
  }

  // Section C: Preventive Measures
  sections.push(`\nC. The steps I have taken to prevent this issue going forward\n`);
  sections.push(
    `To ensure this issue never occurs again, I have implemented the following long-term preventive measures:\n`
  );
  if (formData.preventiveMeasures && formData.preventiveMeasures.length > 0) {
    formData.preventiveMeasures.forEach((measure: string) => {
      sections.push(`• ${measure}\n`);
    });
  }
  if (formData.preventiveMeasuresDetails) {
    sections.push(`\n${formData.preventiveMeasuresDetails}\n`);
  }

  // Supporting Documents
  if (formData.uploadedDocuments && formData.uploadedDocuments.length > 0) {
    sections.push(
      `\nI have attached the following supporting documents for your review:\n`
    );
    formData.uploadedDocuments.forEach((doc: any) => {
      sections.push(`• ${doc.fileName}\n`);
    });
  }

  // Closing
  sections.push(
    `\nI am confident that these corrective and preventive actions demonstrate my commitment to full compliance with Amazon's policies. I greatly value my ability to sell on Amazon and appreciate your consideration of this appeal.\n`
  );
  sections.push(`\nThank you for your time and attention.\n`);
  sections.push(`\nSincerely,\n`);
  sections.push(`${formData.fullName}\n`);
  sections.push(`${formData.storeName}\n`);
  sections.push(`${formData.email}\n`);
  if (formData.sellerId) {
    sections.push(`Seller ID: ${formData.sellerId}\n`);
  }

  return sections.join('');
}
