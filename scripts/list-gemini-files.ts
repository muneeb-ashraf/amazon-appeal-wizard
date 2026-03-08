#!/usr/bin/env tsx
// ============================================================================
// LIST GEMINI FILES
// ============================================================================

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { listGeminiFiles } from '../src/lib/gemini-rag-utils';

/**
 * List all files in Gemini
 */
async function listFiles() {
  console.log('📋 Listing files in Gemini File API...\n');

  try {
    const files = await listGeminiFiles();

    console.log(`Found ${files.length} files:\n`);

    if (files.length === 0) {
      console.log('No files found in Gemini.');
      console.log('\nTo upload files, run: npm run migrate-to-gemini\n');
      return;
    }

    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.displayName || file.name}`);
      console.log(`   ID: ${file.name}`);
      console.log(`   Type: ${file.mimeType}`);
      console.log('');
    });

    console.log(`\n✅ Total: ${files.length} files`);
    console.log('\nTo view files in Google AI Studio:');
    console.log('👉 https://aistudio.google.com/app/prompts/new_freeform\n');

  } catch (error: any) {
    console.error('❌ Error listing files:', error.message);
    process.exit(1);
  }
}

// Run
listFiles().catch((error) => {
  console.error('💥 Error:', error);
  process.exit(1);
});
