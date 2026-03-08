'use client';

// ============================================================================
// TESTING PAGE
// Test configurations before activation
// ============================================================================

import { useState } from 'react';
import TestAppealGenerator from '@/components/admin/testing/TestAppealGenerator';
import TestHistory from '@/components/admin/testing/TestHistory';
import AppealComparison from '@/components/admin/testing/AppealComparison';
import AppealViewer from '@/components/admin/testing/AppealViewer';

export default function TestingPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentTestAppeal, setCurrentTestAppeal] = useState<string | null>(null);
  const [compareTests, setCompareTests] = useState<{
    test1: { id: string; appeal: string };
    test2: { id: string; appeal: string };
  } | null>(null);
  const [viewAppeal, setViewAppeal] = useState<{
    title: string;
    text: string;
    subtitle?: string;
  } | null>(null);

  const handleTestGenerated = (testId: string, appeal: string) => {
    setCurrentTestAppeal(appeal);
    setRefreshKey((prev) => prev + 1);
  };

  const handleCompare = async (testId1: string, testId2: string) => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/test/${testId1}`),
        fetch(`/api/admin/test/${testId2}`),
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      if (data1.success && data2.success) {
        setCompareTests({
          test1: { id: testId1, appeal: data1.test.generatedAppeal },
          test2: { id: testId2, appeal: data2.test.generatedAppeal },
        });
      }
    } catch (error) {
      console.error('Error loading tests for comparison:', error);
    }
  };

  const handleView = (testId: string, appeal: string) => {
    setViewAppeal({
      title: 'Test Appeal',
      text: appeal,
      subtitle: `Test ID: ${testId}`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Testing & Preview</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate test appeals with specific configuration versions and compare results
        </p>
      </div>

      {/* Generator */}
      <TestAppealGenerator onTestGenerated={handleTestGenerated} />

      {/* Current Test Result */}
      {currentTestAppeal && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated Test Appeal</h2>
            <button
              onClick={() => setCurrentTestAppeal(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            {currentTestAppeal}
          </pre>
        </div>
      )}

      {/* Test History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test History</h2>
        <TestHistory
          refreshKey={refreshKey}
          onCompare={handleCompare}
          onView={handleView}
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">🧪 Test Safely</h3>
          <p className="text-xs text-blue-700">
            Generate appeals with draft configurations before activating them. No impact on live
            app.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">📊 Compare Results</h3>
          <p className="text-xs text-green-700">
            Select two tests to see side-by-side comparison with differences highlighted.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-orange-900 mb-2">📝 Save Tests</h3>
          <p className="text-xs text-orange-700">
            All test appeals are automatically saved with notes and configuration snapshots.
          </p>
        </div>
      </div>

      {/* Modals */}
      {compareTests && (
        <AppealComparison
          appeal1={{
            title: 'Test Appeal 1',
            text: compareTests.test1.appeal,
            subtitle: compareTests.test1.id,
          }}
          appeal2={{
            title: 'Test Appeal 2',
            text: compareTests.test2.appeal,
            subtitle: compareTests.test2.id,
          }}
          onClose={() => setCompareTests(null)}
        />
      )}

      {viewAppeal && (
        <AppealViewer
          appeal={viewAppeal.text}
          title={viewAppeal.title}
          subtitle={viewAppeal.subtitle}
          onClose={() => setViewAppeal(null)}
        />
      )}
    </div>
  );
}
