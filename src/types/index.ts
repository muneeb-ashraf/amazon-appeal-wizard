// ============================================================================
// TYPE DEFINITIONS FOR AMAZON APPEAL WIZARD
// ============================================================================

// Appeal Type Categories
export type AppealType =
  | 'inauthenticity-supply-chain'
  | 'intellectual-property'
  | 'seller-code-conduct'
  | 'related-account'
  | 'drop-shipping'
  | 'restricted-products'
  | 'used-sold-as-new'
  | 'high-cancellation'
  | 'marketplace-pricing'
  | 'verification-failure'
  | 'account-compromised'
  | 'deceptive-activity'
  | 'detail-page-abuse'
  | 'category-approval'
  | 'kdp-acx-merch'
  | 'fba-shipping'
  | 'amazon-relay'
  | 'brand-registry'
  | 'safety-suspension'
  | 'variation-abuse'
  | 'merch-termination'
  | 'other';

// Root Cause Options
export interface RootCauseOptions {
  inauthenticitySupplyChain: string[];
  sellerCodeConduct: string[];
  usedSoldAsNew: string[];
  restrictedProducts: string[];
  intellectualProperty: string[];
  dropShipping: string[];
  verificationFailure: string[];
  relatedAccount: string[];
  categoryApproval: string[];
  detailPageAbuse: string[];
}

// Corrective Actions
export interface CorrectiveActions {
  general: string[];
  inauthenticity: string[];
  intellectualProperty: string[];
  codeOfConduct: string[];
  restrictedProducts: string[];
  verificationFailure: string[];
  relatedAccount: string[];
  detailPageAbuse: string[];
  categoryApproval: string[];
}

// Preventive Measures
export interface PreventiveMeasures {
  sourcing: string[];
  listing: string[];
  reviewManipulation: string[];
  operations: string[];
}

// Supporting Documents
export type SupportingDocumentType =
  | 'utility-bill'
  | 'government-id'
  | 'bank-statement'
  | 'certificate-of-formation'
  | 'invoice'
  | 'loa'
  | 'retail-receipt'
  | 'trademark-proof'
  | 'dmca-counter-notice'
  | 'product-label'
  | 'coa'
  | 'gmp-certificate'
  | 'cpc'
  | 'lab-test-report'
  | 'product-insert-photo'
  | 'order-id-list'
  | 'relay-documents'
  | 'other';

export interface UploadedDocument {
  id: string;
  type: SupportingDocumentType;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  s3Key?: string;
  url?: string;
}

// Form Data Structure
export interface AppealFormData {
  // Step 1: Appeal Type Selection
  appealType: AppealType | '';
  
  // Step 2: Account & Identification Details
  fullName: string;
  storeName: string;
  email: string;
  sellerId: string;
  asins: string[];
  
  // Step 3: Root Cause Analysis (Conditional)
  rootCauses: string[];
  rootCauseDetails: string;
  unauthorizedSupplier: string;
  relatedAccountReason: string;
  categoryRejectionReason: string;
  detailPageAbuseArea: string[];
  
  // Step 4: Corrective Actions Taken
  correctiveActionsTaken: string[];
  correctiveActionsDetails: string;
  
  // Step 5: Preventive Measures
  preventiveMeasures: string[];
  preventiveMeasuresDetails: string;
  
  // Step 6: Supporting Documentation
  uploadedDocuments: UploadedDocument[];
  
  // Additional metadata
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'draft' | 'generating' | 'completed' | 'failed';
}

// Generated Appeal Result
export interface GeneratedAppeal {
  id: string;
  userId?: string;
  formData: AppealFormData;
  appealText: string;
  generatedAt: Date;
  documentUrls: string[];
  status: 'success' | 'error';
  error?: string;
}

// Database Schema for DynamoDB
export interface AppealRecord {
  id: string; // Primary Key
  userId?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  formData: AppealFormData;
  appealText?: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface DocumentRecord {
  id: string; // Primary Key
  documentName: string;
  s3Key: string;
  s3Bucket: string;
  fileType: 'docx' | 'txt';
  uploadedAt: string;
  processedAt?: string;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  textContent?: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

// API Request/Response Types
export interface GenerateAppealRequest {
  formData: AppealFormData;
}

export interface GenerateAppealResponse {
  success: boolean;
  appealId?: string;
  appealText?: string;
  error?: string;
}

export interface ProcessDocumentRequest {
  documentId: string;
  s3Key: string;
}

export interface ProcessDocumentResponse {
  success: boolean;
  documentId?: string;
  textContent?: string;
  error?: string;
}

// Admin Interface Types
export interface AdminStats {
  totalAppeals: number;
  completedAppeals: number;
  failedAppeals: number;
  totalDocuments: number;
  processedDocuments: number;
}

export interface AdminAppealListItem {
  id: string;
  fullName: string;
  email: string;
  appealType: AppealType;
  createdAt: string;
  status: string;
}
