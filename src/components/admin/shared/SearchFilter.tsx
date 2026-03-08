'use client';

// ============================================================================
// SEARCH & FILTER COMPONENT
// Provides search and filtering capabilities for lists
// ============================================================================

import { useState, useCallback } from 'react';
import { debounce } from 'lodash';

interface SearchFilterProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  filters?: Array<{
    label: string;
    value: string;
    count?: number;
  }>;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  showClearButton?: boolean;
}

export default function SearchFilter({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  filters = [],
  activeFilter,
  onFilterChange,
  showClearButton = true,
}: SearchFilterProps) {
  const [searchValue, setSearchValue] = useState('');

  // Debounced search to avoid excessive API calls
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        {showClearButton && searchValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {filters.length > 0 && onFilterChange && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onFilterChange('')}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              !activeFilter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{filter.label}</span>
              {filter.count !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeFilter === filter.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
