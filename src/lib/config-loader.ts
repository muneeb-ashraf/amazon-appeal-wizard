// ============================================================================
// CONFIGURATION LOADER SERVICE
// Central service for loading configurations with caching and fallback
// ============================================================================

import { getDynamoDbClient, getAppealsTable } from './aws-config';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import {
  ConfigType,
  ConfigurationRecord,
  AIInstructionsConfig,
  FormFieldsConfig,
  TemplatesConfig,
  ConfigCache,
  ConfigCacheEntry,
} from './admin-config-types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const configCache: ConfigCache = {};

// ============================================================================
// TABLE NAMES
// ============================================================================

export const getAdminConfigTable = () =>
  process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE || 'admin-configurations';

export const getAdminHistoryTable = () =>
  process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_HISTORY_TABLE || 'admin-configuration-history';

export const getAdminTestTable = () =>
  process.env.NEXT_PUBLIC_DYNAMODB_ADMIN_TEST_TABLE || 'admin-test-appeals';

// ============================================================================
// CORE CONFIGURATION LOADER
// ============================================================================

/**
 * Load active configuration from DynamoDB with caching
 * Falls back to default hardcoded config on error
 *
 * @param configType - Type of configuration to load
 * @param bypassCache - Skip cache and load fresh from DB
 * @returns Configuration data or default fallback
 */
export async function loadActiveConfig<T = any>(
  configType: ConfigType,
  bypassCache: boolean = false
): Promise<ConfigurationRecord<T> | null> {
  try {
    // Check cache first (unless bypassed)
    if (!bypassCache) {
      const cached = getCachedConfig<T>(configType);
      if (cached) {
        console.log(`✅ [Config Loader] Using cached ${configType} config`);
        return cached.config;
      }
    }

    console.log(`📥 [Config Loader] Loading ${configType} config from DynamoDB...`);

    // Query DynamoDB for active configuration
    const dynamoDb = getDynamoDbClient();
    const tableName = getAdminConfigTable();

    // Query for active config of this type
    const result = await dynamoDb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'status-updatedAt-index',
        KeyConditionExpression: 'configId = :configId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':configId': configType,
          ':status': 'active',
        },
        Limit: 1,
        ScanIndexForward: false, // Get most recent first
      })
    );

    if (result.Items && result.Items.length > 0) {
      const config = result.Items[0] as ConfigurationRecord<T>;

      // Cache the result
      setCachedConfig(configType, config);

      console.log(`✅ [Config Loader] Loaded ${configType} config version ${config.version}`);
      return config;
    }

    console.warn(`⚠️ [Config Loader] No active ${configType} config found in DynamoDB`);
    return null;
  } catch (error) {
    console.error(`❌ [Config Loader] Error loading ${configType} config:`, error);
    return null;
  }
}

/**
 * Load specific configuration version
 *
 * @param configType - Type of configuration to load
 * @param version - Version number to load
 * @returns Configuration data or null
 */
export async function loadConfigVersion<T = any>(
  configType: ConfigType,
  version: number
): Promise<ConfigurationRecord<T> | null> {
  try {
    console.log(`📥 [Config Loader] Loading ${configType} config version ${version}...`);

    const dynamoDb = getDynamoDbClient();
    const tableName = getAdminConfigTable();

    const result = await dynamoDb.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          configId: configType,
          version: version,
        },
      })
    );

    if (result.Item) {
      const config = result.Item as ConfigurationRecord<T>;
      console.log(`✅ [Config Loader] Loaded ${configType} config version ${version}`);
      return config;
    }

    console.warn(`⚠️ [Config Loader] Config version not found: ${configType} v${version}`);
    return null;
  } catch (error) {
    console.error(`❌ [Config Loader] Error loading ${configType} config version ${version}:`, error);
    return null;
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cached configuration if valid
 *
 * @param configType - Type of configuration
 * @returns Cached config entry or null if expired/missing
 */
function getCachedConfig<T = any>(configType: ConfigType): ConfigCacheEntry<T> | null {
  const cached = configCache[configType];

  if (!cached) {
    return null;
  }

  const now = Date.now();
  const age = now - cached.cachedAt;

  // Check if cache is still valid
  if (age < cached.ttl) {
    return cached as ConfigCacheEntry<T>;
  }

  // Cache expired
  console.log(`⏰ [Config Loader] Cache expired for ${configType} (age: ${age}ms, ttl: ${cached.ttl}ms)`);
  delete configCache[configType];
  return null;
}

/**
 * Set cached configuration
 *
 * @param configType - Type of configuration
 * @param config - Configuration to cache
 * @param ttl - Time-to-live in milliseconds (default: 5 minutes)
 */
function setCachedConfig<T = any>(
  configType: ConfigType,
  config: ConfigurationRecord<T>,
  ttl: number = DEFAULT_CACHE_TTL
): void {
  configCache[configType] = {
    config,
    cachedAt: Date.now(),
    ttl,
  };
  console.log(`💾 [Config Loader] Cached ${configType} config (ttl: ${ttl}ms)`);
}

/**
 * Invalidate cache for specific config type or all configs
 *
 * @param configType - Type of configuration to invalidate (optional, clears all if not provided)
 */
export function invalidateCache(configType?: ConfigType): void {
  if (configType) {
    delete configCache[configType];
    console.log(`🗑️ [Config Loader] Invalidated cache for ${configType}`);
  } else {
    Object.keys(configCache).forEach(key => delete configCache[key]);
    console.log(`🗑️ [Config Loader] Invalidated all config caches`);
  }
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats(): { [key: string]: { age: number; ttl: number; expired: boolean } } {
  const now = Date.now();
  const stats: any = {};

  Object.entries(configCache).forEach(([key, entry]) => {
    const age = now - entry.cachedAt;
    stats[key] = {
      age,
      ttl: entry.ttl,
      expired: age >= entry.ttl,
    };
  });

  return stats;
}

// ============================================================================
// FALLBACK TO DEFAULTS
// ============================================================================

/**
 * Get default hardcoded configuration as fallback
 * This ensures the app never breaks even if DynamoDB is unavailable
 *
 * @param configType - Type of configuration
 * @returns Default configuration
 */
export function getDefaultConfig(configType: ConfigType): any {
  console.warn(`⚠️ [Config Loader] Using fallback default config for ${configType}`);

  switch (configType) {
    case 'ai-instructions':
      return getDefaultAIInstructionsConfig();

    case 'form-fields':
      return getDefaultFormFieldsConfig();

    case 'templates':
      return getDefaultTemplatesConfig();

    default:
      console.error(`❌ [Config Loader] Unknown config type: ${configType}`);
      return null;
  }
}

/**
 * Default AI Instructions Configuration
 * Imported from existing hardcoded values in openai-utils.ts
 */
function getDefaultAIInstructionsConfig(): AIInstructionsConfig {
  // TODO: Import actual default sections from openai-utils.ts
  // For now, return a placeholder structure
  return {
    sections: [],
    appealTypeGuidance: [],
    globalSettings: {
      defaultModel: 'gpt-4o-mini',
      defaultTemperature: 0.7,
      maxRetries: 3,
      timeoutMs: 60000,
    },
  };
}

/**
 * Default Form Fields Configuration
 * Imported from existing hardcoded values in constants.ts
 */
function getDefaultFormFieldsConfig(): FormFieldsConfig {
  // TODO: Import actual default values from constants.ts
  // For now, return a placeholder structure
  return {
    appealTypes: [],
    rootCauses: [],
    correctiveActions: [],
    preventiveMeasures: [],
    supportingDocuments: [],
  };
}

/**
 * Default Templates Configuration
 */
function getDefaultTemplatesConfig(): TemplatesConfig {
  return {
    documents: [],
    settings: {
      similarityThreshold: 0.75,
      maxRelevantDocuments: 5,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load configuration with automatic fallback
 * This is the main function to use throughout the app
 *
 * @param configType - Type of configuration to load
 * @param bypassCache - Skip cache and load fresh
 * @returns Configuration data (from DB or fallback)
 */
export async function loadConfigWithFallback<T = any>(
  configType: ConfigType,
  bypassCache: boolean = false
): Promise<T> {
  try {
    const config = await loadActiveConfig<T>(configType, bypassCache);

    if (config) {
      return config.configData;
    }

    // No active config found, use default
    console.warn(`⚠️ [Config Loader] No active config for ${configType}, using default`);
    return getDefaultConfig(configType);
  } catch (error) {
    console.error(`❌ [Config Loader] Error loading config for ${configType}, using default:`, error);
    return getDefaultConfig(configType);
  }
}

/**
 * Check if configuration exists in database
 *
 * @param configType - Type of configuration
 * @returns True if active config exists
 */
export async function hasActiveConfig(configType: ConfigType): Promise<boolean> {
  try {
    const config = await loadActiveConfig(configType);
    return config !== null;
  } catch {
    return false;
  }
}
