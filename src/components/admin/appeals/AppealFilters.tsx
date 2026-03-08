'use client';

import { Search, Download, FileDown } from 'lucide-react';

interface AppealFiltersProps {
  filters: {
    status: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: Partial<AppealFiltersProps['filters']>) => void;
  onExport: (format: 'csv' | 'json') => void;
  totalAppeals: number;
}

export default function AppealFilters({
  filters,
  onFilterChange,
  onExport,
  totalAppeals,
}: AppealFiltersProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search by name, email, or store..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full lg:w-48">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="w-full lg:w-48">
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt">Date Created</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="w-full lg:w-40">
          <select
            value={filters.sortOrder}
            onChange={(e) => onFilterChange({ sortOrder: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onExport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            title="Export as CSV"
          >
            <FileDown className="w-4 h-4" />
            <span className="hidden lg:inline">CSV</span>
          </button>
          <button
            onClick={() => onExport('json')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            title="Export as JSON"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">JSON</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {totalAppeals} {totalAppeals === 1 ? 'appeal' : 'appeals'}
      </div>
    </div>
  );
}
