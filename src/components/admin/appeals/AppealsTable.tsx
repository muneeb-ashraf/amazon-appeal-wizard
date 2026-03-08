'use client';

import { useState } from 'react';
import { Eye, Trash2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import AppealDetailModal from './AppealDetailModal';
import type { AdminAppealRecord } from '@/types';

interface AppealsTableProps {
  appeals: AdminAppealRecord[];
  loading: boolean;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  onPageChange: (offset: number) => void;
  onDelete: (appealId: string) => void;
  onRefresh: () => void;
}

export default function AppealsTable({
  appeals,
  loading,
  pagination,
  onPageChange,
  onDelete,
  onRefresh,
}: AppealsTableProps) {
  const [selectedAppeal, setSelectedAppeal] = useState<AdminAppealRecord | null>(null);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
        <p className="text-center text-gray-500 mt-4">Loading appeals...</p>
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appeals Found</h3>
        <p className="text-gray-600">
          {pagination.total === 0
            ? 'No appeals have been generated yet.'
            : 'No appeals match your current filters.'}
        </p>
      </div>
    );
  }

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Store
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appeal Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appeals.map((appeal) => (
                <tr key={appeal.appealId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {appeal.formData?.fullName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {appeal.formData?.email || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {appeal.formData?.storeName || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {appeal.formData?.appealType || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(appeal.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(appeal.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(appeal.appealId)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(pagination.offset - pagination.limit)}
                disabled={pagination.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => onPageChange(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <AppealDetailModal
          appeal={selectedAppeal}
          onClose={() => setSelectedAppeal(null)}
        />
      )}
    </>
  );
}
