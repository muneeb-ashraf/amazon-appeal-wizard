'use client';

// ============================================================================
// VERSION HISTORY
// Timeline view of configuration changes
// ============================================================================

import { useState, useEffect } from 'react';
import { ConfigType, ConfigurationHistoryRecord } from '@/lib/admin-config-types';

interface VersionHistoryProps {
  configType: ConfigType;
  onVersionSelect?: (version: number) => void;
  onCompare?: (version1: number, version2: number) => void;
}

export default function VersionHistory({
  configType,
  onVersionSelect,
  onCompare,
}: VersionHistoryProps) {
  const [history, setHistory] = useState<ConfigurationHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);

  useEffect(() => {
    loadHistory();
  }, [configType]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/history/${configType}?limit=50`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompareToggle = (version: number) => {
    if (selectedForCompare.includes(version)) {
      setSelectedForCompare(selectedForCompare.filter((v) => v !== version));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, version]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare(selectedForCompare[0], selectedForCompare[1]);
      setSelectedForCompare([]);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: string) => {
    const icons = {
      created: '✨',
      updated: '📝',
      activated: '✅',
      rolled_back: '↩️',
      archived: '📦',
    };
    return icons[action as keyof typeof icons] || '•';
  };

  const getActionColor = (action: string) => {
    const colors = {
      created: 'text-green-600',
      updated: 'text-blue-600',
      activated: 'text-green-700',
      rolled_back: 'text-orange-600',
      archived: 'text-gray-600',
    };
    return colors[action as keyof typeof colors] || 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">No history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare Button */}
      {selectedForCompare.length === 2 && onCompare && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <span className="font-medium">2 versions selected for comparison</span>
            <span className="ml-2 text-blue-600">
              v{selectedForCompare[0]} vs v{selectedForCompare[1]}
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCompare}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Compare Versions
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* History items */}
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={item.historyId} className="relative pl-16 pr-4 py-3">
              {/* Timeline dot */}
              <div
                className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white bg-gray-200 ${
                  index === 0 ? 'bg-blue-500' : ''
                }`}
              ></div>

              {/* Content card */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getActionIcon(item.action)}</span>
                      <span className={`font-medium ${getActionColor(item.action)}`}>
                        {item.action.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">v{item.version}</span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded font-medium">
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatDate(item.timestamp)}</span>
                      {item.changedBy && <span>by {item.changedBy}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {onCompare && (
                      <button
                        onClick={() => handleCompareToggle(item.version)}
                        className={`px-3 py-1.5 text-sm rounded transition-colors ${
                          selectedForCompare.includes(item.version)
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                        }`}
                        disabled={
                          !selectedForCompare.includes(item.version) &&
                          selectedForCompare.length >= 2
                        }
                      >
                        {selectedForCompare.includes(item.version) ? '✓ Selected' : 'Compare'}
                      </button>
                    )}
                    {onVersionSelect && (
                      <button
                        onClick={() => onVersionSelect(item.version)}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
