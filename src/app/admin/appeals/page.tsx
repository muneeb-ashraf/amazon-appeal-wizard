'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import AppealsTable from '@/components/admin/appeals/AppealsTable';
import AppealFilters from '@/components/admin/appeals/AppealFilters';
import type { AdminAppealRecord } from '@/types';

export default function AdminAppealsPage() {
  const [appeals, setAppeals] = useState<AdminAppealRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  useEffect(() => {
    loadAppeals();
  }, [filters, pagination.offset]);

  const loadAppeals = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      const response = await fetch(`/api/admin/appeals?${params}`);
      const data = await response.json();

      if (data.success) {
        setAppeals(data.appeals);
        setPagination(data.pagination);
      } else {
        throw new Error(data.error || 'Failed to load appeals');
      }
    } catch (err: any) {
      console.error('Error loading appeals:', err);
      setError(err.message || 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters });
    setPagination({ ...pagination, offset: 0 }); // Reset to first page
  };

  const handlePageChange = (newOffset: number) => {
    setPagination({ ...pagination, offset: newOffset });
  };

  const handleDelete = async (appealId: string) => {
    if (!confirm('Are you sure you want to delete this appeal?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/appeals/${appealId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Reload appeals
        loadAppeals();
      } else {
        throw new Error(data.error || 'Failed to delete appeal');
      }
    } catch (err: any) {
      console.error('Error deleting appeal:', err);
      alert(err.message || 'Failed to delete appeal');
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/admin/appeals/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          status: filters.status,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appeals-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error('Error exporting appeals:', err);
      alert(err.message || 'Failed to export appeals');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appeals Management</h1>
        <p className="text-gray-600 mt-1">View, search, and manage all generated appeals</p>
      </div>

      {/* Filters */}
      <AppealFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        totalAppeals={pagination.total}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="text-red-900 font-semibold mb-1">Error Loading Appeals</h3>
              <p className="text-red-700 text-sm">{error}</p>
              <button
                onClick={loadAppeals}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeals Table */}
      <AppealsTable
        appeals={appeals}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onDelete={handleDelete}
        onRefresh={loadAppeals}
      />
    </div>
  );
}
