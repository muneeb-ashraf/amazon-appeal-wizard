// ============================================================================
// CACHE INVALIDATION API ENDPOINT
// Manually invalidate configuration cache
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache, getCacheStats } from '@/lib/config-loader';
import { ConfigType } from '@/lib/admin-config-types';

/**
 * POST /api/admin/cache/invalidate
 * Invalidate cache for specific config type or all configs
 * Body: { configType?: string } (optional, clears all if not provided)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { configType } = body;

    // Get stats before invalidation
    const statsBefore = getCacheStats();

    // Invalidate cache
    if (configType) {
      // Validate config type
      if (!['ai-instructions', 'form-fields', 'templates'].includes(configType)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid config type: ${configType}`,
          },
          { status: 400 }
        );
      }
      invalidateCache(configType as ConfigType);
    } else {
      invalidateCache();
    }

    // Get stats after invalidation
    const statsAfter = getCacheStats();

    console.log(`🗑️ [Admin API] Cache invalidated: ${configType || 'all'}`);

    return NextResponse.json({
      success: true,
      message: configType
        ? `Cache invalidated for ${configType}`
        : 'All caches invalidated',
      statsBefore,
      statsAfter,
    });
  } catch (error: any) {
    console.error('[Admin API] Error invalidating cache:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to invalidate cache',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cache/invalidate
 * Get current cache statistics
 */
export async function GET() {
  try {
    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[Admin API] Error getting cache stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get cache statistics',
      },
      { status: 500 }
    );
  }
}
