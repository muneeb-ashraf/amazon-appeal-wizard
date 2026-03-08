# DynamoDB Table Schemas for Admin Panel

This document describes the three new DynamoDB tables required for the admin panel functionality.

## Table 1: `admin-configurations`

**Purpose**: Store all customizable configurations with versioning

### Primary Key Structure
- **Partition Key**: `configId` (String) - Values: `"ai-instructions"`, `"form-fields"`, `"templates"`
- **Sort Key**: `version` (Number) - Timestamp-based version number (milliseconds since epoch)

### Attributes
| Attribute | Type | Description |
|-----------|------|-------------|
| configId | String | Configuration type (PK) |
| version | Number | Version timestamp (SK) |
| status | String | `"draft"`, `"active"`, or `"archived"` |
| configData | Map | JSON configuration data (varies by configId) |
| createdAt | String | ISO timestamp of creation |
| updatedAt | String | ISO timestamp of last update |
| createdBy | String | Admin user identifier (optional) |
| description | String | Change description (optional) |
| parentVersion | Number | Previous version number (optional) |

### Global Secondary Indexes

#### GSI 1: `status-updatedAt-index`
- **Partition Key**: `configId` (String)
- **Sort Key**: `status` (String)
- **Projection**: ALL
- **Purpose**: Find active configurations quickly

#### GSI 2: `configType-version-index`
- **Partition Key**: `configId` (String)
- **Sort Key**: `version` (Number)
- **Projection**: ALL
- **Purpose**: List all versions of a config type

### AWS CLI Creation Command

```bash
aws dynamodb create-table \
  --table-name admin-configurations \
  --attribute-definitions \
    AttributeName=configId,AttributeType=S \
    AttributeName=version,AttributeType=N \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=configId,KeyType=HASH \
    AttributeName=version,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"status-updatedAt-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"configId\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Example Item

```json
{
  "configId": "ai-instructions",
  "version": 1709740800000,
  "status": "active",
  "configData": {
    "sections": [
      {
        "id": "section-1",
        "name": "Introduction",
        "description": "Opening statement",
        "systemPrompt": "You are an expert appeal writer...",
        "userPromptTemplate": "Write an introduction for {appealType}...",
        "maxTokens": 500,
        "temperature": 0.7,
        "order": 1
      }
    ],
    "appealTypeGuidance": [],
    "globalSettings": {
      "defaultModel": "gpt-4o-mini",
      "defaultTemperature": 0.7,
      "maxRetries": 3,
      "timeoutMs": 60000
    }
  },
  "createdAt": "2024-03-06T12:00:00.000Z",
  "updatedAt": "2024-03-06T12:00:00.000Z",
  "createdBy": "admin",
  "description": "Initial configuration from codebase"
}
```

---

## Table 2: `admin-configuration-history`

**Purpose**: Audit trail of all configuration changes

### Primary Key Structure
- **Partition Key**: `historyId` (String) - UUID
- **Sort Key**: `timestamp` (Number) - Milliseconds since epoch

### Attributes
| Attribute | Type | Description |
|-----------|------|-------------|
| historyId | String | Unique identifier (PK, UUID) |
| timestamp | Number | When the change occurred (SK) |
| configId | String | Which config was changed |
| version | Number | Version number affected |
| action | String | `"created"`, `"updated"`, `"activated"`, `"rolled_back"`, `"archived"` |
| changedBy | String | Admin user identifier (optional) |
| changeDetails | Map | Before/after diff (optional) |
| description | String | Change description (optional) |

### Global Secondary Indexes

#### GSI 1: `configId-timestamp-index`
- **Partition Key**: `configId` (String)
- **Sort Key**: `timestamp` (Number)
- **Projection**: ALL
- **Purpose**: Get history for a specific config type

### AWS CLI Creation Command

```bash
aws dynamodb create-table \
  --table-name admin-configuration-history \
  --attribute-definitions \
    AttributeName=historyId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
    AttributeName=configId,AttributeType=S \
  --key-schema \
    AttributeName=historyId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"configId-timestamp-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"configId\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Example Item

```json
{
  "historyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": 1709740800000,
  "configId": "ai-instructions",
  "version": 1709740800000,
  "action": "activated",
  "changedBy": "admin",
  "changeDetails": {
    "before": {
      "status": "draft"
    },
    "after": {
      "status": "active"
    }
  },
  "description": "Activated new AI instructions configuration"
}
```

---

## Table 3: `admin-test-appeals`

**Purpose**: Store test appeal generations for comparison

### Primary Key Structure
- **Partition Key**: `testId` (String) - UUID

### Attributes
| Attribute | Type | Description |
|-----------|------|-------------|
| testId | String | Unique identifier (PK, UUID) |
| configVersion | Number | Version used for generation |
| configSnapshot | Map | Full config used (for reproducibility) |
| formData | Map | Test input data |
| generatedAppeal | String | Output appeal text |
| createdAt | String | ISO timestamp |
| createdBy | String | Admin user identifier (optional) |
| notes | String | Admin notes about this test (optional) |
| comparisonWith | String | Another testId to compare with (optional) |

### Global Secondary Indexes

#### GSI 1: `createdBy-createdAt-index`
- **Partition Key**: `createdBy` (String)
- **Sort Key**: `createdAt` (String)
- **Projection**: ALL
- **Purpose**: List tests by user

### AWS CLI Creation Command

```bash
aws dynamodb create-table \
  --table-name admin-test-appeals \
  --attribute-definitions \
    AttributeName=testId,AttributeType=S \
    AttributeName=createdBy,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=testId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"createdBy-createdAt-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"createdBy\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"},
        \"ProvisionedThroughput\": {
          \"ReadCapacityUnits\": 5,
          \"WriteCapacityUnits\": 5
        }
      }
    ]" \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### Example Item

```json
{
  "testId": "test-a1b2c3d4-e5f6-7890",
  "configVersion": 1709740800000,
  "configSnapshot": {
    "aiInstructions": {
      "sections": [],
      "appealTypeGuidance": [],
      "globalSettings": {}
    }
  },
  "formData": {
    "appealType": "inauthenticity-supply-chain",
    "fullName": "Test Seller",
    "email": "test@example.com",
    "rootCauses": ["Retail arbitrage without authorization"],
    "correctiveActionsTaken": ["Removed all listings"],
    "preventiveMeasures": ["Will obtain brand authorization"]
  },
  "generatedAppeal": "Dear Amazon Performance Team...",
  "createdAt": "2024-03-06T12:30:00.000Z",
  "createdBy": "admin",
  "notes": "Testing new prompt for inauthenticity appeals",
  "comparisonWith": "test-xyz123"
}
```

---

## Quick Setup Script

Run all three table creation commands at once:

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Create admin-configurations table
aws dynamodb create-table \
  --table-name admin-configurations \
  --attribute-definitions \
    AttributeName=configId,AttributeType=S \
    AttributeName=version,AttributeType=N \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=configId,KeyType=HASH \
    AttributeName=version,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"status-updatedAt-index\",\"KeySchema\":[{\"AttributeName\":\"configId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

# Create admin-configuration-history table
aws dynamodb create-table \
  --table-name admin-configuration-history \
  --attribute-definitions \
    AttributeName=historyId,AttributeType=S \
    AttributeName=timestamp,AttributeType=N \
    AttributeName=configId,AttributeType=S \
  --key-schema \
    AttributeName=historyId,KeyType=HASH \
    AttributeName=timestamp,KeyType=RANGE \
  --global-secondary-indexes \
    "[{\"IndexName\":\"configId-timestamp-index\",\"KeySchema\":[{\"AttributeName\":\"configId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"timestamp\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

# Create admin-test-appeals table
aws dynamodb create-table \
  --table-name admin-test-appeals \
  --attribute-definitions \
    AttributeName=testId,AttributeType=S \
    AttributeName=createdBy,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
  --key-schema \
    AttributeName=testId,KeyType=HASH \
  --global-secondary-indexes \
    "[{\"IndexName\":\"createdBy-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"createdBy\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}]" \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

echo "All admin panel tables created successfully!"
```

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Admin Panel DynamoDB Tables
NEXT_PUBLIC_DYNAMODB_ADMIN_CONFIG_TABLE=admin-configurations
NEXT_PUBLIC_DYNAMODB_ADMIN_HISTORY_TABLE=admin-configuration-history
NEXT_PUBLIC_DYNAMODB_ADMIN_TEST_TABLE=admin-test-appeals
```

---

## Billing Estimate

All tables use **PAY_PER_REQUEST** (on-demand) billing mode:
- **Reads**: $0.25 per million read request units
- **Writes**: $1.25 per million write request units
- **Storage**: $0.25 per GB-month

### Expected Monthly Costs (Low Usage)
- Configuration reads: ~1,000/day × 30 days = 30,000 reads = **$0.01**
- Configuration writes: ~10/day × 30 days = 300 writes = **$0.0004**
- Storage: <1 GB = **$0.25**

**Total estimated cost: ~$0.26/month** for admin panel tables

---

## Migration Notes

1. **Initial Seed**: Run `scripts/seed-admin-config.ts` to populate tables with current hardcoded configurations
2. **Backup**: Always export current configs before making changes
3. **Rollback**: Use version history to rollback if needed
4. **Testing**: Use test table to validate changes before activating

---

## Monitoring

Monitor these CloudWatch metrics:
- `ConsumedReadCapacityUnits`
- `ConsumedWriteCapacityUnits`
- `UserErrors` (throttling)
- `SystemErrors`

Set alarms for:
- Read/write throttling
- Error rates >1%
- Unusually high request volume
