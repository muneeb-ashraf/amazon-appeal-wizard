'use client';

// ============================================================================
// SECTION EDITOR COMPONENT
// Edit individual AI instruction sections with collapse/expand
// ============================================================================

import { useState } from 'react';
import { AISection } from '@/lib/admin-config-types';
import PromptEditor from './PromptEditor';
import TokenLimitSlider from './TokenLimitSlider';
import VariableInserter from './VariableInserter';

interface SectionEditorProps {
  section: AISection;
  index: number;
  totalSections: number;
  onChange: (section: AISection) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export default function SectionEditor({
  section,
  index,
  totalSections,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First section expanded by default
  const [activeTab, setActiveTab] = useState<'system' | 'user'>('system');

  const handleChange = (field: keyof AISection, value: any) => {
    onChange({
      ...section,
      [field]: value,
    });
  };

  const handleInsertVariable = (variable: string, field: 'system' | 'user') => {
    if (field === 'system') {
      handleChange('systemPrompt', section.systemPrompt + ` {${variable}}`);
    } else {
      handleChange('userPromptTemplate', section.userPromptTemplate + ` {${variable}}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4 flex-1">
          {/* Collapse/Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Section Number */}
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
            {index + 1}
          </div>

          {/* Section Name (Editable) */}
          <input
            type="text"
            value={section.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="flex-1 text-lg font-semibold text-gray-900 bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            placeholder="Section Name"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Move Up */}
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move up"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Move Down */}
          <button
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move down"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Delete section"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Description
            </label>
            <input
              type="text"
              value={section.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of what this section does"
            />
          </div>

          {/* Tabs for System vs User Prompt */}
          <div>
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('system')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'system'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  System Prompt
                </button>
                <button
                  onClick={() => setActiveTab('user')}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'user'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  User Prompt Template
                </button>
              </nav>
            </div>

            <div className="mt-4">
              {activeTab === 'system' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      System Instructions
                    </label>
                    <VariableInserter
                      onInsert={(variable) => handleInsertVariable(variable, 'system')}
                    />
                  </div>
                  <PromptEditor
                    value={section.systemPrompt}
                    onChange={(value) => handleChange('systemPrompt', value)}
                    placeholder="Instructions for the AI on how to write this section..."
                    height="200px"
                  />
                  <p className="text-xs text-gray-500">
                    Tells the AI how to write this section (tone, style, focus)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      User Prompt Template
                    </label>
                    <VariableInserter
                      onInsert={(variable) => handleInsertVariable(variable, 'user')}
                    />
                  </div>
                  <PromptEditor
                    value={section.userPromptTemplate}
                    onChange={(value) => handleChange('userPromptTemplate', value)}
                    placeholder="Write prompt with {variables} like {appealType}, {fullName}, {rootCauses}..."
                    height="200px"
                  />
                  <p className="text-xs text-gray-500">
                    Template with variables like <code className="bg-gray-100 px-1 rounded">{'{ appealType }'}</code>{' '}
                    that get replaced with actual data
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Token Limit & Temperature */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <TokenLimitSlider
                value={section.maxTokens}
                onChange={(value) => handleChange('maxTokens', value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {section.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={section.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused</span>
                <span>Creative</span>
              </div>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <svg
                className="w-4 h-4 text-gray-500 mt-0.5"
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
              <div>
                <p className="font-medium text-gray-700">How this works:</p>
                <p className="mt-1">
                  The <strong>system prompt</strong> sets the AI's behavior. The{' '}
                  <strong>user prompt template</strong> contains the actual data with variables.
                  Max tokens controls output length (~750 characters per 1000 tokens).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
