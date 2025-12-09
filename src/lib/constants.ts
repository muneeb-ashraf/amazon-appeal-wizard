// ============================================================================
// FORM DATA CONSTANTS - Based on Comprehensive Blueprint
// ============================================================================

export const APPEAL_TYPES = [
  {
    value: 'inauthenticity-supply-chain',
    label: 'Seller Account Suspension: Inauthenticity / Supply Chain (includes Retail Arbitrage)',
  },
  {
    value: 'intellectual-property',
    label: 'Seller Account Suspension: Intellectual Property (IP) Violation (Copyright, Trademark, Patent)',
  },
  {
    value: 'seller-code-conduct',
    label: 'Seller Account Suspension: Seller Code of Conduct (includes Review Manipulation, Forged Docs)',
  },
  {
    value: 'related-account',
    label: 'Seller Account Suspension: Related Account Suspension (includes Multiple Accounts)',
  },
  {
    value: 'drop-shipping',
    label: 'Seller Account Suspension: Drop-Shipping Policy Violation',
  },
  {
    value: 'restricted-products',
    label: 'Seller Account Suspension: Restricted Products Policy Violation (includes supplements making improper claims)',
  },
  {
    value: 'used-sold-as-new',
    label: 'Seller Account Suspension: "Used Sold as New" / Condition Complaints / High ODR',
  },
  {
    value: 'high-cancellation',
    label: 'Seller Account Suspension: High Cancellation Rate / Sales Velocity',
  },
  {
    value: 'marketplace-pricing',
    label: 'Seller Account Suspension: Marketplace Fair Pricing Violation',
  },
  {
    value: 'verification-failure',
    label: 'Seller Account Suspension: Account Deactivation - Verification Failure (Utility Bill, ID, documentation)',
  },
  {
    value: 'account-compromised',
    label: 'Seller Account Suspension: Account Compromised / Hacked',
  },
  {
    value: 'deceptive-activity',
    label: 'Seller Account Suspension: Deceptive, Fraudulent, or Illegal Activity',
  },
  {
    value: 'detail-page-abuse',
    label: 'Listing Suspension/Category Issue: Detail Page Abuse (e.g., Title/Bullet Point Tampering)',
  },
  {
    value: 'category-approval',
    label: 'Listing Suspension/Category Issue: Product Group / Category Approval (e.g., Toys, CPC)',
  },
  {
    value: 'kdp-acx-merch',
    label: 'ACX / KDP Termination: Content Guideline Violation (e.g., IP, Misleading Title)',
  },
  {
    value: 'fba-shipping',
    label: 'FBA Shipping: FBA Shipping Violation (e.g., 2D Barcode)',
  },
  {
    value: 'amazon-relay',
    label: 'Amazon Relay Account: Amazon Relay Account Suspension (e.g., Subcontracting)',
  },
  {
    value: 'brand-registry',
    label: 'Brand Registry: Brand Registry Issue / Error',
  },
  {
    value: 'safety-suspension',
    label: 'Amazon Safety Suspension Appeals',
  },
  {
    value: 'variation-abuse',
    label: 'Amazon Variation Abuse Appeals',
  },
  {
    value: 'merch-termination',
    label: 'Merch by Amazon (MBA) Account Termination',
  },
  {
    value: 'other',
    label: 'Other',
  },
] as const;

export const ROOT_CAUSES = {
  'inauthenticity-supply-chain': [
    'I was operating a Retail Arbitrage model (e.g., sourcing from TJMaxx, Marshalls) without brand authorization',
    'I was unable to provide sufficient supply chain documentation (e.g., valid invoices, LOA)',
    'My invoices were retail receipts or order confirmations (e.g., from Walmart)',
    'I failed to verify if my supplier was an authorized distributor',
    'I joined an existing listing without the right to resell the brand',
    'A customer ordered the wrong part and believed it was inauthentic or used',
  ],
  'seller-code-conduct': [
    'Used product inserts or packaging stickers to offer free products/rewards for reviews',
    'Offered customers refunds or gift cards to remove negative feedback',
    'Contacted customers to ask them to cancel orders (to avoid stock-outs)',
    'Used a third-party service to request or manipulate feedback (e.g., Feedback Genius)',
    'Asked friends or family to buy or review my product',
    'Used deep discounts (below cost) to manipulate sales rank',
    'Submitted forged or altered documents (e.g., modified a COA date)',
    'Created or operated more than one seller account',
  ],
  'used-sold-as-new': [
    'Item was used and not new',
    'Item was not as described in the listing',
    'Book had highlighting or writing inside',
    'Package was missing components (e.g., origami papers, lancet)',
  ],
  'restricted-products': [
    'An automated keyword mismatch flagged my product in error',
    'The listing title was inconsistent with the actual product ingredients',
    'Amazon misidentified my product as containing a restricted ingredient (e.g., Minoxidil)',
    'My listing made prohibited disease claims (e.g., \'anti-inflammatory\')',
    'My subtitle or cover made unapproved medical or health claims',
  ],
  'intellectual-property': [
    'The complaint is for a foreign patent/trademark not enforceable in this marketplace (e.g., EU patent in US)',
    'The complaint is false; I am an authorized reseller with valid invoices/LOA',
    'The complaint was fraudulent, filed by an unauthorized person',
    'My content was original, and the rights owner copied me',
    'I used trademarked terms (e.g., \'Harry Potter\', \'NASA\', \'TWITTER\') in my titles, descriptions, or tags',
    'My listing\'s text or images infringed on another\'s copyright',
    'I had a poor understanding of IP policies and failed to research trademarks (e.g., in USPTO)',
  ],
  'verification-failure': [
    'The utility bill was not in my name (e.g., it was in a tenant\'s or landlord\'s name)',
    'The address on my documents did not match the address in Seller Central',
    'My documents were expired or in an unsupported format',
    'I did not have the requested document (e.g., business license)',
    'Other (please explain)',
  ],
  'detail-page-abuse': [
    'Title (e.g., too long, not compliant with Style Guide)',
    'Bullet Points (e.g., added symbols, brackets, or marketing text)',
    'Images (e.g., not original, non-compliant)',
    'Used false product identification (e.g., UPCs)',
    'Created a duplicate product detail page',
    'Used an existing listing for a new version of a product',
  ],
  'category-approval': [
    'Children\'s Product Certificate (CPC)',
    'CPSC-accepted lab test report (e.g., SGS report)',
    'Invoices from supplier',
    'Product & Packaging Photos',
  ],
} as const;

export const CORRECTIVE_ACTIONS = {
  general: [
    'I have permanently deleted the flagged ASINs from my inventory and listings',
    'I have resolved the issue with the complaining customer (e.g., processed a full refund)',
    'I have conducted a complete audit of all my active and inactive listings',
    'I have carefully read and reviewed all relevant Amazon policies',
    'I have retrained my team on Amazon\'s policies and listing accuracy',
    'I have reviewed Amazon\'s Business Solutions Agreement and selling policies',
  ],
  inauthenticity: [
    'I have ceased sourcing from the unverified/retail supplier (e.g., Walmart, TJMaxx)',
    'I have provided invoices or retail receipts to verify the source of the products',
    'I have retained legal counsel to contact the rights owner',
    'I have submitted a valid Letter of Authorization (LOA) from my supplier',
  ],
  intellectualProperty: [
    'I have hired an attorney who has contacted the rights owner for a retraction',
    'I have filed a DMCA counter-notice (for false complaints)',
    'I have sanitized all my listings to remove any infringing intellectual property',
    'I will remove the specific infringing component from future products',
  ],
  codeOfConduct: [
    'I have recalled FBA inventory to remove non-compliant stickers/inserts',
    'I have disabled the external promotional website/landing page',
    'I have attached a list of Order IDs for the prohibited reviews',
    'I have canceled my subscription to all third-party feedback services',
    'I have asked my friends and family to remove their reviews',
    'I have terminated the employee responsible for submitting altered documents',
  ],
  restrictedProducts: [
    'I have "sanitized" my listings to remove all prohibited disease claims',
    'I have attached new, compliant product images',
    'I have attached a valid Certificate of Analysis (COA) or supplier certifications',
  ],
  verificationFailure: [
    'I have obtained a new, valid utility bill in my name',
    'I have submitted the new, valid utility bill and/or bank statement',
    'I have verified there is a valid credit card on file',
  ],
  relatedAccount: [
    'I have identified the account I am related to',
    'I have successfully appealed and reinstated the other account',
    'I have requested the permanent closure of the related account',
  ],
  detailPageAbuse: [
    'I have edited the title to be compliant (e.g., shortened to < 50 chars)',
    'I have removed all symbols (hyphens, brackets) from my bullet points',
    'I have replaced all non-compliant images with my own original photos',
  ],
  categoryApproval: [
    'I have submitted a valid Children\'s Product Certificate (CPC)',
    'I have submitted a valid test report from a CPSC-accepted lab (e.g., SGS)',
    'I have submitted product and packaging photos',
  ],
  kdpAcxMerch: [
    'I have reviewed KDP\'s Terms of Service and Content Guidelines',
  ],
  relay: [
    'I have reviewed Amazon Relay\'s Conditions of Use',
  ],
  merch: [
    'I have reviewed Amazon Merch on Demand Services Agreement and the Terms of Use',
  ],
} as const;

export const PREVENTIVE_MEASURES = {
  sourcing: [
    'I source products only from reputable wholesalers or verified distributors who provide proper documentation',
    'I no longer use a Retail Arbitrage model',
    'I conduct detailed background checks on new suppliers',
    'I request Proforma Invoices to verify company details to vet suppliers',
    'I conduct test buys of new products from potential suppliers',
    'I visit the supplier/manufacturer in person (if local)',
    'Before sourcing, I contact brand owners directly to obtain a Letter of Authorization (LOA)',
    'Before sourcing, I contact Seller Support',
    'I keep all invoices and supply chain documentation for all products',
  ],
  listing: [
    'I have appointed a compliance manager/QC supervisor to review all listings before publication',
    'Management approval is required for all new detail pages',
    'I check the USPTO and US Copyright Office databases before listing to prevent IP violations',
    'I research keywords on Amazon to see if they are part of a trademarked phrase',
    'I only use original photos taken by me, not manufacturer/supplier photos',
    'I do not add symbols, marketing text, or non-compliant information to titles or bullet points',
    'I do not use false product identification (e.g., UPCs) or create duplicate detail pages',
    'I do not use an old listing for a new version of a product; I will create a new ASIN',
    'I do not use ingredient names in titles unless they are in the product',
    'I get FDA 510k approval or verify exemption before listing any product that makes medical claims',
    'I add all appropriate CPSC/safety cautionary advisements to my listing',
    'I have implemented a supplier safety testing review program',
    'If in doubt, I consult an Intellectual Property lawyer before listing',
  ],
  reviewManipulation: [
    'I do not use any product inserts, stickers, or packaging to request reviews or offer rewards',
    'I rely only on Amazon\'s internal "Request a Review" button and Vine program',
    'I do not purchase my own products or ask friends/family to purchase or review my products',
    'I do not use deep discounts (below cost) to manipulate sales rank',
    'I do not use any third-party service to stimulate sales, rank, or reviews',
    'I implement a weekly and monthly training program for all staff on review policies',
  ],
  operations: [
    'I conduct regular physical inventory checks to ensure my stock levels are accurate',
    'I convert my fulfillment model to FBA',
    'I spot-check incoming inventory lots for condition, quality, and completeness',
    'I have appointed a compliance officer to monitor policy changes monthly',
    'I perform bi-weekly checks of my account health and live listings',
    'I monitor all customer feedback, complaints, and reviews to proactively identify issues',
    'Any product that creates a poor customer experience is immediately withdrawn from inventory',
    'I respond to all customer inquiries in less than 24 hours',
  ],
  kdpPublishing: {
    contentCopyright: [
      'I verify copyright ownership or obtain proper licenses for all published content',
      'I conduct plagiarism checks using professional tools (Copyscape, PlagScan, Grammarly Premium) before publishing',
      'I ensure all content is original or properly licensed with documentation',
      'I maintain records of all copyright permissions and licenses',
      'I do not use copyrighted content, quotes, or excerpts without proper attribution and permission',
      'I have implemented a content review process to verify originality before publication',
    ],
    coverDesign: [
      'I only use original artwork or properly licensed images for book covers',
      'I verify image licensing and maintain documentation for all cover design elements',
      'I do not use celebrity images, trademarked characters, or copyrighted artwork without authorization',
      'I conduct reverse image searches to ensure cover images are not infringing',
      'I maintain licenses for stock photos and design elements used in covers',
      'I verify that cover designers provide proof of licensing for all assets',
    ],
    titleMetadata: [
      'I do not use trademarked terms, brand names, or series titles in my book titles without authorization',
      'I review all keywords and metadata to ensure they don\'t infringe on trademarks',
      'I verify that book titles and subtitles comply with Amazon\'s content policy',
      'I check USPTO database before using potentially trademarked phrases in titles',
      'I ensure book descriptions accurately represent content without misleading claims',
      'I avoid using celebrity names or popular series titles without proper authorization',
    ],
    contentQuality: [
      'I ensure all published content meets Amazon\'s content quality guidelines',
      'I implement editorial review processes to maintain content standards',
      'I do not publish public domain works without substantial unique content or value-add',
      'I verify age-appropriateness of content and apply correct content ratings',
      'I maintain professional editing and proofreading standards for all publications',
      'I ensure translations are accurate and properly attributed when publishing translated works',
    ],
    authorVerification: [
      'I maintain proper documentation of authorship and publishing rights',
      'I verify contributor information and obtain necessary permissions',
      'I do not publish under false identities or misrepresent authorship',
      'I maintain clear agreements with co-authors, ghostwriters, or content contributors',
      'I verify that all contributors have rights to their contributions',
      'I maintain records demonstrating my authority to publish all content',
    ],
  },
} as const;

export const SUPPORTING_DOCUMENT_TYPES = [
  { value: 'utility-bill', label: 'Utility Bill (e.g., gas bill)', category: 'Identity & Address' },
  { value: 'government-id', label: 'Government-issued ID', category: 'Identity & Address' },
  { value: 'bank-statement', label: 'Bank Statement', category: 'Identity & Address' },
  { value: 'certificate-of-formation', label: 'Certificate of Formation/Incorporation', category: 'Business' },
  { value: 'invoice', label: 'Invoices or Order Confirmations', category: 'Supply Chain' },
  { value: 'loa', label: 'Letter of Authorization (LOA)', category: 'Supply Chain' },
  { value: 'retail-receipt', label: 'Retail Receipts', category: 'Supply Chain (Retail Arbitrage)' },
  { value: 'trademark-proof', label: 'Proof of Trademark Registration', category: 'Intellectual Property' },
  { value: 'dmca-counter-notice', label: 'DMCA Counter-Notice', category: 'Intellectual Property' },
  { value: 'product-label', label: 'Product Labels / Packaging Photos', category: 'Restricted Products / Safety' },
  { value: 'coa', label: 'Certificate of Analysis (COA)', category: 'Restricted Products / Safety' },
  { value: 'gmp-certificate', label: 'Good Manufacturing Practices (GMP) Certificate', category: 'Restricted Products / Safety' },
  { value: 'cpc', label: 'Children\'s Product Certificate (CPC)', category: 'Restricted Products / Safety' },
  { value: 'lab-test-report', label: 'CPSC-accepted Lab Test Report', category: 'Restricted Products / Safety' },
  { value: 'product-insert-photo', label: 'Photos of Product Inserts/Stickers', category: 'Review Manipulation' },
  { value: 'order-id-list', label: 'List of Order IDs', category: 'Review Manipulation' },
  { value: 'relay-documents', label: 'Amazon Relay Documents (Bill of Sale, Registration, etc.)', category: 'Amazon Relay' },
  { value: 'other', label: 'Other Supporting Document', category: 'General' },
] as const;
