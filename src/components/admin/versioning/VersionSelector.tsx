'use client';

// ============================================================================
// VERSION SELECTOR
// Dropdown for selecting configuration versions
// ============================================================================

import { useState, useEffect } from 'react';
import { ConfigType, ConfigurationRecord } from '@/lib/admin-config-types';

interface VersionSelectorProps {
  configType: ConfigType;
  currentVersion?: number;
  onVersionChange: (version: number | null) => void;
}

export default function VersionSelector({
  configType,
  currentVersion,
  onVersionChange,
}: VersionSelectorProps) {
  const [versions, setVersions] = useState<ConfigurationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(currentVersion || null);

  useEffect(() => {
    loadVersions();
  }, [configType]);

  useEffect(() => {
    if (currentVersion) {
      setSelectedVersion(currentVersion);
    }
  }, [currentVersion]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/config/${configType}/versions`);
      const data = await response.json();

      if (data.success) {
        setVersions(data.configs || []);
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const version = value === 'active' ? null : parseInt(value);
    setSelectedVersion(version);
    onVersionChange(version);
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

  const getStatusBadge = (status: string) => {
    const badges = {
      active: '🟢',
      draft: '🟡',
      archived: '⚫',
    };
    return badges[status as keyof typeof badges] || '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Loading versions...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <label className="text-sm font-medium text-gray-700 shrink-0">Version:</label>
      <div className="flex-1 min-w-0">
        <select
          value={selectedVersion === null ? 'active' : selectedVersion}
          onChange={handleChange}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent truncate"
        >
          <option value="active">Active Version</option>
          <optgroup label="All Versions">
            {versions.map((version) => (
              <option key={version.version} value={version.version}>
                {getStatusBadge(version.status)} v{version.version} -{' '}
                {formatDate(version.createdAt)} - {version.status}
                {version.description && ` - ${version.description.slice(0, 30)}`}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
      <div className="text-xs text-gray-500 shrink-0">
        {versions.length} version{versions.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}
