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

  // Simplified form data with all required fields
  const [formData, setFormData] = useState({
    appealType: 'inauthenticity-supply-chain',
    fullName: 'Test Seller',
    storeName: 'Test Store',
    email: 'test@example.com',
    sellerId: 'A1234567890TEST',
    asins: [],
    rootCauses: ['I was operating a Retail Arbitrage model without authorization'],
    rootCauseDetails: '',
    unauthorizedSupplier: '',
    relatedAccountReason: '',
    categoryRejectionReason: '',
    detailPageAbuseArea: [],
    correctiveActionsTaken: ['Removed all flagged listings'],
    correctiveActionsDetails: '',
    preventiveMeasures: ['Will only source from authorized distributors'],
    preventiveMeasuresDetails: '',
    uploadedDocuments: [],
  });

  const [notes, setNotes] = useState('');

  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState('');

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);
      setCurrentSection('Initializing...');

      const sections: string[] = [];
      const totalSections = 5;
      const sectionNames = [
        'Opening & Introduction',
        'Root Cause Analysis',
        'Corrective Actions',
        'Preventive Measures',
        'Closing & Signature'
      ];

      // Generate each section sequentially
      for (let sectionId = 1; sectionId <= totalSections; sectionId++) {
        const sectionName = sectionNames[sectionId - 1];
        setCurrentSection(`Generating ${sectionName}... (${sectionId}/${totalSections})`);
        setProgress(Math.floor(((sectionId - 1) / totalSections) * 100));

        console.log(`🔄 Requesting section ${sectionId}: ${sectionName}`);

        const response = await fetch('/api/generate-appeal-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: sectionId,
            formData: formData,
            previousSections: sections,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to generate section ${sectionId}`);
        }

        const data = await response.json();

        if (!data.success || !data.sectionText) {
          throw new Error(`Invalid response for section ${sectionId}`);
        }

        console.log(`✅ Received section ${sectionId}: ${data.characterCount} characters`);
        sections.push(data.sectionText);

        // Update progress
        const newProgress = Math.floor((sectionId / totalSections) * 95);
        setProgress(newProgress);
      }

      // All sections generated, combine them
      const fullAppealText = sections.join('\n\n');

      setCurrentSection('Saving test appeal...');
      setProgress(98);

      // Save to test database
      const saveResponse = await fetch('/api/admin/test/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiInstructionsVersion: aiVersion,
          formFieldsVersion,
          formData,
          generatedAppeal: fullAppealText,
          notes,
        }),
      });

      const saveData = await saveResponse.json();

      if (saveData.success) {
        setProgress(100);
        setCurrentSection('Complete!');
        toast.success('Test appeal generated successfully');
        onTestGenerated(saveData.testId, fullAppealText);
      } else {
        throw new Error(saveData.error || 'Failed to save test appeal');
      }
    } catch (error: any) {
      console.error('Error generating test:', error);
      toast.error(error.message || 'Failed to generate test appeal');
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setCurrentSection('');
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

      {/* AI Progress Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
            {/* Animated Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full p-4">
                  <svg className="w-12 h-12 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Dynamic Message */}
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Crafting Your Appeal</h3>
              <p className="text-lg text-gray-600 leading-relaxed min-h-[60px]">
                {currentSection}
              </p>

              {/* Animated Progress Indicator */}
              <div className="flex justify-center space-x-2 py-4">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Percentage indicator */}
              <p className="text-sm text-gray-400 font-medium">{progress}% Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
