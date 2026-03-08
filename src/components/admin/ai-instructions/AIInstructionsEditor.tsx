'use client';

// ============================================================================
// AI INSTRUCTIONS EDITOR - Main Component
// Edit all 5 sections of AI prompts, token limits, and settings
// ============================================================================

import { useState, useEffect } from 'react';
import { AIInstructionsConfig, AISection } from '@/lib/admin-config-types';
import SectionEditor from './SectionEditor';
import toast, { Toaster } from 'react-hot-toast';

interface AIInstructionsEditorProps {
  onSaved?: () => void;
}

export default function AIInstructionsEditor({ onSaved }: AIInstructionsEditorProps) {
  const [config, setConfig] = useState<AIInstructionsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);

  // Load config once on mount
  useEffect(() => {
    loadActiveConfig();
  }, []); // Empty dependency array - only run once

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
  }, [config, hasChanges]); // Re-register when config/hasChanges change

  const loadActiveConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/config/ai-instructions');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config.configData);
        setActiveVersion(data.config.version);
        setIsDraft(data.config.status === 'draft');
      } else {
        // No active config, use defaults
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

  const getDefaultConfig = (): AIInstructionsConfig => {
    return {
      sections: [],
      appealTypeGuidance: [],
      globalSettings: {
        defaultModel: 'gpt-4o-mini',
        defaultTemperature: 0.7,
        maxRetries: 3,
        timeoutMs: 60000,
      },
    };
  };

  const handleSectionChange = (sectionId: string, updatedSection: AISection) => {
    if (!config) return;

    const updatedSections = config.sections.map((section) =>
      section.id === sectionId ? updatedSection : section
    );

    setConfig({
      ...config,
      sections: updatedSections,
    });
    setHasChanges(true);
  };

  const handleAddSection = () => {
    if (!config) return;

    const newSection: AISection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      description: 'Description of this section',
      systemPrompt: 'System instructions...',
      userPromptTemplate: 'User prompt with {variables}...',
      maxTokens: 500,
      temperature: 0.7,
      order: config.sections.length + 1,
    };

    setConfig({
      ...config,
      sections: [...config.sections, newSection],
    });
    setHasChanges(true);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!config) return;

    if (!confirm('Are you sure you want to delete this section?')) return;

    const updatedSections = config.sections.filter((s) => s.id !== sectionId);

    setConfig({
      ...config,
      sections: updatedSections,
    });
    setHasChanges(true);
    toast.success('Section deleted');
  };

  const handleReorderSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!config) return;

    const index = config.sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= config.sections.length) return;

    const updatedSections = [...config.sections];
    [updatedSections[index], updatedSections[newIndex]] = [
      updatedSections[newIndex],
      updatedSections[index],
    ];

    // Update order property
    updatedSections.forEach((section, idx) => {
      section.order = idx + 1;
    });

    setConfig({
      ...config,
      sections: updatedSections,
    });
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configType: 'ai-instructions',
          configData: config,
          description: 'Updated AI instructions configuration',
          status: 'draft',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Draft saved successfully!');
        setHasChanges(false);
        setIsDraft(true);
        setActiveVersion(data.config.version);
        onSaved?.();
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

      const response = await fetch('/api/admin/config/ai-instructions/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: activeVersion }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Configuration activated successfully!');
        setIsDraft(false);
        setHasChanges(false);
        onSaved?.();
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

  const handleResetToDefaults = () => {
    if (!confirm('Are you sure you want to reset to default configuration? This will discard all changes.')) {
      return;
    }

    setConfig(getDefaultConfig());
    setHasChanges(true);
    toast.success('Reset to defaults');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-sm text-gray-600">Loading AI instructions...</p>
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

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Instructions Editor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Customize the 5 sections of appeal generation
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
            onClick={handleResetToDefaults}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset to Defaults
          </button>

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
            {isDraft ? 'Activate' : 'Activated'}
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
              How AI Instructions Work
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Each section has a <strong>system prompt</strong> (instructions for AI) and a{' '}
              <strong>user prompt template</strong> (what data to include). Use variables like{' '}
              <code className="bg-blue-100 px-1 rounded">{'{ appealType }'}</code> to insert dynamic data.
              Adjust token limits to control output length.
            </p>
            <p className="mt-2 text-xs text-blue-600">
              💡 Tip: Press <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Ctrl+S</kbd> to save
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {config.sections.map((section, index) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={index}
            totalSections={config.sections.length}
            onChange={(updated) => handleSectionChange(section.id, updated)}
            onDelete={() => handleDeleteSection(section.id)}
            onMoveUp={() => handleReorderSection(section.id, 'up')}
            onMoveDown={() => handleReorderSection(section.id, 'down')}
          />
        ))}
      </div>

      {/* Add Section Button */}
      <button
        onClick={handleAddSection}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        + Add New Section
      </button>

      {/* Global Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Global Settings</h3>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Model
            </label>
            <select
              value={config.globalSettings.defaultModel}
              onChange={(e) =>
                setConfig({
                  ...config,
                  globalSettings: {
                    ...config.globalSettings,
                    defaultModel: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Temperature: {config.globalSettings.defaultTemperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.globalSettings.defaultTemperature}
              onChange={(e) =>
                setConfig({
                  ...config,
                  globalSettings: {
                    ...config.globalSettings,
                    defaultTemperature: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>More Focused</span>
              <span>More Creative</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Retries
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={config.globalSettings.maxRetries}
              onChange={(e) =>
                setConfig({
                  ...config,
                  globalSettings: {
                    ...config.globalSettings,
                    maxRetries: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeout (ms)
            </label>
            <input
              type="number"
              min="10000"
              max="300000"
              step="10000"
              value={config.globalSettings.timeoutMs}
              onChange={(e) =>
                setConfig({
                  ...config,
                  globalSettings: {
                    ...config.globalSettings,
                    timeoutMs: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
