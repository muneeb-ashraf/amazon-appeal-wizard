'use client';

// ============================================================================
// ACTIVATE BUTTON COMPONENT
// Button for activating draft configurations
// ============================================================================

import { useState } from 'react';

interface ActivateButtonProps {
  onActivate: () => Promise<void>;
  disabled?: boolean;
  confirmMessage?: string;
}

export default function ActivateButton({
  onActivate,
  disabled = false,
  confirmMessage = 'Are you sure you want to activate this configuration? The current active version will be archived.'
}: ActivateButtonProps) {
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!confirm(confirmMessage)) {
      return;
    }

    setActivating(true);
    try {
      await onActivate();
    } finally {
      setActivating(false);
    }
  };

  return (
    <button
      onClick={handleActivate}
      disabled={disabled || activating}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${disabled || activating
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
        }
      `}
    >
      {activating ? (
        <span className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Activating...</span>
        </span>
      ) : (
        <span className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Activate</span>
        </span>
      )}
    </button>
  );
}
