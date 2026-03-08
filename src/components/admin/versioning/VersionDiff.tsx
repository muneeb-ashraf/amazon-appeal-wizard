'use client';

// ============================================================================
// VERSION DIFF
// Side-by-side comparison of two configuration versions
// ============================================================================

import { useState, useEffect } from 'react';
import { ConfigType, ConfigurationRecord } from '@/lib/admin-config-types';

interface VersionDiffProps {
  configType: ConfigType;
  version1: number;
  version2: number;
  onClose: () => void;
}

export default function VersionDiff({
  configType,
  version1,
  version2,
  onClose,
}: VersionDiffProps) {
  const [config1, setConfig1] = useState<ConfigurationRecord | null>(null);
  const [config2, setConfig2] = useState<ConfigurationRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [version1, version2]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/config/${configType}?version=${version1}`),
        fetch(`/api/admin/config/${configType}?version=${version2}`),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      if (data1.success && data2.success) {
        setConfig1(data1.config);
        setConfig2(data2.config);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-4">Loading versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Version Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comparing v{version1} with v{version2}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-2 gap-4 p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Version 1 */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">Version {version1}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    config1?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : config1?.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {config1?.status}
                </span>
              </div>
              <div className="text-xs text-blue-700">
                {config1?.createdAt && formatDate(config1.createdAt)}
              </div>
              {config1?.description && (
                <div className="text-sm text-blue-800 mt-2">{config1.description}</div>
              )}
            </div>
            <div className="p-4 bg-white">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(config1?.configData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Version 2 */}
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-green-50 border-b border-green-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-900">Version {version2}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    config2?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : config2?.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {config2?.status}
                </span>
              </div>
              <div className="text-xs text-green-700">
                {config2?.createdAt && formatDate(config2.createdAt)}
              </div>
              {config2?.description && (
                <div className="text-sm text-green-800 mt-2">{config2.description}</div>
              )}
            </div>
            <div className="p-4 bg-white">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                {JSON.stringify(config2?.configData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Tip: Scroll to view full configuration data
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
