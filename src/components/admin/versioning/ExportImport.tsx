'use client';

// ============================================================================
// EXPORT/IMPORT
// Configuration export and import functionality
// ============================================================================

import { useState } from 'react';
import { ConfigType } from '@/lib/admin-config-types';
import toast from 'react-hot-toast';

interface ExportImportProps {
  configType: ConfigType;
  currentVersion?: number;
  onImportSuccess?: () => void;
}

export default function ExportImport({
  configType,
  currentVersion,
  onImportSuccess,
}: ExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const url = currentVersion
        ? `/api/admin/config/${configType}/export?version=${currentVersion}`
        : `/api/admin/config/${configType}/export`;

      const response = await fetch(url);

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${configType}-${currentVersion || 'active'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        toast.success('Configuration exported successfully');
      } else {
        toast.error('Failed to export configuration');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export configuration');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);

      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch(`/api/admin/config/${configType}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configData: data.configData,
          description: data.description || `Imported from ${file.name}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Configuration imported as draft');
        setShowImport(false);
        if (onImportSuccess) onImportSuccess();
      } else {
        toast.error(result.error || 'Failed to import configuration');
      }
    } catch (error: any) {
      console.error('Error importing:', error);
      toast.error(error.message || 'Failed to import configuration');
    } finally {
      setIsImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Export/Import</h3>
          <p className="text-xs text-gray-600 mt-1">
            Backup or restore configuration as JSON
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
            )}
            <span>Export</span>
          </button>

          {/* Import Button */}
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L9 8m4-4v12"
              />
            </svg>
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Import File Input */}
      {showImport && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="block">
            <div className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 transition-colors">
              <div className="text-center">
                {isImporting ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                    <span className="text-sm text-gray-600">Importing...</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-600">
                      Click to select JSON file or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Configuration will be imported as a draft
                    </p>
                  </>
                )}
              </div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              disabled={isImporting}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
