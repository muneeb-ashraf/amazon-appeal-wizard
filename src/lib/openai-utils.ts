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
 * Generate appeal letter with streaming support and chunked generation
 */
export async function generateAppealLetterWithStreaming(
  formData: AppealFormData,
  relevantDocuments: string[],
  onChunk?: (chunk: string, totalLength: number) => Promise<void>
): Promise<string> {
  try {
    // Create context from relevant documents
    const context = relevantDocuments.join('\n\n---TEMPLATE DOCUMENT---\n\n');

    // Build user message from form data
    const userMessage = buildUserMessageFromFormData(formData);

    // Generate appeal in 4 chunks for better timeout handling
    const sections = [
      {
        name: 'Opening & Introduction',
        prompt: `Generate ONLY the opening section of the appeal letter (greeting, introduction, and immediate context about the issue). Include:
- Professional greeting (Dear Seller Performance/Amazon Team/etc.)
- Brief introduction identifying the seller
- Clear statement of the issue/suspension
- Reference to any case numbers or ASINs
Keep this section concise (2-3 paragraphs).`
      },
      {
        name: 'Root Cause Analysis',
        prompt: `Generate ONLY the root cause section of the appeal. Include:
- Detailed explanation of what caused the issue
- Specific examples and timeline
- Investigation process
- Acknowledgment of responsibility
Make this comprehensive (3-4 paragraphs).`
      },
      {
        name: 'Corrective Actions',
        prompt: `Generate ONLY the corrective actions section. Include:
- Specific actions already taken (past tense)
- Documentation being provided
- Systems or processes changed
- People involved or hired
Make this detailed with concrete examples (3-4 paragraphs).`
      },
      {
        name: 'Prevention & Closing',
        prompt: `Generate ONLY the preventive measures and closing section. Include:
- 10-15 detailed preventive steps (organized by category)
- Future monitoring commitments
- Professional closing statement
- Full signature block with contact information
Make this very comprehensive (4-5 paragraphs plus bullet points).`
      }
    ];

    let fullAppeal = '';
    let totalLength = 0;

    // Build base system prompt
    const baseSystemPrompt = `You are an expert Amazon seller appeal writer with deep knowledge of Amazon's policies and successful appeal strategies.

You have access to successful Amazon appeal template documents below. Study their style, depth, and structure.

TEMPLATE DOCUMENTS:
${context}

USER INFORMATION:
${userMessage}

IMPORTANT: Generate ONLY the requested section. Match the professional tone and depth of the template documents.`;

    // Generate each section sequentially
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      console.log(`📝 Generating section ${i + 1}/4: ${section.name}`);

      const stream = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini', // Fast model to stay under timeout
        messages: [
          { role: 'system', content: baseSystemPrompt },
          { role: 'user', content: section.prompt },
        ],
        temperature: 0.85,
        max_tokens: 800, // ~800 tokens per section = ~3200 total
        stream: true,
      }, {
        timeout: 20000, // 20 second timeout per section
      });

      let sectionText = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          sectionText += content;
          fullAppeal += content;
          totalLength += content.length;
          
          if (onChunk) {
            await onChunk(content, totalLength);
          }
        }
      }

      // Add spacing between sections
      if (i < sections.length - 1) {
        fullAppeal += '\n\n';
        totalLength += 2;
      }

      console.log(`✅ Completed section ${i + 1}/4: ${section.name} (${sectionText.length} chars)`);
    }

    console.log(`✅ Full appeal generated: ${totalLength} characters`);
    return fullAppeal;

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
