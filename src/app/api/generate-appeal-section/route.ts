// ============================================================================
// API ROUTE: Generate Individual Appeal Section
// ============================================================================

import { NextRequest } from 'next/server';
import { generateAppealSectionWithContext, APPEAL_SECTIONS } from '@/lib/openai-utils';
import { getCachedEmbeddings } from '@/lib/embeddings-cache';

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

    // Get cached embeddings
    const { documentTexts, documentEmbeddings, documentNames } = await getCachedEmbeddings();

    if (documentTexts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No template documents available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📚 Using ${documentTexts.length} template documents`);

    // Generate this specific section
    const sectionText = await generateAppealSectionWithContext(
      sectionId,
      formData,
      documentTexts,
      documentEmbeddings,
      documentNames,
      previousSections
    );

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
