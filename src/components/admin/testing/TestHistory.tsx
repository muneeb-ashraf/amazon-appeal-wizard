'use client';

// ============================================================================
// TEST HISTORY
// List of previous test appeals with actions
// ============================================================================

import { useState, useEffect } from 'react';
import { TestAppealRecord } from '@/lib/admin-config-types';
import toast from 'react-hot-toast';

interface TestHistoryProps {
  onCompare?: (testId1: string, testId2: string) => void;
  onView?: (testId: string, appeal: string) => void;
  refreshKey?: number;
}

export default function TestHistory({ onCompare, onView, refreshKey }: TestHistoryProps) {
  const [tests, setTests] = useState<TestAppealRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  useEffect(() => {
    loadTests();
  }, [refreshKey]);

  const loadTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/test/history?limit=20');
      const data = await response.json();

      if (data.success) {
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error loading test history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const response = await fetch(`/api/admin/test/${testId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test deleted successfully');
        setTests(tests.filter((t) => t.testId !== testId));
      } else {
        toast.error(data.error || 'Failed to delete test');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    }
  };

  const handleCompareToggle = (testId: string) => {
    if (selectedForCompare.includes(testId)) {
      setSelectedForCompare(selectedForCompare.filter((id) => id !== testId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, testId]);
    }
  };

  const handleCompare = () => {
    if (selectedForCompare.length === 2 && onCompare) {
      onCompare(selectedForCompare[0], selectedForCompare[1]);
      setSelectedForCompare([]);
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">No test appeals yet</p>
        <p className="text-xs text-gray-500 mt-1">Generate your first test appeal above</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compare Button */}
      {selectedForCompare.length === 2 && onCompare && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <span className="font-medium">2 tests selected for comparison</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedForCompare([])}
              className="px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCompare}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Compare Appeals
            </button>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {tests.map((test) => (
          <div
            key={test.testId}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Test Appeal
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded shrink-0">
                    v{test.configVersion}
                  </span>
                  {test.notes && (
                    <span className="text-xs text-gray-500 italic truncate">
                      - {test.notes.slice(0, 30)}
                      {test.notes.length > 30 && '...'}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(test.createdAt)}
                </div>
                {test.formData && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-600 truncate">
                      Type: {test.formData.appealType || 'N/A'}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-600 truncate">
                      Seller: {test.formData.fullName || 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {onCompare && (
                  <button
                    onClick={() => handleCompareToggle(test.testId)}
                    className={`px-3 py-1.5 text-xs sm:text-sm rounded transition-colors whitespace-nowrap ${
                      selectedForCompare.includes(test.testId)
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                    }`}
                    disabled={
                      !selectedForCompare.includes(test.testId) &&
                      selectedForCompare.length >= 2
                    }
                  >
                    {selectedForCompare.includes(test.testId) ? '✓ Selected' : 'Compare'}
                  </button>
                )}
                {onView && (
                  <button
                    onClick={() => onView(test.testId, test.generatedAppeal)}
                    className="px-3 py-1.5 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors whitespace-nowrap"
                  >
                    View
                  </button>
                )}
                <button
                  onClick={() => handleDelete(test.testId)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                  title="Delete test"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        ))}
      </div>
    </div>
  );
}
