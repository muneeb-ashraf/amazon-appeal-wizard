'use client';

// ============================================================================
// APPEAL TYPES MANAGER
// CRUD operations for appeal types with drag-and-drop reordering
// ============================================================================

import { useState } from 'react';
import { AppealTypeConfig } from '@/lib/admin-config-types';
import DragDropList from './DragDropList';

interface AppealTypesManagerProps {
  appealTypes: AppealTypeConfig[];
  onChange: (appealTypes: AppealTypeConfig[]) => void;
}

export default function AppealTypesManager({ appealTypes, onChange }: AppealTypesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    const newType: AppealTypeConfig = {
      value: `appeal-type-${Date.now()}`,
      label: 'New Appeal Type',
      description: '',
      enabled: true,
      order: appealTypes.length + 1,
      category: 'other',
    };

    onChange([...appealTypes, newType]);
    setEditingId(newType.value);
    setShowAddForm(false);
  };

  const handleUpdate = (value: string, updates: Partial<AppealTypeConfig>) => {
    const updated = appealTypes.map((type) =>
      type.value === value ? { ...type, ...updates } : type
    );
    onChange(updated);
  };

  const handleDelete = (value: string) => {
    if (!confirm('Are you sure you want to delete this appeal type?')) return;
    onChange(appealTypes.filter((type) => type.value !== value));
  };

  const handleReorder = (reordered: AppealTypeConfig[]) => {
    // Update order property
    const withOrder = reordered.map((type, index) => ({
      ...type,
      order: index + 1,
    }));
    onChange(withOrder);
  };

  const categories = [
    { value: 'seller-suspension', label: 'Seller Suspension' },
    { value: 'listing-issue', label: 'Listing Issue' },
    { value: 'kdp-acx', label: 'KDP/ACX' },
    { value: 'fba', label: 'FBA' },
    { value: 'relay', label: 'Amazon Relay' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Appeal Types</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage the types of appeals users can submit
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Appeal Type</span>
        </button>
      </div>

      {/* List */}
      <DragDropList
        items={appealTypes}
        onReorder={handleReorder}
        renderItem={(type) => (
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
            {/* Drag Handle */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="cursor-move text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Content */}
              {editingId === type.value ? (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Value (ID)
                      </label>
                      <input
                        type="text"
                        value={type.value}
                        onChange={(e) => handleUpdate(type.value, { value: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="appeal-type-id"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={type.category}
                        onChange={(e) =>
                          handleUpdate(type.value, {
                            category: e.target.value as AppealTypeConfig['category'],
                          })
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Label (Display Name)
                    </label>
                    <input
                      type="text"
                      value={type.label}
                      onChange={(e) => handleUpdate(type.value, { label: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Seller Account Suspension: ..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      value={type.description || ''}
                      onChange={(e) => handleUpdate(type.value, { description: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description..."
                    />
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
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {type.category}
                    </span>
                    <span className="font-medium text-gray-900">{type.label}</span>
                  </div>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">ID: {type.value}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Enable/Disable Toggle */}
              <button
                onClick={() => handleUpdate(type.value, { enabled: !type.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  type.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    type.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              {/* Edit Button */}
              <button
                onClick={() => setEditingId(editingId === type.value ? null : type.value)}
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
                onClick={() => handleDelete(type.value)}
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

      {appealTypes.length === 0 && (
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
          <p className="mt-2 text-sm text-gray-600">No appeal types configured</p>
          <button
            onClick={handleAdd}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first appeal type
          </button>
        </div>
      )}
    </div>
  );
}
