// ============================================================================
// API ROUTE: Generate Individual Appeal Section
// ============================================================================

import { NextRequest } from 'next/server';
import { generateAppealSectionWithContext, APPEAL_SECTIONS, generateAppealSection } from '@/lib/openai-utils';
import { getCachedEmbeddings } from '@/lib/embeddings-cache';
import { queryGeminiFileSearch, formatRetrievedContext } from '@/lib/gemini-rag-utils';

// Route configuration - Each section gets its own 30-second window
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST handler for generating a single section of the appeal
 * Body should include:
 * - sectionId: 1-5
 * - formData: Appeal form data
 * - previousSections: Array of previously generated section texts (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, formData, previousSections = [] } = body;

    if (!sectionId || sectionId < 1 || sectionId > 5) {
      return new Response(
        JSON.stringify({ error: 'Invalid sectionId. Must be between 1 and 5.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!formData) {
      return new Response(
        JSON.stringify({ error: 'Missing formData' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const section = APPEAL_SECTIONS.find(s => s.id === sectionId);
    console.log(`🚀 Generating section ${sectionId}/5: ${section?.name}`);

    // Feature flag: Use Gemini RAG or legacy DynamoDB embeddings
    const USE_GEMINI_RAG = process.env.NEXT_PUBLIC_USE_GEMINI_RAG === 'true';
    let sectionText: string;

    if (USE_GEMINI_RAG) {
      console.log('✨ Using Gemini File Search RAG');

      try {
        // Query Gemini for relevant template chunks
        const { retrievedChunks, citations } = await queryGeminiFileSearch(formData, sectionId);

        if (retrievedChunks.length === 0) {
          console.warn('⚠️  No chunks retrieved from Gemini, falling back to DynamoDB embeddings');
          throw new Error('Gemini RAG returned no results');
        }

        // Format context for OpenAI
        const contextString = formatRetrievedContext(retrievedChunks, citations);

        // Convert context string to array of document texts for compatibility
        const relevantDocuments = retrievedChunks;

        console.log(`✅ Retrieved ${retrievedChunks.length} relevant chunks from Gemini`);

        // Generate section using Gemini-retrieved context
        sectionText = await generateAppealSection(
          sectionId,
          formData,
          relevantDocuments,
          previousSections
        );

      } catch (geminiError: any) {
        console.error('❌ Gemini RAG error, falling back to DynamoDB:', geminiError.message);

        // Fallback to DynamoDB embeddings
        const { documentTexts, documentEmbeddings, documentNames } = await getCachedEmbeddings();

        if (documentTexts.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No template documents available' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        console.log(`📚 Fallback: Using ${documentTexts.length} template documents from DynamoDB`);

        sectionText = await generateAppealSectionWithContext(
          sectionId,
          formData,
          documentTexts,
          documentEmbeddings,
          documentNames,
          previousSections
        );
      }

    } else {
      console.log('📚 Using legacy DynamoDB embeddings');

      // Legacy path: DynamoDB embeddings
      const { documentTexts, documentEmbeddings, documentNames } = await getCachedEmbeddings();

      if (documentTexts.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No template documents available' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`📚 Using ${documentTexts.length} template documents`);

      // Generate this specific section
      sectionText = await generateAppealSectionWithContext(
        sectionId,
        formData,
        documentTexts,
        documentEmbeddings,
        documentNames,
        previousSections
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        sectionId: sectionId,
        sectionName: section?.name,
        sectionText: sectionText,
        characterCount: sectionText.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error generating section:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate section',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
