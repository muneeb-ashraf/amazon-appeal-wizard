// ============================================================================
// API ROUTE: Generate Appeal with Streaming (SSE)
// ============================================================================

import { NextRequest } from 'next/server';
import { generateAppealWithContext } from '@/lib/openai-utils';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, APPEALS_TABLE } from '@/lib/aws-config';
import { getCachedEmbeddings } from '@/lib/embeddings-cache';
import { v4 as uuidv4 } from 'uuid';

// Route configuration
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * POST handler with Server-Sent Events for streaming appeal generation
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    console.log('Generating appeal with streaming for:', formData.sellerName);

    const encoder = new TextEncoder();
    
    // Create a TransformStream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE message
    const sendSSE = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start async generation process
    (async () => {
      try {
        await sendSSE({ type: 'status', message: 'Loading document templates...' });

        // Get cached embeddings
        const { documentTexts, documentEmbeddings } = await getCachedEmbeddings();

        if (documentTexts.length === 0) {
          await sendSSE({ type: 'error', message: 'No template documents available' });
          await writer.close();
          return;
        }

        await sendSSE({ 
          type: 'status', 
          message: `Found ${documentTexts.length} template documents. Generating appeal...` 
        });

        let lastProgress = 0;
        // Generate appeal with streaming callback
        const appealText = await generateAppealWithContext(
          formData,
          documentTexts,
          documentEmbeddings,
          async (chunk: string, totalLength: number) => {
            // Calculate progress (estimate 3500 tokens max)
            const progress = Math.min(95, Math.floor((totalLength / 3500) * 100));
            
            // Only send updates every 5% to avoid too many messages
            if (progress >= lastProgress + 5) {
              await sendSSE({
                type: 'progress',
                chunk: chunk,
                progress: progress,
                totalLength: totalLength,
              });
              lastProgress = progress;
            }
          }
        );

        await sendSSE({ type: 'status', message: 'Saving to database...', progress: 98 });

        // Save to DynamoDB
        const appealId = uuidv4();
        const appealData = {
          id: appealId,
          sellerName: formData.sellerName,
          appealType: formData.appealType,
          appealText: appealText,
          createdAt: new Date().toISOString(),
          formData: formData,
        };

        await dynamoDbClient.send(
          new PutCommand({
            TableName: APPEALS_TABLE,
            Item: appealData,
          })
        );

        await sendSSE({
          type: 'complete',
          appealId: appealId,
          appealText: appealText,
          progress: 100,
        });

        await writer.close();
      } catch (error: any) {
        console.error('Error generating appeal:', error);
        await sendSSE({
          type: 'error',
          message: error.message || 'Failed to generate appeal',
        });
        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in stream setup:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate appeal' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
