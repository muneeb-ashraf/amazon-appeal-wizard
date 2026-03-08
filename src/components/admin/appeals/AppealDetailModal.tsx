'use client';

import { X, User, Mail, Store, Tag, Calendar, Clock, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import type { AdminAppealRecord } from '@/types';

interface AppealDetailModalProps {
  appeal: AdminAppealRecord;
  onClose: () => void;
}

export default function AppealDetailModal({ appeal, onClose }: AppealDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(appeal.generatedAppeal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAppealType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Appeal Details</h3>
            <p className="text-sm text-gray-600 mt-1">
              ID: {appeal.appealId.substring(0, 8)}...
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Seller Information */}
            <div className="lg:col-span-1 space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Seller Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {appeal.formData?.fullName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      Email
                    </p>
                    <p className="text-sm text-gray-900">{appeal.formData?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Store className="w-3 h-3 mr-1" />
                      Store Name
                    </p>
                    <p className="text-sm text-gray-900">{appeal.formData?.storeName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Seller ID</p>
                    <p className="text-sm text-gray-900 font-mono">
                      {appeal.formData?.sellerId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Appeal Info */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Appeal Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Appeal Type</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {formatAppealType(appeal.formData?.appealType || '')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        appeal.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : appeal.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {appeal.status.charAt(0).toUpperCase() + appeal.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Created At
                    </p>
                    <p className="text-sm text-gray-900">
                      {format(new Date(appeal.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  {appeal.generationMetadata?.generationTimeMs && (
                    <div>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Generation Time
                      </p>
                      <p className="text-sm text-gray-900">
                        {(appeal.generationMetadata.generationTimeMs / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appeal Data */}
              {(appeal.formData?.rootCauses?.length > 0 ||
                appeal.formData?.correctiveActionsTaken?.length > 0 ||
                appeal.formData?.preventiveMeasures?.length > 0) && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Appeal Components</h4>
                  <div className="space-y-3 text-sm">
                    {appeal.formData?.rootCauses?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Root Causes</p>
                        <ul className="list-disc list-inside text-gray-900 space-y-1">
                          {appeal.formData.rootCauses.map((cause, i) => (
                            <li key={i} className="text-xs">
                              {cause}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {appeal.formData?.correctiveActionsTaken?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Corrective Actions</p>
                        <ul className="list-disc list-inside text-gray-900 space-y-1">
                          {appeal.formData.correctiveActionsTaken.map((action, i) => (
                            <li key={i} className="text-xs">
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {appeal.formData?.preventiveMeasures?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Preventive Measures</p>
                        <ul className="list-disc list-inside text-gray-900 space-y-1">
                          {appeal.formData.preventiveMeasures.map((measure, i) => (
                            <li key={i} className="text-xs">
                              {measure}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Generated Appeal */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700">Generated Appeal</h4>
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans leading-relaxed">
                    {appeal.generatedAppeal}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
