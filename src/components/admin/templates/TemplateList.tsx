'use client';

// ============================================================================
// TEMPLATE LIST
// Display list of template documents with actions
// ============================================================================

import { TemplateDocumentConfig } from '@/lib/admin-config-types';

interface TemplateListProps {
  documents: TemplateDocumentConfig[];
  onDelete: (documentId: string) => void;
  onPreview: (document: TemplateDocumentConfig) => void;
  onReprocess: (documentId: string) => void;
}

export default function TemplateList({
  documents,
  onDelete,
  onPreview,
  onReprocess,
}: TemplateListProps) {
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Yet</h3>
        <p className="text-sm text-gray-600">
          Upload your first successful appeal template to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Appeal Types
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className={doc.enabled ? '' : 'opacity-50 bg-gray-50'}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-10 h-10 text-blue-500"
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
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{doc.documentName}</div>
                      {doc.description && (
                        <div className="text-sm text-gray-500">{doc.description}</div>
                      )}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {doc.appealTypes.length === 0 ? (
                      <span className="text-xs text-gray-500 italic">All types</span>
                    ) : (
                      doc.appealTypes.slice(0, 2).map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                        >
                          {type}
                        </span>
                      ))
                    )}
                    {doc.appealTypes.length > 2 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        +{doc.appealTypes.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(
                      doc.embeddingStatus
                    )}`}
                  >
                    {doc.embeddingStatus}
                  </span>
                  {!doc.enabled && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(doc.uploadedAt)}
                  {doc.processedAt && (
                    <div className="text-xs text-gray-400">
                      Processed: {formatDate(doc.processedAt)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium space-x-2">
                  <button
                    onClick={() => onPreview(doc)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => onReprocess(doc.id)}
                    className="text-green-600 hover:text-green-800"
                    title="Regenerate embeddings"
                  >
                    Reprocess
                  </button>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
