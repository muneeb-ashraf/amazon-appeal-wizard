'use client';

// ============================================================================
// APPEAL COMPARISON
// Side-by-side comparison of two appeals
// ============================================================================

import DiffViewer from './DiffViewer';

interface AppealComparisonProps {
  appeal1: {
    title: string;
    text: string;
    version?: number;
    date?: string;
  };
  appeal2: {
    title: string;
    text: string;
    version?: number;
    date?: string;
  };
  onClose: () => void;
}

export default function AppealComparison({
  appeal1,
  appeal2,
  onClose,
}: AppealComparisonProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appeal Comparison</h2>
            <p className="text-sm text-gray-600 mt-1">
              Side-by-side comparison with differences highlighted
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <DiffViewer
            text1={appeal1.text}
            text2={appeal2.text}
            title1={appeal1.title}
            title2={appeal2.title}
            subtitle1={appeal1.version ? `v${appeal1.version}` : appeal1.date}
            subtitle2={appeal2.version ? `v${appeal2.version}` : appeal2.date}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Added</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Removed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Changed</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
