'use client';

// ============================================================================
// HISTORY PAGE
// View configuration change history and version control
// ============================================================================

import { useState } from 'react';
import { ConfigType } from '@/lib/admin-config-types';
import VersionHistory from '@/components/admin/versioning/VersionHistory';
import VersionDiff from '@/components/admin/versioning/VersionDiff';
import RollbackModal from '@/components/admin/versioning/RollbackModal';
import ExportImport from '@/components/admin/versioning/ExportImport';

export default function HistoryPage() {
  const [selectedConfigType, setSelectedConfigType] = useState<ConfigType>('ai-instructions');
  const [compareVersions, setCompareVersions] = useState<[number, number] | null>(null);
  const [rollbackVersion, setRollbackVersion] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const configTypes: { value: ConfigType; label: string }[] = [
    { value: 'ai-instructions', label: 'AI Instructions' },
    { value: 'form-fields', label: 'Form Fields' },
    { value: 'templates', label: 'Templates' },
  ];

  const handleCompare = (version1: number, version2: number) => {
    setCompareVersions([version1, version2]);
  };

  const handleRollbackSuccess = () => {
    setRollbackVersion(null);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuration History</h1>
            <p className="text-sm text-gray-600 mt-1">
              View changes, compare versions, and rollback configurations
            </p>
          </div>
        </div>

        {/* Config Type Selector */}
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Configuration Type:</label>
          <div className="flex space-x-2">
            {configTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedConfigType(type.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  selectedConfigType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Export/Import */}
      <ExportImport
        configType={selectedConfigType}
        onImportSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Version History Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Version Timeline</h2>
        <VersionHistory
          key={`${selectedConfigType}-${refreshKey}`}
          configType={selectedConfigType}
          onVersionSelect={(version) => setRollbackVersion(version)}
          onCompare={handleCompare}
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Compare Versions</h3>
          <p className="text-xs text-blue-700">
            Select two versions from the timeline and click "Compare" to see differences
            side-by-side.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-900 mb-2">↩️ Rollback</h3>
          <p className="text-xs text-orange-700">
            Click "View" on any version to rollback. The current active version will be archived
            and a new version created.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">📦 Export/Import</h3>
          <p className="text-xs text-green-700">
            Export configurations as JSON for backup, or import to restore previous
            configurations.
          </p>
        </div>
      </div>

      {/* Modals */}
      {compareVersions && (
        <VersionDiff
          configType={selectedConfigType}
          version1={compareVersions[0]}
          version2={compareVersions[1]}
          onClose={() => setCompareVersions(null)}
        />
      )}

      {rollbackVersion && (
        <RollbackModal
          configType={selectedConfigType}
          targetVersion={rollbackVersion}
          onSuccess={handleRollbackSuccess}
          onCancel={() => setRollbackVersion(null)}
        />
      )}
    </div>
  );
}
