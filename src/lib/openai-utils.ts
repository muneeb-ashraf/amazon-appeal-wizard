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
 * Map appeal types to document keywords for better template matching
 */
const APPEAL_TYPE_KEYWORDS: Record<string, string[]> = {
  'related-account': ['related', 'multiple accounts'],
  'kdp-acx-merch': ['KDP', 'ACX', 'Merch', 'Petru Nedelku', 'Kent Jameson', 'Jennifer Smith', 'Dimitri Jesse'],
  'amazon-relay': ['Relay', 'carrier', 'driver', 'subcontract'],
  'intellectual-property': ['IP', 'copyright', 'trademark', 'patent', 'Paula Guran', 'Heartwood'],
  'seller-code-conduct': ['review manipulation', 'Zachary Munoz', 'forged'],
  'drop-shipping': ['dropship', 'drop-ship', 'SA -'],
  'restricted-products': ['restricted', 'disease claims', 'Carlos Shah', 'FLOLEAF', 'supplement'],
  'used-sold-as-new': ['used sold as new', 'condition', 'ODR', 'Robert Harvey', 'Mark Hanson'],
  'high-cancellation': ['cancellation', 'sales velocity', 'Believegroup', 'Brillias'],
  'verification-failure': ['verification', 'Viking Investments'],
  'detail-page-abuse': ['detail page', 'Sanjay Gupta'],
  'category-approval': ['category', 'CPC', 'S. Topper'],
  'brand-registry': ['brand registry', 'Adrian Vizireanu'],
  'inauthenticity-supply-chain': ['inauthentic', 'supply chain', 'Maaz Ahmed', 'Tina Pere', 'Saarang Ayaz'],
  'account-compromised': ['hack', 'compromised', 'Erica Sutton'],
  'fba-shipping': ['FBA', 'Sandadi Reddy'],
  'marketplace-pricing': ['fair pricing', 'Jan Pohnan'],
};

/**
 * Find most relevant documents based on query embedding and appeal type
 * Improved to prioritize appeal-type-specific templates
 */
export function findRelevantDocuments(
  queryEmbedding: number[],
  documentEmbeddings: Array<{ text: string; embedding: number[]; metadata?: { documentName?: string } }>,
  topK: number = 20,
  appealType?: string
): string[] {
  // Calculate similarities
  const similarities = documentEmbeddings.map((doc) => ({
    text: doc.text,
    documentName: doc.metadata?.documentName || '',
    similarity: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // If appeal type is provided, boost scores for matching documents
  if (appealType && APPEAL_TYPE_KEYWORDS[appealType]) {
    const keywords = APPEAL_TYPE_KEYWORDS[appealType];

    similarities.forEach((item) => {
      const docNameLower = item.documentName.toLowerCase();
      // Check if document name contains any of the keywords for this appeal type
      const hasKeyword = keywords.some(keyword =>
        docNameLower.includes(keyword.toLowerCase())
      );

      if (hasKeyword) {
        // Boost similarity score for type-matching documents
        item.similarity = item.similarity * 1.5;
        console.log(`🎯 Boosted relevance for ${item.documentName.substring(0, 50)}...`);
      }
    });
  }

  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);

  // Log similarity scores for debugging
  console.log(`📊 Top document similarities${appealType ? ' (with ' + appealType + ' boosting)' : ''}:`);
  similarities.slice(0, Math.min(10, topK)).forEach((item, index) => {
    const preview = item.text.substring(0, 80).replace(/\n/g, ' ');
    const docName = item.documentName ? ` [${item.documentName.substring(0, 30)}...]` : '';
    console.log(`  ${index + 1}. Similarity: ${item.similarity.toFixed(4)}${docName} - ${preview}...`);
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
 * Get the correct addressee based on appeal type
 */
function getAppealAddressee(appealType: string): string {
  const addresseeMap: Record<string, string> = {
    'kdp-acx-merch': 'Dear Amazon KDP Team,',
    'amazon-relay': 'Dear Amazon Relay Compliance (ATS),',
    'brand-registry': 'Dear Amazon Brand Registry Team,',
    'merch-termination': 'Dear Amazon Merch Team,',
  };

  return addresseeMap[appealType] || 'Dear Seller Performance Team,';
}

/**
 * Section definitions for chunked appeal generation
 */
export const APPEAL_SECTIONS = [
  {
    id: 1,
    name: 'Opening & Introduction',
    prompt: `Generate ONLY the opening section of the appeal letter (greeting, introduction, and immediate context about the issue). Include:
- Professional greeting addressed to the CORRECT TEAM based on the appeal type
- Brief introduction identifying the seller
- Clear statement of the issue/suspension
- Reference to any case numbers or ASINs (ONLY if provided)
Keep this section concise (2-3 paragraphs).

CRITICAL RULES:
- DO NOT use placeholder text like [insert case number], [add details], etc.
- If specific information (like case numbers, dates) is not provided, simply don't mention it
- Use only the actual information provided in the user data
- Use the CORRECT addressee for the appeal type`,
    maxTokens: 700
  },
  {
    id: 2,
    name: 'Root Cause Analysis',
    prompt: `Generate ONLY the root cause section of the appeal. Include:
- Clear section heading: "Root Cause Analysis" (plain text, not markdown)
- Detailed explanation of what caused the issue
- Investigation process and findings
- Timeline (ONLY if actual dates are provided - otherwise describe events generally)
- Acknowledgment of responsibility
- 🔥 IF DOCUMENTS ARE UPLOADED: Reference specific details from the uploaded documents to explain the root cause
Make this comprehensive (3-4 paragraphs).

CRITICAL RULES:
- DO NOT use placeholder text like [insert date], [add information], etc.
- DO NOT use markdown formatting (###, **, etc.)
- If dates aren't provided, describe the sequence of events without specific dates
- Write in clear paragraph form without markdown
- 🚨 IF UPLOADED DOCUMENTS CONTAIN RELEVANT INFORMATION: Cite specific details (e.g., "Upon reviewing the invoice dated March 15, 2024 from XYZ Supplier...")`,
    maxTokens: 800
  },
  {
    id: 3,
    name: 'Corrective Actions',
    prompt: `Generate ONLY the corrective actions section. Include:
- Clear section heading: "Corrective Actions Taken" (plain text, not markdown)
- Specific actions already taken (past tense: "I have implemented...", "I completed...")
- Documentation gathered and being provided
- 🔥 MANDATORY IF DOCUMENTS UPLOADED: Explicitly reference each uploaded document with specific details from its content
- Systems or processes changed
- People involved or hired
Make this detailed with concrete examples (3-4 paragraphs).

CRITICAL RULES:
- DO NOT use placeholder text like [insert date], [add details]
- DO NOT use markdown headers (###) or bullet formatting (-)
- Write in paragraph form with clear transitions
- Use past tense for completed actions
- 🚨 FOR EACH UPLOADED DOCUMENT: Reference it specifically with actual data points:
  * Example: "I have attached invoices from ABC Wholesale (Invoice #12345 dated March 15, 2024) showing the purchase of 500 units of Product XYZ"
  * Example: "The attached Certificate of Analysis from SGS Labs confirms our products meet all safety standards (see attached COA-2024-0315.pdf)"
  * Example: "As demonstrated in the attached supplier documentation, we have established a relationship with authorized distributor DEF Corp"
- DO NOT just say "see attached" - be SPECIFIC about what each document proves`,
    maxTokens: 800
  },
  {
    id: 4,
    name: 'Preventive Measures',
    prompt: `Generate ONLY the preventive measures section. This is CRITICAL: The preventive measures MUST be specifically tailored to the violation type and MUST directly relate to the corrective actions already taken.

IMPORTANT: DO NOT use generic categories like "Sourcing, Listings, Training, Monitoring" unless they are specifically relevant to this appeal type.

Instead, create SPECIFIC preventive measure categories that match the violation:
- For Related Accounts: Focus on account security, password policies, access controls, two-step verification, separate computers, AWS service provider procedures
- For KDP/Publishing: Focus on plagiarism checks, metadata guidelines, title/cover similarity checks, content monitoring, professional editing
- For Relay: Focus on VIN-match rules, carrier documentation, ELD compliance, driver training, trip packet procedures, no sub-brokering controls
- For Review Manipulation: Focus on internal communication only, no third-party review services, no incentivized reviews, monitoring customer feedback
- For Drop-Shipping: Focus on seller-of-record compliance, packing slip requirements, supplier quality control, inventory management
- For Restricted Products: Focus on compliance verification, product certifications, label sanitization, medical claims removal, safety testing
- For Sales Velocity: Focus on sales monitoring, inventory accuracy, no rank manipulation, no fake orders
- For ODR/Condition Complaints: Focus on inventory quality control, packing/shipping procedures, warehouse supervision
- For Verification: Focus on document maintenance, regular policy monitoring, customer service excellence

Structure:
- Clear section heading: "Preventive Measures to Avoid Future Issues" or similar (plain text, not markdown)
- Organize by 2-4 SPECIFIC categories directly related to the violation (NOT generic categories)
- Each category should have multiple detailed, concrete preventive steps
- Total 10-15 specific preventive measures
- All measures must logically follow from and reinforce the corrective actions

CRITICAL RULES:
- Preventive measures MUST be violation-specific, NOT generic
- Link each preventive category directly to the root cause and corrective actions
- DO NOT use markdown headers (###) or bullet formatting (-)
- Write in paragraph form with clear category transitions
- Use PRESENT TENSE, not future tense (e.g., "I source products" NOT "I will source products", "I conduct checks" NOT "I will conduct checks")
- Avoid using "will" - use present tense to describe ongoing practices
- Make it as detailed and specific as the template documents for this appeal type`,
    maxTokens: 1000
  },
  {
    id: 5,
    name: 'Closing & Signature',
    prompt: `Generate ONLY the closing section of the appeal. Include:
- Professional closing statement expressing commitment
- Request for reinstatement/resolution
- Appreciation for consideration
- Closing salutation (e.g., "Thank you for your consideration," or "Sincerely,")
- Full signature block with EACH item on a SEPARATE LINE:
  * Full name / Business name (on its own line)
  * Business/store name (on its own line, if different from above)
  * Merchant Token ID: [value] or Seller ID: [value] (on its own line) - THIS IS MANDATORY
  * Email address (on its own line)
  * DO NOT include phone number or any placeholder text like "[Contact phone not provided]"

CRITICAL SIGNATURE FORMATTING REQUIREMENTS:
1. EVERY appeal MUST be signed with ALL FOUR elements: Name, Company/Store Name, Merchant Token/Seller ID, and Email
2. The Merchant Token/Seller ID is MANDATORY - format as "Merchant Token ID: [value]" or "Seller ID: [value]"
3. Each element must be on its own separate line
4. DO NOT use placeholder brackets or missing information messages
5. Use EXACT formatting as shown in examples below:

Example 1 (with Merchant Token):
Thank you for your consideration,

John Smith
ABC Store LLC
Merchant Token ID: A1234567890
john@example.com

Example 2 (with Seller ID):
Sincerely,

CRB Ventures
Merchant Token ID: A3K9L2M1P4Q7R8
crb3312@gmail.com

Example 3 (Full format):
Thank you for your consideration,

Francesco Cecchini
FC International Trading
Seller ID: A1B2C3D4E5F6G7
francesco@fctrading.com

IMPORTANT: All four signature elements (Name, Company, Merchant Token/Seller ID, Email) are REQUIRED for every appeal.`,
    maxTokens: 600
  }
];

/**
 * Get adjusted max tokens for KDP appeals (which have 4,000 character limit)
 * Roughly 1 token = 4 characters, so 4000 chars = ~1000 tokens total
 */
function getAdjustedMaxTokens(sectionId: number, baseMaxTokens: number, appealType: string): number {
  if (appealType === 'kdp-acx-merch') {
    // KDP has 4,000 character limit (≈1,000 tokens total)
    // Distribute across sections: Opening(150), Root(200), Corrective(250), Preventive(250), Closing(150)
    const kdpTokenLimits: Record<number, number> = {
      1: 150,  // Opening
      2: 200,  // Root Cause
      3: 250,  // Corrective
      4: 250,  // Preventive
      5: 150,  // Closing
    };
    return kdpTokenLimits[sectionId] || Math.floor(baseMaxTokens * 0.4);
  }
  return baseMaxTokens;
}

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

    // Check if this is a KDP appeal
    const isKDP = formData.appealType === 'kdp-acx-merch';
    const adjustedMaxTokens = getAdjustedMaxTokens(sectionId, section.maxTokens, formData.appealType);

    if (isKDP) {
      console.log(`⚠️  KDP Appeal - Using reduced token limit: ${adjustedMaxTokens} (4,000 character limit)`);
    }

    // Create context from relevant documents
    const context = relevantDocuments.join('\n\n---TEMPLATE DOCUMENT---\n\n');

    // Build user message from form data
    const userMessage = buildUserMessageFromFormData(formData);

    // Get correct addressee for this appeal type
    const correctAddressee = getAppealAddressee(formData.appealType);

    // Build system prompt with context
    const systemPrompt = `You are an expert Amazon seller appeal writer with deep knowledge of Amazon's policies and successful appeal strategies.

You have access to successful Amazon appeal template documents below. Study their style, depth, and structure CAREFULLY. Pay special attention to how preventive measures are SPECIFICALLY TAILORED to each violation type in the templates.

TEMPLATE DOCUMENTS:
${context}

USER INFORMATION:
${userMessage}

${previousSections.length > 0 ? `PREVIOUSLY GENERATED SECTIONS:
${previousSections.join('\n\n---SECTION BREAK---\n\n')}

` : ''}CRITICAL INSTRUCTIONS FOR THIS APPEAL:
1. Appeal Type: ${formData.appealType}
2. Correct Addressee: ${correctAddressee}
3. If generating the opening section, use: ${correctAddressee}
4. If generating preventive measures, make them VIOLATION-SPECIFIC (not generic)
5. Link preventive measures directly to the corrective actions taken
6. Study the uploaded documents (if any) to understand the specific case details
7. Match the depth, specificity, and structure of similar templates for "${formData.appealType}"
${isKDP ? '8. **KDP APPEALS HAVE 4,000 CHARACTER LIMIT** - Keep this section concise and focused\n' : ''}
IMPORTANT: Generate ONLY the requested section (${section.name}). Match the professional tone and depth of the template documents. Ensure smooth continuation from previous sections if they exist.`;

    const stream = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini', // Fast model to stay under timeout
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: section.prompt },
      ],
      temperature: 0.85,
      max_tokens: adjustedMaxTokens,
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
      'Focus on: Supply chain documentation (invoices, LOA), authorized distributor verification, retail arbitrage issues. PREVENTIVE MEASURES: Supplier vetting procedures, invoice documentation systems, LOA requirements, test buys, direct brand contact procedures.',
    'intellectual-property':
      'Focus on: Trademark/copyright/patent details, USPTO verification, authorized reseller proof, retraction requests. PREVENTIVE MEASURES: USPTO database checks, copyright office searches, IP attorney consultations, brand authorization procedures.',
    'seller-code-conduct':
      'Focus on: Review manipulation, multiple accounts, forged documents. PREVENTIVE MEASURES: Internal communication policies, no third-party review services, staff training on review policies, monthly monitoring programs.',
    'related-account':
      'Focus on: Related account identification, explanation of relationship, closure or reinstatement. PREVENTIVE MEASURES: Account access restrictions, password policies with two-step verification, separate computers, AWS service provider procedures, frequent password changes, physical access controls.',
    'drop-shipping':
      'Focus on: Fulfillment model changes, seller-of-record compliance, packing slip requirements. PREVENTIVE MEASURES: Drop-shipping quality control (packing slips showing seller name), supplier compliance procedures, inventory quality control, weekly management meetings.',
    'restricted-products':
      'Focus on: Product compliance, certifications (COA, GMP, FDA 510k), disease claims removal. PREVENTIVE MEASURES: Listings quality control (sanitizing descriptions), label warnings, compliance verification, safety testing programs, QC supervisor appointment.',
    'used-sold-as-new':
      'Focus on: Product condition, quality control, customer complaints. PREVENTIVE MEASURES: Inventory quality control (spot-checking lots), packing and shipping procedures, warehouse supervision, customer experience monitoring.',
    'high-cancellation':
      'Focus on: Inventory management, fulfillment processes, order fulfillment rates, sales velocity. PREVENTIVE MEASURES: Sales velocity monitoring, inventory accuracy checks, monthly physical inventory, listing monitoring.',
    'marketplace-pricing':
      'Focus on: Pricing strategies, fair market value, automated pricing tool issues. PREVENTIVE MEASURES: Pricing monitoring systems, fair market value checks, automated tool oversight.',
    'verification-failure':
      'Focus on: Document verification (utility bill, ID, bank statement), address matching. PREVENTIVE MEASURES: Document maintenance, regular policy monitoring, prompt response to verification requests.',
    'account-compromised':
      'Focus on: Account security, unauthorized access, password changes. PREVENTIVE MEASURES: Strong password policies, two-step verification, monitoring account activity, security audits.',
    'deceptive-activity':
      'Focus on: Business practices review, legal compliance, fraud prevention. PREVENTIVE MEASURES: Compliance programs, legal review procedures, transparency policies.',
    'detail-page-abuse':
      'Focus on: Listing compliance (title, bullets, images), style guide adherence. PREVENTIVE MEASURES: Listing quality control, compliance manager approval, detail page monitoring, style guide training.',
    'category-approval':
      'Focus on: Category requirements (CPC, lab reports), product certifications. PREVENTIVE MEASURES: Product certification procedures, lab testing programs, category requirement checklists.',
    'kdp-acx-merch':
      'Focus on: Content guidelines, IP compliance, misleading metadata. PREVENTIVE MEASURES: Plagiarism checks (PlagScan), title/cover similarity searches, US Copyright Office database checks, metadata guidelines review, professional editing, customer review monitoring. NOTE: KDP appeals have 4,000 character limit.',
    'fba-shipping':
      'Focus on: FBA requirements, barcode compliance, packaging standards. PREVENTIVE MEASURES: Barcode verification procedures, packaging standard checklists, FBA prep compliance.',
    'amazon-relay':
      'Focus on: Relay-specific policies, no subcontracting, carrier control. PREVENTIVE MEASURES: VIN-match rules (load ID must match unit/VIN), lease/ownership clarity, quarterly compliance audits, Amazon-specific driver training on no re-brokering, document retention (5 years), trip packet uploads (BOL, ELD, receipts, photos).',
    'brand-registry':
      'Focus on: Brand verification, trademark issues, brand registry requirements. PREVENTIVE MEASURES: Trademark verification procedures, brand documentation systems, registry compliance monitoring.',
    'safety-suspension':
      'Focus on: Product safety issues, hazardous materials, safety certifications, consumer safety complaints. PREVENTIVE MEASURES: Product safety testing programs, CPSC compliance verification, safety certification documentation, quality control inspections, hazmat training, safety incident monitoring.',
    'variation-abuse':
      'Focus on: Improper parent-child relationships, variation listing manipulation, unrelated products in variations. PREVENTIVE MEASURES: Variation policy compliance checks, parent-child relationship audits, product attribute verification, listing quality control, variation structure validation.',
    'merch-termination':
      'Focus on: Merch by Amazon content policy violations, trademark infringement, design guidelines. PREVENTIVE MEASURES: Design originality verification, trademark database checks, content policy reviews, design quality standards, copyright compliance procedures.',
    'other':
      'Focus on: Specific violation details, Amazon policy compliance, corrective actions taken. PREVENTIVE MEASURES: General compliance procedures, policy monitoring, staff training, quality control systems, customer service excellence.'
  };

  return guidanceMap[appealType] || 'Focus on: Comprehensive understanding of the violation, specific corrective actions, and robust violation-specific preventive measures.';
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

  // Supporting documents - EMPHASIZE THESE HEAVILY
  if (formData.uploadedDocuments.length > 0) {
    parts.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    parts.push(`🚨 CRITICAL: UPLOADED SUPPORTING DOCUMENTS - READ CAREFULLY 🚨`);
    parts.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    parts.push(`\nThe seller has provided ${formData.uploadedDocuments.length} supporting document(s).`);
    parts.push(`YOU MUST CAREFULLY REVIEW AND INCORPORATE SPECIFIC DETAILS FROM THESE DOCUMENTS.`);
    parts.push(`\n⚠️  MANDATORY REQUIREMENTS FOR UPLOADED DOCUMENTS:`);
    parts.push(`1. READ the full content of each uploaded document below`);
    parts.push(`2. EXTRACT specific details (dates, amounts, supplier names, product info, etc.)`);
    parts.push(`3. REFERENCE these documents explicitly in the appeal (e.g., "As shown in the attached invoice dated...", "The supplier documentation confirms...")`);;
    parts.push(`4. USE specific data points from the documents to strengthen credibility`);
    parts.push(`5. MENTION document types and filenames when referencing them`);
    parts.push(`\n📄 UPLOADED DOCUMENTS AND THEIR CONTENT:\n`);

    formData.uploadedDocuments.forEach((doc, index) => {
      parts.push(`\n━━━ DOCUMENT ${index + 1}/${formData.uploadedDocuments.length} ━━━`);
      parts.push(`File: ${doc.fileName}`);
      parts.push(`Type: ${doc.type}`);

      if (doc.extractedText && doc.extractedText.trim().length > 0) {
        parts.push(`\n📋 EXTRACTED CONTENT (ANALYZE THIS CAREFULLY):`);
        parts.push(`${doc.extractedText.substring(0, 3000)}`); // Include up to 3000 chars of extracted text
        if (doc.extractedText.length > 3000) {
          parts.push(`\n... [Content truncated for length. Full document contains ${doc.extractedText.length} characters]`);
        }
      } else {
        parts.push(`\n⚠️  No text content extracted from this document.`);
        parts.push(`Still reference it as: "Please see attached ${doc.type} (${doc.fileName})"`);
      }

      if (doc.documentSummary) {
        parts.push(`\n📝 KEY POINTS: ${doc.documentSummary}`);
      }
    });

    parts.push(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    parts.push(`✅ DOCUMENT REVIEW COMPLETE - Now incorporate these details into the appeal`);
    parts.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  parts.push(`\n=== CRITICAL GENERATION INSTRUCTIONS ===`);
  parts.push(`Create a comprehensive, professional appeal letter that:`);
  parts.push(`1. ${formData.uploadedDocuments.length > 0 ? '🔥 INCORPORATES SPECIFIC DETAILS FROM THE UPLOADED DOCUMENTS ABOVE - cite dates, amounts, supplier names, and other concrete data' : 'Follows the structure of similar templates'}`);
  parts.push(`2. Follows the EXACT structure, depth, and formatting of similar templates for "${formData.appealType}"`);
  parts.push(`3. Includes ALL elements present in similar templates (documentation lists, supplier details, policy citations, multi-step processes, performance metrics, etc.)`);
  parts.push(`4. Uses the professional tone and specific terminology from the templates`);
  parts.push(`5. Provides the same level of detail - if templates have 10-15 preventive measures organized by category, match that depth`);
  parts.push(`6. Includes proper opening address, detailed root cause narrative, specific actions taken, comprehensive preventive measures, and professional closing with full contact information`);
  parts.push(`7. References specific policies, standards, or regulations as shown in similar templates`);
  parts.push(`8. **MOST IMPORTANT**: Preventive measures MUST be specifically tailored to THIS violation type - NOT generic categories`);
  parts.push(`   - Study the preventive measures in the templates for "${formData.appealType}"`);
  parts.push(`   - Link each preventive measure category directly to the corrective actions taken`);
  parts.push(`   - For example: If corrective actions mention shipping documentation, preventive measures should detail shipping compliance procedures`);
  parts.push(`   - DO NOT use generic "Sourcing, Listings, Training, Monitoring" unless those are specifically relevant to ${formData.appealType}`);
  if (formData.uploadedDocuments.length > 0) {
    parts.push(`\n9. 🚨 MANDATORY: When discussing corrective actions or evidence, reference the uploaded documents with specific details:`);
    parts.push(`   - Example: "We have attached invoices from [Supplier Name] dated [Date] showing purchase of [Quantity] units"`);
    parts.push(`   - Example: "The attached Certificate of Analysis confirms [specific detail from COA]"`);
    parts.push(`   - Example: "As evidenced in the attached documentation (${formData.uploadedDocuments[0].fileName}), we have..."`);
    parts.push(`   - DO NOT just say "see attached documents" - be SPECIFIC about what each document shows`);
  }
  parts.push(`\nDo NOT create a generic or simplified appeal. Match the comprehensive, violation-specific nature of the template documents provided.`);

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
  allDocumentNames: string[],
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
      metadata: { documentName: allDocumentNames[index] }
    }));

    const relevantDocs = findRelevantDocuments(queryEmbedding, documentsWithEmbeddings, 20, formData.appealType);

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
  allDocumentNames: string[],
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
      metadata: { documentName: allDocumentNames[index] }
    }));

    const relevantDocs = findRelevantDocuments(queryEmbedding, documentsWithEmbeddings, 20, formData.appealType);

    console.log(`✅ Selected ${relevantDocs.length} most relevant template documents for appeal generation`);
    console.log(`📝 These templates will guide the structure, depth, and specific elements of the appeal`);

    // Generate the appeal with streaming support
    return await generateAppealLetterWithStreaming(formData, relevantDocs, onChunk);
  } catch (error) {
    console.error('Error generating appeal with context:', error);
    throw error;
  }
}
