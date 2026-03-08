// ============================================================================
// GET CONFIGURATION API ENDPOINT
// Get active or specific version of a configuration
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  loadActiveConfig,
  loadConfigVersion,
} from '@/lib/config-loader';
import { ConfigType } from '@/lib/admin-config-types';

/**
 * GET /api/admin/config/:configType
 * Get active configuration or specific version
 * Query params: version (optional)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { configType: string } }
) {
  try {
    const configType = params.configType as ConfigType;
    const searchParams = request.nextUrl.searchParams;
    const version = searchParams.get('version');

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

    // Load specific version or active config
    let config;
    if (version) {
      const versionNumber = parseInt(version, 10);
      if (isNaN(versionNumber)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Version must be a number',
          },
          { status: 400 }
        );
      }
      config = await loadConfigVersion(configType, versionNumber);
    } else {
      config = await loadActiveConfig(configType);
    }

    if (!config) {
      return NextResponse.json(
        {
          success: false,
          error: `No ${version ? 'version ' + version : 'active configuration'} found for ${configType}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('[Admin API] Error fetching config:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch configuration',
      },
      { status: 500 }
    );
  }
}
