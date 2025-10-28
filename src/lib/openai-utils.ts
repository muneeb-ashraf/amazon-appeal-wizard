// ============================================================================
// OPENAI UTILITIES FOR EMBEDDINGS AND APPEAL GENERATION
// ============================================================================

import OpenAI from 'openai';
import { getOpenAIKey } from './aws-config';
import { AppealFormData } from '@/types';

// Lazy OpenAI client initialization
let _openai: OpenAI | null = null;
const getOpenAIClient = () => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: getOpenAIKey(),
    });
  }
  return _openai;
};

/**
 * Create embeddings for a text document
 */
export async function createEmbedding(text: string): Promise<number[]> {
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error creating embedding:', error);
    throw new Error('Failed to create embedding');
  }
}

/**
 * Create embeddings for multiple documents
 */
export async function createBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    try {
      const embedding = await createEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error('Error in batch embedding:', error);
      // Continue with other texts
    }
  }

  return embeddings;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most relevant documents based on query embedding
 */
export function findRelevantDocuments(
  queryEmbedding: number[],
  documentEmbeddings: Array<{ text: string; embedding: number[] }>,
  topK: number = 20
): string[] {
  const similarities = documentEmbeddings.map((doc) => ({
    text: doc.text,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Log similarity scores for debugging
  console.log('📊 Top document similarities:');
  similarities.slice(0, Math.min(10, topK)).forEach((item, index) => {
    const preview = item.text.substring(0, 100).replace(/\n/g, ' ');
    console.log(`  ${index + 1}. Similarity: ${item.similarity.toFixed(4)} - ${preview}...`);
  });

  // Return top K documents
  return similarities.slice(0, topK).map((item) => item.text);
}

/**
 * Generate appeal letter using OpenAI based on form data and relevant documents
 */
export async function generateAppealLetter(
  formData: AppealFormData,
  relevantDocuments: string[]
): Promise<string> {
  return generateAppealLetterWithStreaming(formData, relevantDocuments);
}

/**
 * Section definitions for chunked appeal generation
 */
export const APPEAL_SECTIONS = [
  {
    id: 1,
    name: 'Opening & Introduction',
    prompt: `Generate ONLY the opening section of the appeal letter (greeting, introduction, and immediate context about the issue). Include:
- Professional greeting (Dear Seller Performance/Amazon Team/etc.)
- Brief introduction identifying the seller
- Clear statement of the issue/suspension
- Reference to any case numbers or ASINs
Keep this section concise (2-3 paragraphs).`,
    maxTokens: 700
  },
  {
    id: 2,
    name: 'Root Cause Analysis',
    prompt: `Generate ONLY the root cause section of the appeal. Include:
- Detailed explanation of what caused the issue
- Specific examples and timeline
- Investigation process
- Acknowledgment of responsibility
Make this comprehensive (3-4 paragraphs).`,
    maxTokens: 800
  },
  {
    id: 3,
    name: 'Corrective Actions',
    prompt: `Generate ONLY the corrective actions section. Include:
- Specific actions already taken (past tense)
- Documentation being provided
- Systems or processes changed
- People involved or hired
Make this detailed with concrete examples (3-4 paragraphs).`,
    maxTokens: 800
  },
  {
    id: 4,
    name: 'Preventive Measures',
    prompt: `Generate ONLY the preventive measures section. Include:
- 10-15 detailed preventive steps (organized by category)
- Future monitoring commitments
- Quality control processes
- Ongoing compliance measures
Make this very comprehensive (4-5 paragraphs with bullet points).`,
    maxTokens: 900
  },
  {
    id: 5,
    name: 'Closing & Signature',
    prompt: `Generate ONLY the closing section of the appeal. Include:
- Professional closing statement expressing commitment
- Request for reinstatement/resolution
- Appreciation for consideration
- Full signature block with:
  * Seller name
  * Business name
  * Contact email
  * Contact phone (if provided)
Keep this professional and concise (2-3 paragraphs).`,
    maxTokens: 500
  }
];

/**
 * Generate a single section of the appeal letter
 * This function is designed to be called separately for each section,
 * allowing each call to have its own 30-second Lambda timeout window
 */
export async function generateAppealSection(
  sectionId: number,
  formData: AppealFormData,
  relevantDocuments: string[],
  previousSections: string[] = []
): Promise<string> {
  try {
    const section = APPEAL_SECTIONS.find(s => s.id === sectionId);
    if (!section) {
      throw new Error(`Invalid section ID: ${sectionId}`);
    }

    console.log(`📝 Generating section ${sectionId}/5: ${section.name}`);

    // Create context from relevant documents
    const context = relevantDocuments.join('\n\n---TEMPLATE DOCUMENT---\n\n');

    // Build user message from form data
    const userMessage = buildUserMessageFromFormData(formData);

    // Build system prompt with context
    const systemPrompt = `You are an expert Amazon seller appeal writer with deep knowledge of Amazon's policies and successful appeal strategies.

You have access to successful Amazon appeal template documents below. Study their style, depth, and structure.

TEMPLATE DOCUMENTS:
${context}

USER INFORMATION:
${userMessage}

${previousSections.length > 0 ? `PREVIOUSLY GENERATED SECTIONS:
${previousSections.join('\n\n---SECTION BREAK---\n\n')}

` : ''}IMPORTANT: Generate ONLY the requested section (${section.name}). Match the professional tone and depth of the template documents. Ensure smooth continuation from previous sections if they exist.`;

    const stream = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini', // Fast model to stay under timeout
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: section.prompt },
      ],
      temperature: 0.85,
      max_tokens: section.maxTokens,
      stream: true,
    }, {
      timeout: 25000, // 25 second timeout (leaves 5s buffer for Lambda)
    });

    let sectionText = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        sectionText += content;
      }
    }

    console.log(`✅ Completed section ${sectionId}/5: ${section.name} (${sectionText.length} chars)`);
    return sectionText;

  } catch (error) {
    const section = APPEAL_SECTIONS.find(s => s.id === sectionId);
    console.error(`Error generating section ${sectionId}:`, error);
    throw new Error(`Failed to generate section ${sectionId}: ${section?.name || 'Unknown'}`);
  }
}

/**
 * Generate appeal letter with streaming support and chunked generation
 * @deprecated Use generateAppealSection for individual sections instead
 */
export async function generateAppealLetterWithStreaming(
  formData: AppealFormData,
  relevantDocuments: string[],
  onChunk?: (chunk: string, totalLength: number) => Promise<void>
): Promise<string> {
  try {
    // This function is kept for backward compatibility but should not be used
    // for production due to timeout issues. Use generateAppealSection instead.
    console.warn('⚠️  generateAppealLetterWithStreaming is deprecated. Use generateAppealSection for each section separately.');
    
    const sections: string[] = [];
    
    for (let i = 0; i < APPEAL_SECTIONS.length; i++) {
      const sectionText = await generateAppealSection(
        APPEAL_SECTIONS[i].id,
        formData,
        relevantDocuments,
        sections
      );
      sections.push(sectionText);
      
      if (onChunk) {
        const fullText = sections.join('\n\n');
        await onChunk(sectionText, fullText.length);
      }
    }

    return sections.join('\n\n');

  } catch (error) {
    console.error('Error generating appeal letter:', error);
    throw new Error('Failed to generate appeal letter');
  }
}

/**
 * Get appeal type specific guidance based on violation category
 */
function getAppealTypeGuidance(appealType: string): string {
  const guidanceMap: Record<string, string> = {
    'inauthenticity-supply-chain': 
      'Focus on: Supply chain documentation (invoices, LOA), authorized distributor verification, retail arbitrage issues. Often requires detailed supplier information and proof of authenticity.',
    'intellectual-property': 
      'Focus on: Trademark/copyright/patent details, USPTO verification, authorized reseller proof, retraction requests, DMCA counter-notices. May need attorney involvement.',
    'seller-code-conduct': 
      'Focus on: Review manipulation, multiple accounts, forged documents. Requires detailed acknowledgment of policy violations and concrete preventive systems.',
    'related-account': 
      'Focus on: Related account identification, explanation of relationship, closure or reinstatement of related account.',
    'drop-shipping': 
      'Focus on: Fulfillment model changes, inventory management, shipping compliance, supplier documentation.',
    'restricted-products': 
      'Focus on: Product compliance, certifications (COA, GMP), disease claims removal, ingredient verification, regulatory approvals.',
    'used-sold-as-new': 
      'Focus on: Product condition, quality control, sourcing verification, customer experience improvements.',
    'high-cancellation': 
      'Focus on: Inventory management, fulfillment processes, order fulfillment rates, sales velocity controls.',
    'marketplace-pricing': 
      'Focus on: Pricing strategies, fair market value, pricing errors correction, automated pricing tool issues.',
    'verification-failure': 
      'Focus on: Document verification (utility bill, ID, bank statement), address matching, document validity.',
    'account-compromised': 
      'Focus on: Account security, unauthorized access, password changes, security measures implementation.',
    'deceptive-activity': 
      'Focus on: Business practices review, legal compliance, fraud prevention measures.',
    'detail-page-abuse': 
      'Focus on: Listing compliance (title, bullets, images), style guide adherence, UPC validity.',
    'category-approval': 
      'Focus on: Category requirements (CPC, lab reports), product certifications, safety documentation.',
    'kdp-acx-merch': 
      'Focus on: Content guidelines, IP compliance, misleading content removal, publishing platform policies.',
    'fba-shipping': 
      'Focus on: FBA requirements, barcode compliance, packaging standards, shipping violations.',
    'amazon-relay': 
      'Focus on: Relay-specific policies, subcontracting issues, driver compliance.',
    'brand-registry': 
      'Focus on: Brand verification, trademark issues, brand registry requirements.'
  };

  return guidanceMap[appealType] || 'Focus on: Comprehensive understanding of the violation, specific corrective actions, and robust preventive measures.';
}

/**
 * Build user message from form data
 */
function buildUserMessageFromFormData(formData: AppealFormData): string {
  const parts: string[] = [];

  // Emphasize appeal type early for better matching
  parts.push(`=== APPEAL GENERATION REQUEST ===\n`);
  parts.push(`PRIMARY ISSUE TYPE: ${formData.appealType}`);
  parts.push(`\nI need a comprehensive, professional Amazon appeal letter for: ${formData.appealType}`);
  
  // Add appeal-specific guidance
  const guidance = getAppealTypeGuidance(formData.appealType);
  parts.push(`\nKEY FOCUS AREAS FOR THIS APPEAL TYPE: ${guidance}\n`);

  // Account information
  parts.push(`=== SELLER INFORMATION ===`);
  parts.push(`Full Name/Business: ${formData.fullName}`);
  parts.push(`Store Name: ${formData.storeName}`);
  parts.push(`Email: ${formData.email}`);
  if (formData.sellerId) {
    parts.push(`Seller ID/Merchant Token: ${formData.sellerId}`);
  }
  if (formData.asins.length > 0) {
    parts.push(`Affected ASINs: ${formData.asins.join(', ')}`);
  }
  parts.push('');

  // Context-specific details for better matching
  if (formData.unauthorizedSupplier) {
    parts.push(`=== SUPPLIER/SOURCE ISSUE ===`);
    parts.push(formData.unauthorizedSupplier);
    parts.push('');
  }

  if (formData.relatedAccountReason) {
    parts.push(`=== RELATED ACCOUNT DETAILS ===`);
    parts.push(formData.relatedAccountReason);
    parts.push('');
  }

  if (formData.categoryRejectionReason) {
    parts.push(`=== CATEGORY/APPROVAL ISSUE ===`);
    parts.push(formData.categoryRejectionReason);
    parts.push('');
  }

  if (formData.detailPageAbuseArea && formData.detailPageAbuseArea.length > 0) {
    parts.push(`=== DETAIL PAGE AREAS AFFECTED ===`);
    formData.detailPageAbuseArea.forEach((area) => parts.push(`- ${area}`));
    parts.push('');
  }

  // Root causes
  if (formData.rootCauses.length > 0) {
    parts.push(`=== ROOT CAUSES IDENTIFIED ===`);
    formData.rootCauses.forEach((cause) => parts.push(`• ${cause}`));
    parts.push('');
  }

  if (formData.rootCauseDetails) {
    parts.push(`=== ADDITIONAL ROOT CAUSE CONTEXT ===`);
    parts.push(formData.rootCauseDetails);
    parts.push('');
  }

  // Corrective actions
  if (formData.correctiveActionsTaken.length > 0) {
    parts.push(`=== CORRECTIVE ACTIONS ALREADY TAKEN ===`);
    formData.correctiveActionsTaken.forEach((action) => parts.push(`• ${action}`));
    parts.push('');
  }

  if (formData.correctiveActionsDetails) {
    parts.push(`=== ADDITIONAL CORRECTIVE ACTION DETAILS ===`);
    parts.push(formData.correctiveActionsDetails);
    parts.push('');
  }

  // Preventive measures
  if (formData.preventiveMeasures.length > 0) {
    parts.push(`=== PREVENTIVE MEASURES TO BE IMPLEMENTED ===`);
    formData.preventiveMeasures.forEach((measure) => parts.push(`• ${measure}`));
    parts.push('');
  }

  if (formData.preventiveMeasuresDetails) {
    parts.push(`=== ADDITIONAL PREVENTIVE MEASURE DETAILS ===`);
    parts.push(formData.preventiveMeasuresDetails);
    parts.push('');
  }

  // Supporting documents
  if (formData.uploadedDocuments.length > 0) {
    parts.push(`=== SUPPORTING DOCUMENTS TO REFERENCE ===`);
    formData.uploadedDocuments.forEach((doc) => parts.push(`• ${doc.type}: ${doc.fileName}`));
    parts.push('');
  }

  parts.push(`\n=== GENERATION INSTRUCTIONS ===`);
  parts.push(`Create a comprehensive, professional appeal letter that:`);
  parts.push(`1. Follows the EXACT structure, depth, and formatting of similar templates for "${formData.appealType}"`);
  parts.push(`2. Includes ALL elements present in similar templates (documentation lists, supplier details, policy citations, multi-step processes, performance metrics, etc.)`);
  parts.push(`3. Uses the professional tone and specific terminology from the templates`);
  parts.push(`4. Provides the same level of detail - if templates have 10-15 preventive measures organized by category, match that depth`);
  parts.push(`5. Includes proper opening address, detailed root cause narrative, specific actions taken, comprehensive preventive measures, and professional closing with full contact information`);
  parts.push(`6. References specific policies, standards, or regulations as shown in similar templates`);
  parts.push(`7. Organizes preventive measures by category (e.g., "Sourcing Quality Control:", "Listings Quality Control:", etc.) as templates do`);
  parts.push(`\nDo NOT create a generic or simplified appeal. Match the comprehensive nature of the template documents provided.`);

  return parts.join('\n');
}

/**
 * Generate a single section with document context
 * This prepares embeddings and finds relevant documents, then generates one section
 */
export async function generateAppealSectionWithContext(
  sectionId: number,
  formData: AppealFormData,
  allDocumentTexts: string[],
  allDocumentEmbeddings: number[][],
  previousSections: string[] = []
): Promise<string> {
  try {
    // Create embedding for the user's appeal context
    const queryText = buildUserMessageFromFormData(formData);
    const queryEmbedding = await createEmbedding(queryText);

    // Find most relevant documents
    const documentsWithEmbeddings = allDocumentTexts.map((text, index) => ({
      text,
      embedding: allDocumentEmbeddings[index],
    }));

    const relevantDocs = findRelevantDocuments(queryEmbedding, documentsWithEmbeddings, 20);

    console.log(`✅ Selected ${relevantDocs.length} most relevant template documents for section ${sectionId}`);

    // Generate the section
    return await generateAppealSection(sectionId, formData, relevantDocs, previousSections);
  } catch (error) {
    console.error(`Error generating section ${sectionId} with context:`, error);
    throw error;
  }
}

/**
 * Generate appeal with document context
 */
export async function generateAppealWithContext(
  formData: AppealFormData,
  allDocumentTexts: string[],
  allDocumentEmbeddings: number[][],
  onChunk?: (chunk: string, totalLength: number) => Promise<void>
): Promise<string> {
  try {
    // Create embedding for the user's appeal context
    const queryText = buildUserMessageFromFormData(formData);
    const queryEmbedding = await createEmbedding(queryText);

    // Find most relevant documents (increased to 20 for maximum context)
    const documentsWithEmbeddings = allDocumentTexts.map((text, index) => ({
      text,
      embedding: allDocumentEmbeddings[index],
    }));

    const relevantDocs = findRelevantDocuments(queryEmbedding, documentsWithEmbeddings, 20);

    console.log(`✅ Selected ${relevantDocs.length} most relevant template documents for appeal generation`);
    console.log(`📝 These templates will guide the structure, depth, and specific elements of the appeal`);

    // Generate the appeal with streaming support
    return await generateAppealLetterWithStreaming(formData, relevantDocs, onChunk);
  } catch (error) {
    console.error('Error generating appeal with context:', error);
    throw error;
  }
}
