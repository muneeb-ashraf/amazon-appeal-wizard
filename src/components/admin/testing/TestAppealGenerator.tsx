'use client';

// ============================================================================
// TEST APPEAL GENERATOR
// Form to generate test appeals with specific configuration versions
// ============================================================================

import { useState } from 'react';
import VersionSelector from '../versioning/VersionSelector';
import toast from 'react-hot-toast';

interface TestAppealGeneratorProps {
  onTestGenerated: (testId: string, appeal: string) => void;
}

export default function TestAppealGenerator({ onTestGenerated }: TestAppealGeneratorProps) {
  const [aiVersion, setAiVersion] = useState<number | null>(null);
  const [formFieldsVersion, setFormFieldsVersion] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simplified form data
  const [formData, setFormData] = useState({
    appealType: 'inauthenticity-supply-chain',
    fullName: 'Test Seller',
    storeName: 'Test Store',
    rootCauses: ['I was operating a Retail Arbitrage model without authorization'],
    correctiveActionsTaken: ['Removed all flagged listings'],
    preventiveMeasures: ['Will only source from authorized distributors'],
  });

  const [notes, setNotes] = useState('');

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/admin/test/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiInstructionsVersion: aiVersion,
          formFieldsVersion,
          formData,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Test appeal generated successfully');
        onTestGenerated(data.testId, data.generatedAppeal);
      } else {
        toast.error(data.error || 'Failed to generate test appeal');
      }
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast.error('Failed to generate test appeal');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Generate Test Appeal</h2>
        <p className="text-sm text-gray-600 mt-1">
          Test appeal generation with specific configuration versions
        </p>
      </div>

      {/* Version Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Instructions Version
          </label>
          <VersionSelector
            configType="ai-instructions"
            currentVersion={aiVersion || undefined}
            onVersionChange={setAiVersion}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave as "Active Version" to use current active configuration
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form Fields Version (Optional)
          </label>
          <VersionSelector
            configType="form-fields"
            currentVersion={formFieldsVersion || undefined}
            onVersionChange={setFormFieldsVersion}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional: Test with specific form fields configuration
          </p>
        </div>
      </div>

      {/* Simplified Form Data */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900">Test Data</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appeal Type
            </label>
            <select
              value={formData.appealType}
              onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="inauthenticity-supply-chain">Inauthenticity / Supply Chain</option>
              <option value="intellectual-property">Intellectual Property</option>
              <option value="seller-code-conduct">Seller Code of Conduct</option>
              <option value="related-account">Related Account</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Name
          </label>
          <input
            type="text"
            value={formData.storeName}
            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Root Causes (one per line)
          </label>
          <textarea
            value={formData.rootCauses.join('\n')}
            onChange={(e) => setFormData({ ...formData, rootCauses: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corrective Actions (one per line)
          </label>
          <textarea
            value={formData.correctiveActionsTaken.join('\n')}
            onChange={(e) => setFormData({ ...formData, correctiveActionsTaken: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preventive Measures (one per line)
          </label>
          <textarea
            value={formData.preventiveMeasures.join('\n')}
            onChange={(e) => setFormData({ ...formData, preventiveMeasures: e.target.value.split('\n').filter(Boolean) })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="Add notes about this test..."
        />
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          <span>{isGenerating ? 'Generating...' : 'Generate Test Appeal'}</span>
        </button>
      </div>
    </div>
  );
}
