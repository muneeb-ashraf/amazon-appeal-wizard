'use client';

// ============================================================================
// ROOT CAUSES MANAGER
// Manage root causes with appeal type assignment
// ============================================================================

import { useState } from 'react';
import { RootCauseConfig, AppealTypeConfig } from '@/lib/admin-config-types';
import DragDropList from './DragDropList';

interface RootCausesManagerProps {
  rootCauses: RootCauseConfig[];
  appealTypes: AppealTypeConfig[];
  onChange: (rootCauses: RootCauseConfig[]) => void;
}

export default function RootCausesManager({
  rootCauses,
  appealTypes,
  onChange,
}: RootCausesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = () => {
    const newCause: RootCauseConfig = {
      id: `rc-${Date.now()}`,
      text: 'New root cause',
      appealTypes: [],
      enabled: true,
      order: rootCauses.length + 1,
    };

    onChange([...rootCauses, newCause]);
    setEditingId(newCause.id);
  };

  const handleUpdate = (id: string, updates: Partial<RootCauseConfig>) => {
    const updated = rootCauses.map((cause) =>
      cause.id === id ? { ...cause, ...updates } : cause
    );
    onChange(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this root cause?')) return;
    onChange(rootCauses.filter((cause) => cause.id !== id));
  };

  const handleReorder = (reordered: RootCauseConfig[]) => {
    const withOrder = reordered.map((cause, index) => ({
      ...cause,
      order: index + 1,
    }));
    onChange(withOrder);
  };

  const toggleAppealType = (causeId: string, appealTypeValue: string) => {
    const cause = rootCauses.find((c) => c.id === causeId);
    if (!cause) return;

    const appealTypes = cause.appealTypes.includes(appealTypeValue)
      ? cause.appealTypes.filter((v) => v !== appealTypeValue)
      : [...cause.appealTypes, appealTypeValue];

    handleUpdate(causeId, { appealTypes });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Root Causes</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage root causes and assign them to appeal types
          </p>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Root Cause</span>
        </button>
      </div>

      {/* List */}
      <DragDropList
        items={rootCauses}
        onReorder={handleReorder}
        keyExtractor={(item) => item.id}
        renderItem={(cause) => (
          <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg">
            {/* Drag Handle */}
            <div className="flex items-start space-x-4 flex-1">
              <div className="cursor-move text-gray-400 mt-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Content */}
              {editingId === cause.id ? (
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Root Cause Text
                    </label>
                    <textarea
                      value={cause.text}
                      onChange={(e) => handleUpdate(cause.id, { text: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="I was operating a retail arbitrage model..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Applicable to Appeal Types
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {appealTypes.map((type) => (
                        <label
                          key={type.value}
                          className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={cause.appealTypes.includes(type.value)}
                            onChange={() => toggleAppealType(cause.id, type.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{type.label}</span>
                        </label>
                      ))}
                    </div>
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
                  <p className="text-gray-900">{cause.text}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cause.appealTypes.length > 0 ? (
                      cause.appealTypes.slice(0, 3).map((typeValue) => {
                        const type = appealTypes.find((t) => t.value === typeValue);
                        return (
                          <span
                            key={typeValue}
                            className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                          >
                            {type?.label.slice(0, 30) || typeValue}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-500 italic">No appeal types assigned</span>
                    )}
                    {cause.appealTypes.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{cause.appealTypes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleUpdate(cause.id, { enabled: !cause.enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  cause.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    cause.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>

              <button
                onClick={() => setEditingId(editingId === cause.id ? null : cause.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
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

              <button
                onClick={() => handleDelete(cause.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {rootCauses.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-600">No root causes configured</p>
          <button
            onClick={handleAdd}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first root cause
          </button>
        </div>
      )}
    </div>
  );
}
