// ============================================================================
// ENVIRONMENT VALIDATION SCRIPT
// ============================================================================
// Run this script to verify your environment is properly configured
// Usage: npx tsx scripts/validate-env.ts
// ============================================================================

import * as dotenv from 'dotenv';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface ValidationResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
}

const results: ValidationResult[] = [];

function addResult(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ name, status, message });
}

async function validateEnvironmentVariables() {
  console.log('\n🔍 Validating Environment Variables...\n');

  const requiredVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_AWS_REGION',
    'NEXT_AWS_ACCESS_KEY_ID',
    'NEXT_AWS_SECRET_ACCESS_KEY',
    'NEXT_PUBLIC_AWS_S3_BUCKET',
    'NEXT_PUBLIC_DYNAMODB_APPEALS_TABLE',
    'NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE',
    'NEXT_PUBLIC_ADMIN_PASSWORD',
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value === '' || value.includes('your_') || value.includes('your-')) {
      addResult(varName, 'FAIL', 'Not set or contains placeholder value');
    } else {
      addResult(varName, 'PASS', 'Set correctly');
    }
  }
}

async function validateOpenAI() {
  console.log('🤖 Validating OpenAI API Key...\n');

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.models.list();
    addResult('OpenAI API', 'PASS', `Connected successfully (${response.data.length} models available)`);
  } catch (error: any) {
    addResult('OpenAI API', 'FAIL', error.message || 'Failed to connect');
  }
}

async function validateS3() {
  console.log('☁️ Validating AWS S3...\n');

  try {
    const s3Client = new S3Client({
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const bucket = process.env.NEXT_PUBLIC_AWS_S3_BUCKET;

    // Check documents folder
    const documentsCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'documents/',
      MaxKeys: 100,
    });

    const documentsResponse = await s3Client.send(documentsCommand);
    const docxCount = documentsResponse.Contents?.filter(obj => obj.Key?.endsWith('.docx')).length || 0;

    if (docxCount === 0) {
      addResult('S3 Documents', 'WARN', 'No DOCX files found in documents/ folder');
    } else if (docxCount < 38) {
      addResult('S3 Documents', 'WARN', `Only ${docxCount}/38 DOCX files found`);
    } else {
      addResult('S3 Documents', 'PASS', `Found ${docxCount} DOCX files`);
    }

    // Check documents-txt folder
    const txtCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'documents-txt/',
      MaxKeys: 100,
    });

    const txtResponse = await s3Client.send(txtCommand);
    const txtCount = txtResponse.Contents?.filter(obj => obj.Key?.endsWith('.txt')).length || 0;

    if (txtCount === 0) {
      addResult('S3 TXT Files', 'WARN', 'No TXT files found - run npm run process-documents');
    } else if (txtCount < 38) {
      addResult('S3 TXT Files', 'WARN', `Only ${txtCount}/38 TXT files found`);
    } else {
      addResult('S3 TXT Files', 'PASS', `Found ${txtCount} TXT files`);
    }

  } catch (error: any) {
    addResult('S3 Connection', 'FAIL', error.message || 'Failed to connect to S3');
  }
}

async function validateDynamoDB() {
  console.log('📊 Validating AWS DynamoDB...\n');

  try {
    const dynamoClient = new DynamoDBClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const command = new ListTablesCommand({});
    const response = await dynamoClient.send(command);

    const appealsTable = process.env.NEXT_PUBLIC_DYNAMODB_APPEALS_TABLE;
    const documentsTable = process.env.NEXT_PUBLIC_DYNAMODB_DOCUMENTS_TABLE;

    const tables = response.TableNames || [];

    if (tables.includes(appealsTable!)) {
      addResult('Appeals Table', 'PASS', `Table ${appealsTable} exists`);
    } else {
      addResult('Appeals Table', 'FAIL', `Table ${appealsTable} not found`);
    }

    if (tables.includes(documentsTable!)) {
      addResult('Documents Table', 'PASS', `Table ${documentsTable} exists`);
    } else {
      addResult('Documents Table', 'FAIL', `Table ${documentsTable} not found`);
    }

  } catch (error: any) {
    addResult('DynamoDB Connection', 'FAIL', error.message || 'Failed to connect to DynamoDB');
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');

  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  results.forEach((result) => {
    let icon = '';
    let color = '';

    switch (result.status) {
      case 'PASS':
        icon = '✅';
        passCount++;
        break;
      case 'WARN':
        icon = '⚠️';
        warnCount++;
        break;
      case 'FAIL':
        icon = '❌';
        failCount++;
        break;
    }

    console.log(`${icon} ${result.name.padEnd(30)} ${result.message}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log(`📊 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
  console.log('='.repeat(80));

  if (failCount > 0) {
    console.log('\n❌ VALIDATION FAILED - Please fix the issues above before proceeding.');
    console.log('\nCommon fixes:');
    console.log('  - Check .env.local file exists and has correct values');
    console.log('  - Verify AWS credentials with: aws sts get-caller-identity');
    console.log('  - Upload documents to S3: see UPLOAD_DOCUMENTS_GUIDE.md');
    console.log('  - Create DynamoDB tables: see SETUP_GUIDE.md');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\n⚠️ VALIDATION PASSED WITH WARNINGS - Some optional features may not work.');
    console.log('\nRecommended actions:');
    console.log('  - Upload documents to S3 if not done yet');
    console.log('  - Run: npm run process-documents');
  } else {
    console.log('\n✅ ALL VALIDATIONS PASSED! Your environment is ready.');
    console.log('\nNext steps:');
    console.log('  1. If documents not processed: npm run process-documents');
    console.log('  2. Start dev server: npm run dev');
    console.log('  3. Visit: http://localhost:3000');
  }
}

async function main() {
  console.log('🚀 Starting Environment Validation...');

  await validateEnvironmentVariables();
  await validateOpenAI();
  await validateS3();
  await validateDynamoDB();

  printResults();
}

main().catch((error) => {
  console.error('\n💥 Fatal error during validation:', error);
  process.exit(1);
});
