#!/usr/bin/env tsx
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiConnection() {
  console.log('🔍 Testing Gemini API Connection...\n');

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY not set in .env.local');
    process.exit(1);
  }
  console.log('✅ API key found\n');

  const configuredModel = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`🤖 Testing model: ${configuredModel}\n`);

  const genAI = new GoogleGenerativeAI(apiKey);

  const modelsToTest = [
    configuredModel,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
  ];

  for (const modelName of [...new Set(modelsToTest)]) {
    try {
      console.log(`\n📝 Testing: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent([
        { text: 'Reply with exactly: "Connection successful"' }
      ]);

      const response = result.response.text();
      console.log(`✅ ${modelName}: SUCCESS`);
      console.log(`   Response: ${response.substring(0, 100)}`);

    } catch (error: any) {
      console.log(`❌ ${modelName}: FAILED`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test complete!\n');
  console.log('Recommended configuration:');
  console.log('  GOOGLE_GEMINI_MODEL=gemini-2.5-flash  # Fast and cost-effective');
  console.log('  GOOGLE_GEMINI_MODEL=gemini-2.5-pro    # For complex reasoning\n');
}

testGeminiConnection().catch(console.error);
