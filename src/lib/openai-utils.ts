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
  try {
    // Create context from relevant documents
    const context = relevantDocuments.join('\n\n---TEMPLATE DOCUMENT---\n\n');

    // Build the system prompt
    const systemPrompt = `You are an expert Amazon seller appeal writer with deep knowledge of Amazon's policies and successful appeal strategies. 

You have access to successful Amazon appeal template documents below. These templates represent REAL, APPROVED appeals with diverse structures, formats, and approaches based on different violation types and scenarios.

CRITICAL INSTRUCTIONS - ANALYZE AND REPLICATE ALL TEMPLATE ELEMENTS:

1. OPENING & ADDRESSING:
   - Study how templates open (e.g., "Dear Seller Performance Team", "Dear Mr. Bezos", "Dear Amazon Relay Team")
   - Note if they include immediate context about suspension/issue in the first paragraph
   - Some include case numbers, ASINs, or specific violation references right at the start

2. ROOT CAUSE SECTION - BE COMPREHENSIVE:
   - Templates often provide DETAILED narratives, not just bullet points
   - Include specific examples (e.g., "customer complained that book had highlighting", "products sourced from book fairs")
   - Reference specific violations with dates, ASINs, case numbers when applicable
   - Explain the investigation process (e.g., "I studied my communications with customers to better understand...")
   - Some include sub-sections explaining why Amazon's interpretation may be incorrect

3. ACTIONS TAKEN - BE SPECIFIC:
   - Templates list CONCRETE actions already completed (past tense)
   - Include specifics like "I have deleted ASINs X, Y, Z from inventory"
   - Reference documentation attached (e.g., "I have attached my government-issued photo ID", "We have attached our invoices")
   - Some mention hiring attorneys, terminating suppliers, or processing refunds
   - Include policy research done (e.g., "I have carefully read Amazon's anti-counterfeiting policy at [URL]")

4. PREVENTIVE MEASURES - MATCH TEMPLATE DEPTH:
   - Templates often have 10-15+ detailed preventive steps, organized by category
   - Use categorical organization (e.g., "Sourcing and Inventory Intake Quality Control:", "Listings Quality Control:")
   - Include multi-step verification processes with numbered sub-steps
   - Reference specific tools (e.g., "We have purchased the 'Check Permission' program")
   - Mention team roles (e.g., "We have appointed a qualified Quality Control supervisor")
   - Include monitoring commitments (e.g., "I will respond to all inquiries within 24 hours")
   - Reference specific metrics or performance standards when applicable

5. DOCUMENTATION REFERENCES:
   - Explicitly mention all supporting documents being attached
   - List them specifically (e.g., "I have attached: 1. Utility bill, 2. Bank statement, 3. Government ID")
   - Reference specific certifications, test reports, or legal documents by name

6. LEGAL & POLICY CITATIONS:
   - Include specific policy URLs when templates show them
   - Reference specific policy sections (e.g., "Section I.E.2.b of the Amazon Relay Program Policies")
   - Mention specific regulations or standards (e.g., "ASTM F963-17", "CPSIA Section 108")
   - Include patent numbers, trademark info, or legal case details when relevant

7. SUPPLIER/MANUFACTURER DETAILS:
   - When discussing sourcing, include complete supplier information as templates do
   - Full business names, addresses, contact information
   - Specific products or services from the supplier

8. PERFORMANCE METRICS & STANDARDS:
   - Some templates include specific performance metrics they'll maintain
   - Reference compliance standards, safety ratings, or quality benchmarks

9. TONE & LANGUAGE:
   - Professional but personal ("I" or "We")
   - Takes full responsibility without making excuses
   - Shows understanding of Amazon's concerns
   - Demonstrates commitment to long-term compliance
   - Respectful and solution-focused

10. CLOSING:
    - Professional closing statement expressing commitment
    - Full signature block with name, business name, email, seller ID/merchant token
    - Some include additional contact information

DO NOT create generic appeals. STUDY the templates thoroughly and replicate their comprehensive, detailed, case-specific approach. If a template is 5 pages long with 15 preventive measures, yours should be similarly comprehensive.

Below are the most relevant template documents for this type of appeal:

---TEMPLATE DOCUMENTS START---
${context}
---TEMPLATE DOCUMENTS END---

Study these templates exhaustively and create a new appeal that matches their depth, specificity, and structure while being completely customized to the seller's specific case. Include all relevant elements you see in similar templates (documentation lists, supplier details, policy citations, multi-step processes, etc.).`;

    // Build user message from form data
    const userMessage = buildUserMessageFromFormData(formData);

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.85,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || '';
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
  allDocumentEmbeddings: number[][]
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

    // Generate the appeal
    return await generateAppealLetter(formData, relevantDocs);
  } catch (error) {
    console.error('Error generating appeal with context:', error);
    throw error;
  }
}
