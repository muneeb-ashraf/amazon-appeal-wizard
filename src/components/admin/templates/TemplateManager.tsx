'use client';

// ============================================================================
// TEMPLATE MANAGER
// Main interface for managing template documents
// ============================================================================

import { useState, useEffect } from 'react';
import { TemplateDocumentConfig } from '@/lib/admin-config-types';
import TemplateList from './TemplateList';
import TemplateUpload from './TemplateUpload';
import TemplatePreview from './TemplatePreview';
import toast from 'react-hot-toast';

export default function TemplateManager() {
  const [documents, setDocuments] = useState<TemplateDocumentConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<TemplateDocumentConfig | null>(null);
  const [settings, setSettings] = useState({
    similarityThreshold: 0.75,
    maxRelevantDocuments: 5,
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/templates');
      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents || []);
        setSettings(data.settings || {
          similarityThreshold: 0.75,
          maxRelevantDocuments: 5,
        });
      } else {
        toast.error(data.error || 'Failed to load templates');
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = (newDocument: TemplateDocumentConfig) => {
    setDocuments([...documents, newDocument]);
    setShowUpload(false);
    toast.success('Template uploaded successfully');
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/templates/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(documents.filter((doc) => doc.id !== documentId));
        toast.success('Template deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete template');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleReprocess = async (documentIds?: string[]) => {
    try {
      const response = await fetch('/api/admin/templates/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await loadTemplates();
      } else {
        toast.error(data.error || 'Failed to reprocess templates');
      }
    } catch (error: any) {
      console.error('Error reprocessing templates:', error);
      toast.error('Failed to reprocess templates');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Documents</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage successful appeal templates used for generating new appeals
            </p>
          </div>

          <button
            onClick={() => setShowUpload(!showUpload)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{showUpload ? 'Cancel Upload' : 'Upload Template'}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium">Total Templates</div>
            <div className="text-2xl font-bold text-blue-900 mt-1">{documents.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Active Templates</div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {documents.filter((d) => d.enabled).length}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium">Pending Processing</div>
            <div className="text-2xl font-bold text-orange-900 mt-1">
              {documents.filter((d) => d.embeddingStatus === 'pending').length}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <TemplateUpload onSuccess={handleUploadSuccess} onCancel={() => setShowUpload(false)} />
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Similarity Threshold
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={settings.similarityThreshold}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum similarity score for relevant documents (0-1)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Relevant Documents
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.maxRelevantDocuments}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum number of templates to use per appeal generation
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <button
            onClick={() => handleReprocess()}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Regenerate All Embeddings</span>
          </button>
        </div>
      )}

      {/* Template List */}
      <TemplateList
        documents={documents}
        onDelete={handleDelete}
        onPreview={setPreviewDocument}
        onReprocess={(docId) => handleReprocess([docId])}
      />

      {/* Preview Modal */}
      {previewDocument && (
        <TemplatePreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </div>
  );
}
