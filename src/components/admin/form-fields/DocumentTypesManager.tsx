'use client';

// ============================================================================
// DOCUMENT TYPES MANAGER
// CRUD operations for supporting document types with drag-and-drop reordering
// ============================================================================

import { useState } from 'react';
import { SupportingDocumentConfig } from '@/lib/admin-config-types';
import DragDropList from './DragDropList';

interface DocumentTypesManagerProps {
  documents: SupportingDocumentConfig[];
  onChange: (documents: SupportingDocumentConfig[]) => void;
}

export default function DocumentTypesManager({ documents, onChange }: DocumentTypesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    const newDoc: SupportingDocumentConfig = {
      value: `document-type-${Date.now()}`,
      label: 'New Document Type',
      appealTypes: ['*'],
      enabled: true,
      order: documents.length + 1,
    };

    onChange([...documents, newDoc]);
    setEditingId(newDoc.value);
    setShowAddForm(false);
  };

  const handleUpdate = (value: string, updates: Partial<SupportingDocumentConfig>) => {
    const updated = documents.map((doc) =>
      doc.value === value ? { ...doc, ...updates } : doc
    );
    onChange(updated);
  };

  const handleDelete = (value: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;
    onChange(documents.filter((doc) => doc.value !== value));
  };

  const handleReorder = (reordered: SupportingDocumentConfig[]) => {
    // Update order property
    const withOrder = reordered.map((doc, index) => ({
      ...doc,
      order: index + 1,
    }));
    onChange(withOrder);
  };

  // Common document categories from constants.ts
  const commonCategories = [
    'Identity & Address',
    'Business',
    'Supply Chain',
    'Supply Chain (Retail Arbitrage)',
    'Intellectual Property',
    'Restricted Products / Safety',
    'Review Manipulation',
    'Amazon Relay',
    'General',
  ];

  const getAppealTypeDisplay = (appealTypes: string[]) => {
    if (appealTypes.includes('*')) {
      return 'All Appeal Types';
    }
    return appealTypes.join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Supporting Document Types</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage the types of supporting documents users can upload with appeals
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Document Type</span>
        </button>
      </div>

      {/* List */}
      <DragDropList
        items={documents}
        onReorder={handleReorder}
        renderItem={(doc) => (
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            {/* Drag Handle */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="cursor-move text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Content */}
              {editingId === doc.value ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value (ID)
                      </label>
                      <input
                        type="text"
                        value={doc.value}
                        onChange={(e) => handleUpdate(doc.value, { value: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="document-type-id"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Label (Display Name)
                      </label>
                      <input
                        type="text"
                        value={doc.label}
                        onChange={(e) => handleUpdate(doc.value, { label: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Document Type Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Appeal Types
                    </label>
                    <input
                      type="text"
                      value={doc.appealTypes.join(', ')}
                      onChange={(e) => {
                        const types = e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t.length > 0);
                        handleUpdate(doc.value, { appealTypes: types.length > 0 ? types : ['*'] });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Use '*' for all, or comma-separated appeal type IDs"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter '*' for all appeal types, or specific appeal type IDs separated by commas
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{doc.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Appeal Types: {getAppealTypeDisplay(doc.appealTypes)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ID: {doc.value}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Enable/Disable Toggle */}
              <button
                onClick={() => handleUpdate(doc.value, { enabled: !doc.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  doc.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    doc.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Edit Button */}
              <button
                onClick={() => setEditingId(editingId === doc.value ? null : doc.value)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(doc.value)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
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
        )}
      />

      {documents.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No document types configured</p>
          <button
            onClick={handleAdd}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first document type
          </button>
        </div>
      )}
    </div>
  );
}
