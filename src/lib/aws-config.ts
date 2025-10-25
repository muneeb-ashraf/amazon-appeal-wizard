// ============================================================================
// AWS CONFIGURATION
// ============================================================================

import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Helper to get AWS config (lazy evaluation for scripts)
const getAWSConfig = () => ({
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
  },
});

// S3 Client - lazy initialization
let _s3Client: S3Client | null = null;
export const getS3Client = () => {
  if (!_s3Client) {
    _s3Client = new S3Client(getAWSConfig());
  }
  return _s3Client;
};

// For backwards compatibility
export const s3Client = new Proxy({} as S3Client, {
  get: (_, prop) => {
    return (getS3Client() as any)[prop];
  }
});

// DynamoDB Client - lazy initialization
let _dynamoDbClient: DynamoDBDocumentClient | null = null;
export const getDynamoDbClient = () => {
  if (!_dynamoDbClient) {
    const ddbClient = new DynamoDBClient(getAWSConfig());
    _dynamoDbClient = DynamoDBDocumentClient.from(ddbClient);
  }
  return _dynamoDbClient;
};

// For backwards compatibility
export const dynamoDbClient = new Proxy({} as DynamoDBDocumentClient, {
  get: (_, prop) => {
    return (getDynamoDbClient() as any)[prop];
  }
});

// Table names (using functions for lazy evaluation)
export const getAppealsTable = () => process.env.NEXT_PUBLIC_DYNAMODB_APPEALS_TABLE || 'amazon-appeals';
export const getDocumentsTable = () => process.env.NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE || 'amazon-documents';

// S3 Bucket (using function for lazy evaluation)
export const getS3Bucket = () => process.env.NEXT_PUBLIC_AWS_S3_BUCKET || '';

// OpenAI Configuration (using function for lazy evaluation)
export const getOpenAIKey = () => process.env.OPENAI_API_KEY || '';

// Legacy constants for backwards compatibility (will use getter functions internally)
export const APPEALS_TABLE = getAppealsTable();
export const DOCUMENTS_TABLE = getDocumentsTable();
export const S3_BUCKET = getS3Bucket();
export const OPENAI_API_KEY = getOpenAIKey();
