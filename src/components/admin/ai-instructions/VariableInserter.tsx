'use client';

// ============================================================================
// VARIABLE INSERTER COMPONENT
// Dropdown to insert available variables into prompts
// ============================================================================

import { useState, useRef, useEffect } from 'react';

interface Variable {
  name: string;
  description: string;
  example: string;
}

interface VariableInserterProps {
  onInsert: (variable: string) => void;
}

export default function VariableInserter({ onInsert }: VariableInserterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const variables: Variable[] = [
    {
      name: 'appealType',
      description: 'Type of appeal being submitted',
      example: 'inauthenticity-supply-chain',
    },
    {
      name: 'fullName',
      description: 'Seller\'s full name',
      example: 'John Smith',
    },
    {
      name: 'storeName',
      description: 'Amazon store name',
      example: 'Smith\'s Store',
    },
    {
      name: 'email',
      description: 'Seller\'s email address',
      example: 'seller@example.com',
    },
    {
      name: 'sellerId',
      description: 'Amazon Seller ID / Merchant Token',
      example: 'A1B2C3D4E5F6G',
    },
    {
      name: 'asins',
      description: 'List of affected ASINs',
      example: 'B001ABC123, B002DEF456',
    },
    {
      name: 'rootCauses',
      description: 'Selected root causes',
      example: 'I was operating retail arbitrage...',
    },
    {
      name: 'rootCauseDetails',
      description: 'Additional root cause details',
      example: 'I sourced from TJ Maxx without realizing...',
    },
    {
      name: 'correctiveActionsTaken',
      description: 'Selected corrective actions',
      example: 'Removed all listings, obtained authorization...',
    },
    {
      name: 'correctiveActionsDetails',
      description: 'Additional corrective actions details',
      example: 'I have implemented a new verification system...',
    },
    {
      name: 'preventiveMeasures',
      description: 'Selected preventive measures',
      example: 'Will only source from authorized distributors...',
    },
    {
      name: 'preventiveMeasuresDetails',
      description: 'Additional preventive measures details',
      example: 'I have created a checklist for all suppliers...',
    },
    {
      name: 'unauthorizedSupplier',
      description: 'Name of unauthorized supplier (if applicable)',
      example: 'ABC Distributors',
    },
    {
      name: 'relatedAccountReason',
      description: 'Reason for related account (if applicable)',
      example: 'Family member also sells on Amazon...',
    },
    {
      name: 'categoryRejectionReason',
      description: 'Category rejection reason (if applicable)',
      example: 'Missing required certifications...',
    },
    {
      name: 'detailPageAbuseArea',
      description: 'Detail page abuse areas (if applicable)',
      example: 'Title, Bullet Points',
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInsert = (variable: Variable) => {
    onInsert(variable.name);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span>Insert Variable</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Available Variables</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click a variable to insert it at the cursor position
            </p>
          </div>

          <div className="p-2">
            {variables.map((variable) => (
              <button
                key={variable.name}
                onClick={() => handleInsert(variable)}
                className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <code className="text-sm font-mono text-blue-600 group-hover:text-blue-700">
                    {'{'}{variable.name}{'}'}
                  </code>
                  <svg
                    className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-xs text-gray-600 mt-1">{variable.description}</p>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  Example: {variable.example}
                </p>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 Tip: Variables are replaced with actual user data when generating appeals
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
