// ============================================================================
// GEMINI FILE SEARCH RAG UTILITIES
// ============================================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { AppealFormData } from '@/types';
import { loadActiveConfig } from './config-loader';
import type { TemplatesConfig } from './admin-config-types';

// Lazy Gemini client initialization
let _genAI: GoogleGenerativeAI | null = null;
let _fileManager: GoogleAIFileManager | null = null;

/**
 * Get Gemini API key from environment
 */
function getGeminiApiKey(): string {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
  }
  return apiKey;
}

/**
 * Get Gemini model name from environment with fallback
 */
function getGeminiModel(): string {
  const model = process.env.GOOGLE_GEMINI_MODEL;
  if (model) {
    return model;
  }
  // Default to gemini-2.5-flash (faster, cost-effective)
  return 'gemini-2.5-flash';
}

/**
 * Get Gemini client (lazy initialization)
 */
function getGeminiClient(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(getGeminiApiKey());
  }
  return _genAI;
}

/**
 * Get Gemini File Manager (lazy initialization)
 */
function getFileManager(): GoogleAIFileManager {
  if (!_fileManager) {
    _fileManager = new GoogleAIFileManager(getGeminiApiKey());
  }
  return _fileManager;
}

/**
 * Map appeal types to document keywords for better template matching
 * Exported from openai-utils.ts for consistency
 */
export const APPEAL_TYPE_KEYWORDS: Record<string, string[]> = {
  'related-account': ['related', 'multiple accounts', 'account access', 'password policy', 'two-step'],
  'kdp-acx-merch': ['KDP', 'ACX', 'Merch', 'Petru Nedelku', 'Kent Jameson', 'Jennifer Smith', 'Dimitri Jesse', 'publishing', 'book', 'content', 'manuscript'],
  'amazon-relay': ['Relay', 'carrier', 'driver', 'subcontract', 'VIN-match', 'ELD', 'BOL'],
  'intellectual-property': ['IP', 'copyright', 'trademark', 'patent', 'Paula Guran', 'Heartwood', 'USPTO', 'DMCA'],
  'seller-code-conduct': ['review manipulation', 'Zachary Munoz', 'forged', 'multiple accounts'],
  'drop-shipping': ['dropship', 'drop-ship', 'SA -', 'packing slip', 'seller-of-record'],
  'restricted-products': ['restricted', 'disease claims', 'Carlos Shah', 'FLOLEAF', 'supplement', 'FDA', 'COA', 'GMP'],
  'used-sold-as-new': ['used sold as new', 'condition', 'ODR', 'Robert Harvey', 'Mark Hanson', 'quality control'],
  'high-cancellation': ['cancellation', 'sales velocity', 'Believegroup', 'Brillias', 'inventory'],
  'verification-failure': ['verification', 'Viking Investments', 'utility bill', 'document'],
  'detail-page-abuse': ['detail page', 'Sanjay Gupta', 'title', 'bullets', 'images'],
  'category-approval': ['category', 'CPC', 'S. Topper', 'lab report', 'certification'],
  'brand-registry': ['brand registry', 'Adrian Vizireanu', 'trademark'],
  'inauthenticity-supply-chain': ['inauthentic', 'supply chain', 'Maaz Ahmed', 'Tina Pere', 'Saarang Ayaz', 'LOA', 'invoice', 'supplier'],
  'account-compromised': ['hack', 'compromised', 'Erica Sutton', 'unauthorized access'],
  'fba-shipping': ['FBA', 'Sandadi Reddy', 'shipping', 'barcode'],
  'marketplace-pricing': ['fair pricing', 'Jan Pohnan', 'pricing'],
};

/**
 * Build semantic query from form data for RAG retrieval
 */
export function buildSemanticQuery(formData: AppealFormData): string {
  const parts: string[] = [];

  // Primary appeal type
  parts.push(`Appeal type: ${formData.appealType}`);

  // Add keywords for this appeal type
  const keywords = APPEAL_TYPE_KEYWORDS[formData.appealType] || [];
  if (keywords.length > 0) {
    parts.push(`Keywords: ${keywords.join(', ')}`);
  }

  // Root causes (limit to first 5 for query length)
  if (formData.rootCauses.length > 0) {
    parts.push(`Root causes: ${formData.rootCauses.slice(0, 5).join(', ')}`);
  }

  // Corrective actions (limit to first 5)
  if (formData.correctiveActionsTaken.length > 0) {
    parts.push(`Actions taken: ${formData.correctiveActionsTaken.slice(0, 5).join(', ')}`);
  }

  // Preventive measures (limit to first 5)
  if (formData.preventiveMeasures.length > 0) {
    parts.push(`Prevention: ${formData.preventiveMeasures.slice(0, 5).join(', ')}`);
  }

  // Additional context if available
  if (formData.rootCauseDetails) {
    parts.push(`Details: ${formData.rootCauseDetails.substring(0, 200)}`);
  }

  return parts.join('. ') + '.';
}

/**
 * Query Gemini for relevant template chunks using generation with file context
 *
 * @param formData - The appeal form data
 * @param sectionId - Optional section ID for more targeted retrieval
 * @returns Retrieved chunks and citations
 */
export async function queryGeminiFileSearch(
  formData: AppealFormData,
  sectionId?: number
): Promise<{ retrievedChunks: string[]; citations: Array<{ documentName: string; score: number; chunkIndex: number }> }> {
  try {
    console.log('🔍 Querying Gemini for relevant template content...');

    // Load configuration from DynamoDB
    const config = await loadActiveConfig<TemplatesConfig>('templates');

    if (!config?.configData?.documents || config.configData.documents.length === 0) {
      console.warn('⚠️  No templates found in configuration');
      throw new Error('No templates available for RAG');
    }

    // Build semantic query
    const semanticQuery = buildSemanticQuery(formData);
    console.log(`📝 Semantic query: ${semanticQuery.substring(0, 150)}...`);

    // Get enabled templates for this appeal type
    // Note: Gemini 2.5 models only support plain text files, not DOCX
    const enabledTemplates = config.configData.documents.filter(
      (doc) => doc.enabled &&
               doc.appealTypes.includes(formData.appealType) &&
               doc.geminiFileId &&
               doc.fileType !== 'docx' // Filter out DOCX files - not supported by Gemini 2.5
    );

    console.log(`📚 Found ${enabledTemplates.length} enabled templates for appeal type: ${formData.appealType}`);

    if (enabledTemplates.length === 0) {
      console.warn('⚠️  No enabled templates with Gemini File IDs found for this appeal type');
      console.warn('💡 Gemini 2.5 only supports TXT files, not DOCX files');
      console.warn('💡 Ensure templates are uploaded as .txt files to use Gemini RAG');
      throw new Error('No Gemini templates available for this appeal type');
    }

    // Use Gemini 2.5 Flash with file grounding (as shown in Google's docs)
    const genAI = getGeminiClient();
    const geminiModel = getGeminiModel();
    console.log(`🤖 Using Gemini model: ${geminiModel}`);
    const model = genAI.getGenerativeModel({
      model: geminiModel,
    });

    // Create prompt for Gemini to analyze the template files
    const prompt = `You are analyzing Amazon seller appeal template documents to extract relevant examples.

Appeal Type: ${formData.appealType}
Context: ${semanticQuery}

Based on the provided template files, extract the most relevant sections that would help write this type of appeal. Focus on:
1. Similar root cause explanations
2. Relevant corrective actions
3. Appropriate preventive measures
4. Professional tone and structure

Extract key sections and separate them with "---SECTION---" markers.`;

    // Prepare file references in the correct format
    // The Gemini API expects file URIs that were returned from the upload
    const parts = [
      { text: prompt },
    ];

    // Add file references (limit to 10 for token constraints)
    for (const doc of enabledTemplates.slice(0, 10)) {
      if (doc.geminiFileId) {
        // Gemini 2.5 models require full HTTPS URIs for file references
        const fileUri = doc.geminiFileId.startsWith('https://')
          ? doc.geminiFileId
          : `https://generativelanguage.googleapis.com/v1beta/${doc.geminiFileId}`;

        parts.push({
          fileData: {
            fileUri: fileUri,
            mimeType: 'text/plain', // Gemini 2.5 models work best with plain text
          }
        });
      }
    }

    console.log(`📤 Querying ${geminiModel} with ${parts.length - 1} template files...`);

    // Generate content with file grounding
    const result = await model.generateContent(parts);
    const response = result.response;
    const extractedText = response.text();

    console.log(`✅ Received response from Gemini (${extractedText.length} chars)`);

    // Split the response into chunks
    const chunks = extractedText.split('---SECTION---')
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 100); // Filter out very short chunks

    // Create citations for each chunk
    const citations = chunks.map((_, index) => ({
      documentName: enabledTemplates[Math.min(index, enabledTemplates.length - 1)]?.documentName || 'Template',
      score: 0.85, // Gemini doesn't provide scores, so we use a high default
      chunkIndex: index,
    }));

    console.log(`✅ Extracted ${chunks.length} relevant sections from templates`);

    return {
      retrievedChunks: chunks.slice(0, 20), // Limit to 20 chunks
      citations: citations.slice(0, 20),
    };

  } catch (error) {
    console.error('❌ Error querying Gemini:', error);

    // Provide specific error diagnostics
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        console.error('💡 Model not found. Current model:', getGeminiModel());
        console.error('💡 Available models: gemini-2.5-flash, gemini-2.5-pro');
        console.error('💡 Set GOOGLE_GEMINI_MODEL in your .env file');
      }
      if (error.message.includes('API key')) {
        console.error('💡 Check that GOOGLE_GEMINI_API_KEY is correctly set');
      }
      if (error.message.includes('Unsupported file URI') || error.message.includes('Unsupported MIME type')) {
        console.error('💡 File format issue. Gemini 2.5 requires plain text files, not DOCX');
        console.error('💡 Ensure templates are in .txt format and re-run: npm run migrate-to-gemini');
      }
      if (error.message.includes('400')) {
        console.error('💡 Bad Request - check file format and API compatibility');
      }
    }

    throw error;
  }
}

/**
 * Format retrieved chunks into context string for OpenAI
 */
export function formatRetrievedContext(
  chunks: string[],
  citations: Array<{ documentName: string; score: number; chunkIndex: number }>
): string {
  if (chunks.length === 0) {
    return '';
  }

  const parts: string[] = [];

  parts.push('=== RELEVANT TEMPLATE EXAMPLES ===\n');
  parts.push('The following are sections from successful appeal templates:\n');

  chunks.forEach((chunk, i) => {
    const citation = citations[i];
    if (citation) {
      parts.push(`\n--- TEMPLATE ${i + 1} (from ${citation.documentName}, relevance: ${citation.score.toFixed(2)}) ---`);
    } else {
      parts.push(`\n--- TEMPLATE ${i + 1} ---`);
    }
    parts.push(chunk);
  });

  return parts.join('\n');
}

/**
 * Upload a document to Gemini File API
 *
 * @param filePath - Local file path
 * @param mimeType - MIME type of the file
 * @param displayName - Display name for the file
 * @returns Gemini file ID
 */
export async function uploadFileToGemini(
  filePath: string,
  mimeType: string,
  displayName: string
): Promise<string> {
  try {
    console.log(`📤 Uploading file to Gemini: ${displayName}`);

    const fileManager = getFileManager();

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName,
    });

    console.log(`✅ File uploaded successfully: ${uploadResult.file.name}`);
    return uploadResult.file.name; // Returns files/abc123...

  } catch (error) {
    console.error(`❌ Error uploading file to Gemini:`, error);
    throw error;
  }
}

/**
 * Delete a file from Gemini File API
 *
 * @param fileId - Gemini file ID (files/abc123)
 */
export async function deleteFileFromGemini(fileId: string): Promise<void> {
  try {
    console.log(`🗑️  Deleting file from Gemini: ${fileId}`);

    const fileManager = getFileManager();
    await fileManager.deleteFile(fileId);

    console.log(`✅ File deleted successfully: ${fileId}`);

  } catch (error) {
    console.error(`❌ Error deleting file from Gemini:`, error);
    throw error;
  }
}

/**
 * List all files in Gemini File API
 */
export async function listGeminiFiles(): Promise<Array<{ name: string; displayName: string; mimeType: string }>> {
  try {
    const fileManager = getFileManager();
    const listResult = await fileManager.listFiles();

    // The API returns an object with a files property
    const filesArray = listResult.files || [];

    const files = filesArray.map((file: any) => ({
      name: file.name,
      displayName: file.displayName || '',
      mimeType: file.mimeType || '',
    }));

    return files;

  } catch (error) {
    console.error('❌ Error listing Gemini files:', error);
    throw error;
  }
}

/**
 * Fallback template retrieval (uses hardcoded templates as backup)
 * This is used when Gemini File Search is unavailable
 */
export function getFallbackTemplates(appealType: string): string[] {
  console.warn('⚠️  Using fallback template retrieval (Gemini unavailable)');

  // Return empty array - the calling code should handle fallback to DynamoDB embeddings
  return [];
}
