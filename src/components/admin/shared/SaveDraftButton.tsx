'use client';

// ============================================================================
// SAVE DRAFT BUTTON COMPONENT
// Reusable button for saving draft configurations
// ============================================================================

import { useState } from 'react';

interface SaveDraftButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export default function SaveDraftButton({
  onSave,
  disabled = false,
  label = 'Save Draft'
}: SaveDraftButtonProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={disabled || saving}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${disabled || saving
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
      `}
    >
      {saving ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Saving...</span>
        </span>
      ) : (
        label
      )}
    </button>
  );
}
