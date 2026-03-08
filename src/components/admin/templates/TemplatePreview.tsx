'use client';

// ============================================================================
// TEMPLATE PREVIEW
// Modal for previewing template document content
// ============================================================================

import { useState, useEffect } from 'react';
import { TemplateDocumentConfig } from '@/lib/admin-config-types';
import toast from 'react-hot-toast';

interface TemplatePreviewProps {
  document: TemplateDocumentConfig;
  onClose: () => void;
}

export default function TemplatePreview({ document, onClose }: TemplatePreviewProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [contentType, setContentType] = useState<'text' | 'docx'>('text');

  useEffect(() => {
    loadContent();
  }, [document.id]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/templates/${document.id}`);
      const data = await response.json();

      if (data.success) {
        setContent(data.content);
        setContentType(data.contentType);
      } else {
        toast.error(data.error || 'Failed to load document');
      }
    } catch (error: any) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (contentType === 'docx') {
      // Convert base64 to blob and download
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.documentName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Download text file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.documentName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{document.documentName}</h2>
            {document.description && (
              <p className="text-sm text-gray-600 mt-1">{document.description}</p>
            )}
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

        {/* Metadata */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">File Type:</span>
              <span className="ml-2 font-medium text-gray-900">{document.fileType.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-medium text-gray-900">{document.embeddingStatus}</span>
            </div>
            <div>
              <span className="text-gray-500">Uploaded:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(document.uploadedAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Enabled:</span>
              <span className="ml-2 font-medium text-gray-900">
                {document.enabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          {document.appealTypes.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-gray-500">Appeal Types:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {document.appealTypes.map((type) => (
                  <span
                    key={type}
                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
          {document.tags && document.tags.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : contentType === 'text' ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 p-4 rounded-lg">
              {content}
            </pre>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-blue-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">DOCX Document</h3>
              <p className="text-sm text-gray-600 mb-4">
                Preview not available for DOCX files. Download to view.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Download Document
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download</span>
          </button>
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
