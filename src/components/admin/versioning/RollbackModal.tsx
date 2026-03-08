'use client';

// ============================================================================
// ROLLBACK MODAL
// Confirmation dialog for rolling back to a previous version
// ============================================================================

import { useState } from 'react';
import { ConfigType } from '@/lib/admin-config-types';
import toast from 'react-hot-toast';

interface RollbackModalProps {
  configType: ConfigType;
  targetVersion: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RollbackModal({
  configType,
  targetVersion,
  onSuccess,
  onCancel,
}: RollbackModalProps) {
  const [isRollingBack, setIsRollingBack] = useState(false);

  const handleRollback = async () => {
    try {
      setIsRollingBack(true);

      const response = await fetch(`/api/admin/config/${configType}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Rolled back successfully');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to rollback');
      }
    } catch (error: any) {
      console.error('Error rolling back:', error);
      toast.error('Failed to rollback configuration');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Icon */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Rollback</h3>

          {/* Message */}
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to rollback to <strong>version {targetVersion}</strong>?
          </p>

          {/* Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="text-sm font-semibold text-orange-900 mb-2">
              ⚠️ What will happen:
            </h4>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Current active version will be archived</li>
              <li>• A new version will be created with the target configuration</li>
              <li>• The new version will become active immediately</li>
              <li>• This action cannot be undone (but you can rollback again)</li>
              <li>• Live app will use the rolled-back configuration</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onCancel}
            disabled={isRollingBack}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRollback}
            disabled={isRollingBack}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isRollingBack && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{isRollingBack ? 'Rolling Back...' : 'Rollback to v' + targetVersion}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
