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
- Use the CORRECT addressee for the appeal type

INTELLECTUAL PROPERTY LANGUAGE:
⚠️  CRITICAL: When discussing IP violations (trademark, copyright, patent), NEVER mention specific brand names, trademarked terms, or logos:
- ❌ DO NOT WRITE: "violations involving Harry Potter, NASA, and Twitter trademarks"
- ✅ DO WRITE: "violations involving unauthorized trademarked terms and logos"
- ❌ DO NOT WRITE: "I used the FDA logo without authorization"
- ✅ DO WRITE: "I used unauthorized regulatory logos without authorization"
- ❌ DO NOT WRITE: "Nike, Adidas, and Disney trademarks were used"
- ✅ DO WRITE: "Protected brand names and trademarks were used"

Use generic language: "trademarked terms," "protected logos," "copyrighted material," "intellectual property," "brand names," "proprietary marks."

KDP/PUBLISHING TERMINOLOGY:
⚠️  If this is a KDP/publishing appeal (appeal type contains 'kdp', 'acx', 'merch', 'publishing', or 'book'), use PUBLISHING-SPECIFIC terminology:
- Use "book(s)", "publication(s)", "content", "manuscript", "title(s)", "work(s)" instead of "product(s)"
- Use "published", "publishing", "catalog" instead of "listing", "inventory"
- Use "KDP account", "publishing account" instead of "seller account" or "store"
- Use "book page" instead of "detail page"
- Example: "regarding the nature of the BOOK" NOT "regarding the nature of the PRODUCT"
- Example: "confusion with existing BOOKS" NOT "confusion with existing PRODUCTS"`,
    maxTokens: 700
  },
  {
    id: 2,
    name: 'Root Cause Analysis',
    prompt: `Generate ONLY the root cause section of the appeal. This section should DIAGNOSE what went wrong, NOT describe solutions or fixes.

WHAT TO INCLUDE:
- Clear section heading: "Root Cause Analysis" (plain text, not markdown)
- Detailed explanation of what caused the issue (the problem, not the solution)
- Investigation process and findings (how you discovered the problem)
- Timeline of events leading to the violation (ONLY if actual dates are provided - otherwise describe events generally)
- Acknowledgment of responsibility and understanding of the policy violated
- 🔥 IF DOCUMENTS ARE UPLOADED: Reference specific details from the uploaded documents to explain the root cause

Make this comprehensive (3-4 paragraphs).

CRITICAL SCOPE BOUNDARIES - ROOT CAUSE ANALYSIS ONLY:
✅ DO INCLUDE:
- WHAT went wrong (e.g., "I did not verify my supplier's authorization status")
- WHY it happened (e.g., "due to inadequate vetting procedures at the time")
- HOW you discovered the problem (e.g., "Upon receiving Amazon's notice, I immediately investigated...")
- Timeline of the problem developing (not timeline of fixing it)

❌ DO NOT INCLUDE:
- Actions you've taken to fix the problem (that belongs in Section 3: Corrective Actions)
- Ongoing practices or future plans (that belongs in Section 4: Preventive Measures)
- Phrases like "I have implemented...", "I have established...", "I now maintain..." (these are fixes, not root causes)
- Any mention of new systems, procedures, or changes (these are corrective/preventive actions)

EXAMPLES:
✅ CORRECT (Root Cause only):
"The root cause of this issue was my failure to verify that my supplier was an authorized distributor of the brand. When I started selling this product line in March 2024, I relied on the supplier's verbal assurance of authenticity without requesting formal documentation."

❌ INCORRECT (includes corrective action):
"The root cause was inadequate supplier vetting. To address this, I have now implemented a comprehensive supplier verification system that includes requesting LOAs and conducting brand registry checks."

REMEMBER: This section is about DIAGNOSING the problem, not describing the cure. Keep all solutions for Sections 3 and 4.

CRITICAL RULES:
- DO NOT use placeholder text like [insert date], [add information], etc.
- DO NOT use markdown formatting (###, **, etc.)
- If dates aren't provided, describe the sequence of events without specific dates
- Write in clear paragraph form without markdown
- 🚨 IF UPLOADED DOCUMENTS CONTAIN RELEVANT INFORMATION: Cite specific details (e.g., "Upon reviewing the invoice dated March 15, 2024 from XYZ Supplier...")

INTELLECTUAL PROPERTY LANGUAGE:
⚠️  NEVER mention specific brand names, trademarks, or logos when discussing IP violations:
- Use "trademarked terms" instead of listing specific brands
- Use "unauthorized logos" instead of naming specific logos (e.g., "FDA logo")
- Use "protected terms" instead of brand names
- Use "copyrighted material" instead of specific copyrighted works

Examples:
❌ INCORRECT: "The root cause was using Harry Potter and NASA trademarks in listings"
✅ CORRECT: "The root cause was using unauthorized trademarked terms in listings"

❌ INCORRECT: "I included the Nike logo and Adidas branding without permission"
✅ CORRECT: "I included unauthorized brand logos and protected marks without permission"

KDP/PUBLISHING TERMINOLOGY:
⚠️  For KDP/publishing appeals, use appropriate publishing terminology:
- Say "book", "publication", "content", "manuscript", "title", "work" instead of "product"
- Say "published", "publishing catalog", "bookshelf" instead of "listed", "inventory"
- Say "metadata" (title, description, keywords) instead of "listing details"
- Say "cover design" instead of "product images"
- Example: "The book in question was titled..." NOT "The product in question..."
- Example: "published work" NOT "listed product"`,
    maxTokens: 800
  },
  {
    id: 3,
    name: 'Corrective Actions',
    prompt: `Generate ONLY the corrective actions section. This section should describe COMPLETED, PAST-TENSE actions you have ALREADY taken to fix the specific problem identified in the root cause analysis.

WHAT TO INCLUDE:
- Clear section heading: "Corrective Actions Taken" (plain text, not markdown)
- Specific actions already completed (strict past tense: "I removed...", "I hired...", "I obtained...", "I revised...")
- Documentation gathered and being provided with this appeal
- 🔥 MANDATORY IF DOCUMENTS UPLOADED: Explicitly reference each uploaded document with specific details from its content
- People hired or consulted (past tense: "I hired an attorney", "I engaged a compliance consultant")
- Immediate changes made to address the violation (past tense: "I deleted the listing", "I destroyed non-compliant inventory")

Make this detailed with concrete examples (3-4 paragraphs).

CRITICAL SCOPE BOUNDARIES - COMPLETED ACTIONS ONLY:
✅ DO INCLUDE:
- One-time actions already completed (e.g., "I removed all inauthentic products from inventory")
- Documents obtained as evidence (e.g., "I secured LOAs from authorized distributors")
- Immediate fixes to stop the violation (e.g., "I revised all product listings to remove disease claims")
- People brought in to help (e.g., "I hired a trademark attorney to review all listings")
- Past tense verbs: "removed", "implemented", "obtained", "revised", "completed", "hired", "trained"

❌ DO NOT INCLUDE:
- Ongoing practices or routines (that belongs in Section 4: Preventive Measures)
- Future commitments or plans (that belongs in Section 4: Preventive Measures)
- Phrases like "I maintain...", "I conduct...", "I ensure...", "I regularly..." (these describe ongoing practices, not completed actions)
- Phrases like "I will...", "I plan to...", "going forward..." (these are future preventive measures)
- Descriptions of how you will avoid this in the future (that's Section 4)
- Present tense or present continuous verbs describing ongoing activities

⚠️  KEY DISTINCTION:
- Corrective Action (✅): "I implemented a new supplier vetting checklist" (one-time setup that is now complete)
- Preventive Measure (❌): "I use this checklist to verify all new suppliers" (ongoing practice using the implemented system)

EXAMPLES:
✅ CORRECT (Completed corrective action):
"I immediately removed all 247 units of the affected product from my inventory and disposed of them properly. I obtained Letters of Authorization from three verified distributors and attached them to this appeal."

❌ INCORRECT (includes ongoing preventive measure):
"I removed all affected products from inventory. Going forward, I conduct weekly inventory audits to ensure compliance and maintain a database of approved suppliers."

REMEMBER: This section is about what you've ALREADY DONE to fix the problem (past tense, completed actions). Save ongoing practices for Section 4.

CRITICAL RULES:
- DO NOT use placeholder text like [insert date], [add details]
- DO NOT use markdown headers (###) or bullet formatting (-)
- Write in paragraph form with clear transitions
- Use PAST TENSE for all actions (completed actions only)
- 🚨 FOR EACH UPLOADED DOCUMENT: Reference it specifically with actual data points:
  * Example: "I have attached invoices from ABC Wholesale (Invoice #12345 dated March 15, 2024) showing the purchase of 500 units of Product XYZ"
  * Example: "The attached Certificate of Analysis from SGS Labs confirms our products meet all safety standards (see attached COA-2024-0315.pdf)"
  * Example: "As demonstrated in the attached supplier documentation, we established a relationship with authorized distributor DEF Corp on January 10, 2024"
- DO NOT just say "see attached" - be SPECIFIC about what each document proves
- DO NOT describe what you "maintain", "conduct regularly", or "ensure" - those are preventive measures

INTELLECTUAL PROPERTY LANGUAGE:
⚠️  NEVER list specific brand names, trademarks, or logos when describing corrective actions:
- ❌ DO NOT WRITE: "I removed Harry Potter, Star Wars, and Marvel trademarks from all listings"
- ✅ DO WRITE: "I removed all unauthorized trademarked terms from listings"
- ❌ DO NOT WRITE: "I deleted the FDA and WHO logos from product images"
- ✅ DO WRITE: "I deleted unauthorized regulatory and organizational logos from product images"

Keep acknowledgments generic while remaining specific about ACTIONS taken:
✅ CORRECT: "I removed all products containing unauthorized intellectual property"
✅ CORRECT: "I eliminated protected brand names and logos from titles and descriptions"
✅ CORRECT: "I deleted listings that used trademarked terms without authorization"

KDP/PUBLISHING TERMINOLOGY:
⚠️  For KDP/publishing appeals, use publishing industry language:
- Say "I removed the book from my catalog" NOT "I removed the product from inventory"
- Say "I revised the book's metadata" NOT "I updated the product listing"
- Say "I redesigned the cover" NOT "I changed the product images"
- Say "I unpublished the title" NOT "I deleted the listing"
- Say "manuscript", "content", "publication" instead of "product"
- Example: "I removed the misleading TITLE from my KDP shelf" NOT "I removed the misleading PRODUCT from my inventory"`,
    maxTokens: 800
  },
  {
    id: 4,
    name: 'Preventive Measures',
    prompt: `Generate ONLY the preventive measures section. This section should describe ONGOING and FUTURE practices that will prevent this violation from recurring. These are routines, systems, and habits you maintain NOW and will continue GOING FORWARD.

CRITICAL DISTINCTION FROM SECTION 3:
- Section 3 (Corrective Actions) = COMPLETED, one-time fixes you already did (past tense)
- Section 4 (Preventive Measures) = ONGOING routines and systems you maintain now and will maintain in the future (present/future tense)

WHAT TO INCLUDE:
- Clear section heading: "Preventive Measures to Avoid Future Issues" or similar (plain text, not markdown)
- Organize by 2-4 SPECIFIC categories directly related to the violation (NOT generic categories)
- Each category should have multiple detailed, concrete preventive steps
- Total 10-15 specific preventive measures
- All measures must be VIOLATION-SPECIFIC and logically follow from the corrective actions taken

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

CRITICAL SCOPE BOUNDARIES - ONGOING PRACTICES ONLY:
✅ DO INCLUDE:
- Regular routines (e.g., "I conduct weekly supplier audits")
- Ongoing monitoring (e.g., "I review all listings monthly for compliance")
- Continuous practices (e.g., "I maintain a database of authorized distributors")
- Future commitments (e.g., "I will attend quarterly compliance training sessions")
- Systems you use regularly (e.g., "I use a plagiarism checker for every new design")
- Present tense verbs: "conduct", "review", "maintain", "monitor", "ensure", "verify"
- Future tense for new commitments: "will conduct", "will maintain"

❌ DO NOT INCLUDE:
- One-time actions already completed (that was Section 3: Corrective Actions)
- Past tense descriptions (e.g., "I removed", "I hired", "I obtained")
- The initial setup or implementation (e.g., "I implemented a new system" is corrective; "I use this system to..." is preventive)
- Phrases like "I have implemented", "I have established", "I have hired" (these are past completed actions, not ongoing practices)

⚠️  KEY DISTINCTION:
- Corrective Action (❌): "I hired a compliance officer" (one-time action, past tense - belongs in Section 3)
- Preventive Measure (✅): "My compliance officer reviews all listings before publication" (ongoing practice, present tense - belongs here)

EXAMPLES:
✅ CORRECT (Ongoing preventive measure):
"I conduct weekly audits of all active listings to verify compliance with Amazon's policies. Each listing is reviewed against a comprehensive checklist that includes image requirements, title formatting, and prohibited claims. Any listing flagged for potential issues is immediately revised or removed."

❌ INCORRECT (includes past corrective action):
"I implemented a weekly audit system and trained my team on compliance procedures. I now conduct weekly audits of all active listings."

⚠️  ANOTHER KEY DISTINCTION:
- Corrective Action (❌): "I implemented a supplier vetting system with a 12-point checklist" (past tense, one-time setup)
- Preventive Measure (✅): "Before onboarding any new supplier, I verify their authorization status using a 12-point checklist that includes requesting LOAs, checking brand registry, and confirming business licenses" (present tense, describing the ongoing use)

REMEMBER: This section is about what you DO NOW and WILL DO GOING FORWARD (present/future tense, ongoing practices). Do not repeat what you already completed in Section 3.

CRITICAL RULES:
- Preventive measures MUST be violation-specific, NOT generic
- Link each preventive category directly to the root cause and corrective actions
- DO NOT use markdown headers (###) or bullet formatting (-)
- Write in paragraph form with clear category transitions
- Use PRESENT TENSE for ongoing practices (e.g., "I source products" NOT "I will source products", "I conduct checks" NOT "I will conduct checks")
- Use FUTURE TENSE only for new commitments not yet started (e.g., "I will attend quarterly compliance webinars")
- Avoid starting sentences with past tense verbs or "I have..."
- DO NOT repeat actions from Section 3 - only describe how you use/maintain those systems now
- Make it as detailed and specific as the template documents for this appeal type

INTELLECTUAL PROPERTY LANGUAGE:
⚠️  NEVER reference specific brands or trademarks when describing preventive measures:
- ❌ DO NOT WRITE: "I check the USPTO database to avoid using Nike, Apple, or Samsung trademarks"
- ✅ DO WRITE: "I check the USPTO database to avoid using protected trademarks"
- ❌ DO NOT WRITE: "I ensure no Disney, Marvel, or Star Wars characters appear in listings"
- ✅ DO WRITE: "I ensure no unauthorized copyrighted characters or protected intellectual property appear in listings"

Focus on the PROCESS, not specific brands:
✅ CORRECT: "I verify that all product listings comply with trademark laws and do not include unauthorized brand names"
✅ CORRECT: "I conduct regular audits to ensure no protected logos or trademarked terms are used without authorization"

KDP/PUBLISHING TERMINOLOGY:
⚠️  For KDP/publishing appeals, use appropriate publishing terminology:
- Say "before publishing any content" NOT "before listing any products"
- Say "I review all book metadata" NOT "I check all product listings"
- Say "manuscripts", "publications", "titles", "books" instead of "products"
- Say "publishing catalog", "bookshelf" instead of "inventory"
- Say "KDP guidelines", "content policy" instead of "listing policies"
- Example: "I ensure all published CONTENT meets Amazon's guidelines" NOT "I ensure all PRODUCTS meet Amazon's guidelines"
- Example: "I conduct plagiarism checks on all MANUSCRIPTS before publishing" NOT "I check all PRODUCTS before listing"`,
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
 * Get adjusted max tokens for different appeal types
 * Note: Character limit for KDP appeals has been removed - all appeals use base token limits
 */
function getAdjustedMaxTokens(baseMaxTokens: number): number {
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

    const adjustedMaxTokens = getAdjustedMaxTokens(section.maxTokens);

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

⚠️  CRITICAL: Review the previously generated sections to understand the context, but DO NOT REPEAT their content. Each section has a distinct scope:
- Section 2: Root cause DIAGNOSIS only (what went wrong, not fixes)
- Section 3: COMPLETED corrective actions only (past tense, one-time fixes)
- Section 4: ONGOING preventive measures only (present/future tense, routines)

` : ''}CRITICAL INSTRUCTIONS FOR THIS APPEAL:
1. Appeal Type: ${formData.appealType}
2. Correct Addressee: ${correctAddressee}
3. If generating the opening section, use: ${correctAddressee}
4. If generating preventive measures, make them VIOLATION-SPECIFIC (not generic)
5. Link preventive measures directly to the corrective actions taken
6. Study the uploaded documents (if any) to understand the specific case details
7. Match the depth, specificity, and structure of similar templates for "${formData.appealType}"
8. ⚠️  RESPECT SECTION BOUNDARIES: Do not include content that belongs in other sections
9. If generating Section 2: Focus ONLY on diagnosis (not fixes)
10. If generating Section 3: Focus ONLY on completed past actions (not ongoing practices)
11. If generating Section 4: Focus ONLY on ongoing/future practices (not past completed actions)
12. ⚠️  INTELLECTUAL PROPERTY VIOLATIONS: NEVER mention specific brand names, trademarks, logos, or copyrighted works when discussing IP violations:
    - Use generic terms: "trademarked terms," "protected logos," "brand names," "copyrighted material," "intellectual property"
    - DO NOT list specific brands like "Nike," "Disney," "Harry Potter," "FDA," etc.
    - DO NOT name specific logos or marks
    - Maintain accountability with generic acknowledgment, not detailed cataloging
    - Example: Say "unauthorized trademarked terms" NOT "Harry Potter and NASA trademarks"
13. ⚠️  KDP/PUBLISHING TERMINOLOGY: If this is a KDP, ACX, Merch, or publishing-related appeal:
    - Use publishing terminology: "book(s)", "publication(s)", "content", "manuscript", "title(s)", "work(s)"
    - NOT seller terminology: "product(s)", "listing(s)", "inventory", "SKU"
    - Say "published" not "listed", "catalog" not "inventory", "cover design" not "product images"
    - Example: "the nature of the BOOK" NOT "the nature of the PRODUCT"
    - Example: "I removed the TITLE from my catalog" NOT "I removed the PRODUCT from inventory"
    - Be consistent throughout the entire appeal - NEVER mix publishing and seller terminology

IMPORTANT: Generate ONLY the requested section (${section.name}). Match the professional tone and depth of the template documents. Ensure smooth continuation from previous sections if they exist, but DO NOT REPEAT content from previous sections.`;

    const stream = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini', // Fast model to stay under timeout
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: section.prompt },
      ],
      temperature: 0.85,
      max_tokens: adjustedMaxTokens,
      frequency_penalty: 0.3, // Discourage repetition between sections
      presence_penalty: 0.2, // Encourage introducing new concepts in each section
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
      'Focus on: Content guidelines, IP compliance, misleading metadata. PREVENTIVE MEASURES: Plagiarism checks (PlagScan), title/cover similarity searches, US Copyright Office database checks, metadata guidelines review, professional editing, customer review monitoring.',
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
