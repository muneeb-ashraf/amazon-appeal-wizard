'use client';

// ============================================================================
// FORM FIELDS EDITOR - Main Component
// Manage appeal types, root causes, actions, and measures
// ============================================================================

import { useState, useEffect } from 'react';
import { FormFieldsConfig } from '@/lib/admin-config-types';
import toast, { Toaster } from 'react-hot-toast';
import AppealTypesManager from './AppealTypesManager';
import RootCausesManager from './RootCausesManager';
import ActionsManager from './ActionsManager';
import DocumentTypesManager from './DocumentTypesManager';

type TabType = 'appeal-types' | 'root-causes' | 'actions' | 'measures' | 'documents';

export default function FormFieldsEditor() {
  const [config, setConfig] = useState<FormFieldsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('appeal-types');
  const [activeVersion, setActiveVersion] = useState<number | null>(null);

  // Load config once on mount
  useEffect(() => {
    loadActiveConfig();
  }, []);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, hasChanges]);

  const loadActiveConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/config/form-fields');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config.configData);
        setActiveVersion(data.config.version);
      } else {
        setConfig(getDefaultConfig());
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (): FormFieldsConfig => {
    return {
      appealTypes: [],
      rootCauses: [],
      correctiveActions: [],
      preventiveMeasures: [],
      supportingDocuments: [],
    };
  };

  const handleSaveDraft = async () => {
    if (!config || !hasChanges) return;

    try {
      setSaving(true);

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configType: 'form-fields',
          configData: config,
          description: 'Updated form fields configuration',
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Draft saved successfully!');
        setHasChanges(false);
        setActiveVersion(data.config.version);
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!activeVersion) {
      toast.error('Please save a draft first');
      return;
    }

    if (!confirm('Are you sure you want to activate this configuration? This will make it live.')) {
      return;
    }

    try {
      setSaving(true);

      const response = await fetch('/api/admin/config/form-fields/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: activeVersion }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuration activated successfully!');
        setHasChanges(false);
      } else {
        throw new Error(data.error || 'Failed to activate');
      }
    } catch (error: any) {
      console.error('Error activating config:', error);
      toast.error(error.message || 'Failed to activate configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-sm text-gray-600">Loading form fields...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load configuration</p>
      </div>
    );
  }

  const tabs = [
    { id: 'appeal-types' as TabType, label: 'Appeal Types', count: config.appealTypes.length },
    { id: 'root-causes' as TabType, label: 'Root Causes', count: config.rootCauses.length },
    { id: 'actions' as TabType, label: 'Corrective Actions', count: config.correctiveActions.length },
    { id: 'measures' as TabType, label: 'Preventive Measures', count: config.preventiveMeasures.length },
    { id: 'documents' as TabType, label: 'Document Types', count: config.supportingDocuments.length },
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Fields Editor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize appeal types, root causes, and form options
            {activeVersion && (
              <span className="ml-2 text-gray-500">
                (Version: {activeVersion})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <span className="text-sm text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}

          <button
            onClick={handleSaveDraft}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleActivate}
            disabled={saving || hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activate
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Managing Form Fields
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Add, edit, or remove form options. Use drag-and-drop to reorder items.
              Enable/disable options with toggles. Assign options to specific appeal types.
            </p>
            <p className="mt-2 text-xs text-blue-600">
              💡 Tip: Press <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Ctrl+S</kbd> to save
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'appeal-types' && (
          <AppealTypesManager
            appealTypes={config.appealTypes}
            onChange={(updated) => {
              setConfig({ ...config, appealTypes: updated });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'root-causes' && (
          <RootCausesManager
            rootCauses={config.rootCauses}
            appealTypes={config.appealTypes}
            onChange={(updated) => {
              setConfig({ ...config, rootCauses: updated });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'actions' && (
          <ActionsManager
            title="Corrective Actions"
            description="Actions the seller has already taken to fix the issue"
            actions={config.correctiveActions}
            appealTypes={config.appealTypes}
            onChange={(updated) => {
              setConfig({ ...config, correctiveActions: updated });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'measures' && (
          <ActionsManager
            title="Preventive Measures"
            description="Steps being implemented to prevent future violations"
            actions={config.preventiveMeasures}
            appealTypes={config.appealTypes}
            onChange={(updated) => {
              setConfig({ ...config, preventiveMeasures: updated });
              setHasChanges(true);
            }}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentTypesManager
            documents={config.supportingDocuments}
            onChange={(updated) => {
              setConfig({ ...config, supportingDocuments: updated });
              setHasChanges(true);
            }}
          />
        )}
      </div>
    </div>
  );
}
