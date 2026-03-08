// ============================================================================
// ADMIN CONFIGURATION TYPE DEFINITIONS
// ============================================================================

/**
 * Configuration Types
 */
export type ConfigType = 'ai-instructions' | 'form-fields' | 'templates';

/**
 * Configuration Status
 */
export type ConfigStatus = 'draft' | 'active' | 'archived';

/**
 * Configuration Change Action
 */
export type ConfigAction = 'created' | 'updated' | 'activated' | 'rolled_back' | 'archived';

// ============================================================================
// AI INSTRUCTIONS CONFIGURATION
// ============================================================================

/**
 * AI Section Definition
 * Represents one of the 5 sections of appeal generation
 */
export interface AISection {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  maxTokens: number;
  temperature: number;
  order: number;
}

/**
 * Appeal Type Specific Guidance
 * Custom instructions for specific appeal types
 */
export interface AppealTypeGuidance {
  appealType: string;
  additionalInstructions: string;
  emphasize: string[];
  avoid: string[];
  toneAdjustments?: {
    formality?: 'formal' | 'professional' | 'casual';
    urgency?: 'high' | 'medium' | 'low';
  };
}

/**
 * AI Instructions Configuration
 */
export interface AIInstructionsConfig {
  sections: AISection[];
  appealTypeGuidance: AppealTypeGuidance[];
  globalSettings: {
    defaultModel: string;
    defaultTemperature: number;
    maxRetries: number;
    timeoutMs: number;
  };
}

// ============================================================================
// FORM FIELDS CONFIGURATION
// ============================================================================

/**
 * Appeal Type Definition
 */
export interface AppealTypeConfig {
  value: string;
  label: string;
  description?: string;
  enabled: boolean;
  order: number;
  category?: 'seller-suspension' | 'listing-issue' | 'kdp-acx' | 'fba' | 'relay' | 'other';
}

/**
 * Root Cause Definition
 */
export interface RootCauseConfig {
  id: string;
  text: string;
  appealTypes: string[]; // Which appeal types this root cause applies to
  enabled: boolean;
  order: number;
  requiresDetails?: boolean;
  detailsPrompt?: string;
}

/**
 * Corrective Action Definition
 */
export interface CorrectiveActionConfig {
  id: string;
  text: string;
  category: string;
  appealTypes: string[]; // Which appeal types this action applies to
  enabled: boolean;
  order: number;
}

/**
 * Preventive Measure Definition
 */
export interface PreventiveMeasureConfig {
  id: string;
  text: string;
  category: string;
  appealTypes: string[]; // Which appeal types this measure applies to
  enabled: boolean;
  order: number;
}

/**
 * Supporting Document Type Definition
 */
export interface SupportingDocumentConfig {
  value: string;
  label: string;
  appealTypes: string[]; // Which appeal types typically need this document
  enabled: boolean;
  order: number;
}

/**
 * Form Fields Configuration
 */
export interface FormFieldsConfig {
  appealTypes: AppealTypeConfig[];
  rootCauses: RootCauseConfig[];
  correctiveActions: CorrectiveActionConfig[];
  preventiveMeasures: PreventiveMeasureConfig[];
  supportingDocuments: SupportingDocumentConfig[];
}

// ============================================================================
// TEMPLATE DOCUMENT CONFIGURATION
// ============================================================================

/**
 * Template Document Metadata
 */
export interface TemplateDocumentConfig {
  id: string;
  documentName: string;
  s3Key: string;
  s3Bucket: string;
  fileType: 'docx' | 'txt';
  appealTypes: string[]; // Which appeal types this template is relevant for
  uploadedAt: string;
  uploadedBy?: string;
  processedAt?: string;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  enabled: boolean;
  tags?: string[];
  description?: string;
  // Gemini-specific fields
  geminiFileId?: string; // Gemini File API ID (files/abc123)
  geminiUploadedAt?: string; // When uploaded to Gemini
}

/**
 * Templates Configuration
 */
export interface TemplatesConfig {
  documents: TemplateDocumentConfig[];
  settings: {
    similarityThreshold: number;
    maxRelevantDocuments: number;
    // Gemini File Search settings
    geminiCorpusId?: string; // Gemini File Search corpus/store ID
    useGeminiRAG?: boolean; // Feature flag for Gemini RAG
    geminiChunkingConfig?: {
      maxTokensPerChunk: number;
      maxOverlapTokens: number;
    };
  };
}

// ============================================================================
// CONFIGURATION RECORD (DynamoDB Schema)
// ============================================================================

/**
 * Base Configuration Record
 * Stored in 'admin-configurations' table
 */
export interface ConfigurationRecord<T = any> {
  configId: ConfigType; // PK
  version: number; // SK (timestamp-based)
  status: ConfigStatus;
  configData: T;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  createdBy?: string;
  description?: string;
  parentVersion?: number; // Previous version number for tracking
}

/**
 * Configuration History Record
 * Stored in 'admin-configuration-history' table
 */
export interface ConfigurationHistoryRecord {
  historyId: string; // PK (UUID)
  timestamp: number; // SK
  configId: ConfigType;
  version: number;
  action: ConfigAction;
  changedBy?: string;
  changeDetails?: {
    before?: any;
    after?: any;
    diff?: any;
  };
  description?: string;
}

/**
 * Test Appeal Record
 * Stored in 'admin-test-appeals' table
 */
export interface TestAppealRecord {
  testId: string; // PK (UUID)
  configVersion: number;
  configSnapshot: {
    aiInstructions?: AIInstructionsConfig;
    formFields?: FormFieldsConfig;
  };
  formData: any; // Test input data
  generatedAppeal: string;
  createdAt: string;
  createdBy?: string;
  notes?: string;
  comparisonWith?: string; // Another testId to compare with
  metadata?: {
    ragMethod?: 'gemini' | 'dynamodb';
    modelUsed?: string;
    sectionsGenerated?: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Get Configuration Request
 */
export interface GetConfigRequest {
  configType: ConfigType;
  version?: number; // If not provided, returns active version
}

/**
 * Get Configuration Response
 */
export interface GetConfigResponse<T = any> {
  success: boolean;
  config?: ConfigurationRecord<T>;
  error?: string;
}

/**
 * List Configurations Request
 */
export interface ListConfigVersionsRequest {
  configType: ConfigType;
  status?: ConfigStatus;
  limit?: number;
  offset?: number;
}

/**
 * List Configurations Response
 */
export interface ListConfigVersionsResponse<T = any> {
  success: boolean;
  configs?: ConfigurationRecord<T>[];
  total?: number;
  error?: string;
}

/**
 * Create Configuration Request
 */
export interface CreateConfigRequest<T = any> {
  configType: ConfigType;
  configData: T;
  description?: string;
  status?: 'draft' | 'active'; // Default: draft
}

/**
 * Create Configuration Response
 */
export interface CreateConfigResponse<T = any> {
  success: boolean;
  config?: ConfigurationRecord<T>;
  error?: string;
}

/**
 * Update Configuration Request
 */
export interface UpdateConfigRequest<T = any> {
  configType: ConfigType;
  version: number;
  configData: T;
  description?: string;
}

/**
 * Update Configuration Response
 */
export interface UpdateConfigResponse<T = any> {
  success: boolean;
  config?: ConfigurationRecord<T>;
  error?: string;
}

/**
 * Activate Configuration Request
 */
export interface ActivateConfigRequest {
  configType: ConfigType;
  version: number;
}

/**
 * Activate Configuration Response
 */
export interface ActivateConfigResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Rollback Configuration Request
 */
export interface RollbackConfigRequest {
  configType: ConfigType;
  targetVersion: number;
}

/**
 * Rollback Configuration Response
 */
export interface RollbackConfigResponse {
  success: boolean;
  newConfig?: ConfigurationRecord;
  error?: string;
}

/**
 * Test Appeal Generation Request
 */
export interface TestAppealRequest {
  configVersion?: number; // If not provided, uses active config
  formData: any;
  notes?: string;
}

/**
 * Test Appeal Generation Response
 */
export interface TestAppealResponse {
  success: boolean;
  testId?: string;
  generatedAppeal?: string;
  error?: string;
}

/**
 * Compare Appeals Request
 */
export interface CompareAppealsRequest {
  testId1: string;
  testId2: string;
}

/**
 * Compare Appeals Response
 */
export interface CompareAppealsResponse {
  success: boolean;
  comparison?: {
    test1: TestAppealRecord;
    test2: TestAppealRecord;
    differences: Array<{
      type: 'added' | 'removed' | 'changed';
      path: string;
      value1?: any;
      value2?: any;
    }>;
  };
  error?: string;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Configuration Cache Entry
 */
export interface ConfigCacheEntry<T = any> {
  config: ConfigurationRecord<T>;
  cachedAt: number;
  ttl: number; // Time-to-live in milliseconds
}

/**
 * Configuration Cache
 */
export interface ConfigCache {
  [configType: string]: ConfigCacheEntry;
}
