"use client";
import React, { useState, useEffect } from 'react';
import { AdminStats, AdminAppealListItem } from '@/types';
import { APPEAL_TYPES } from '@/lib/constants';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [appeals, setAppeals] = useState<AdminAppealListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);

  const handleLogin = () => {
    // Simple password check (in production, use proper authentication)
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true);
      loadData();
    } else {
      alert('Invalid password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // In production, these would be real API calls
      const mockStats: AdminStats = {
        totalAppeals: 42,
        completedAppeals: 38,
        failedAppeals: 2,
        totalDocuments: 38,
        processedDocuments: 38,
      };

      const mockAppeals: AdminAppealListItem[] = [
        {
          id: '1',
          fullName: 'John Smith',
          email: 'john@example.com',
          appealType: 'inauthenticity-supply-chain',
          createdAt: new Date().toISOString(),
          status: 'completed',
        },
        // Add more mock data as needed
      ];

      setStats(mockStats);
      setAppeals(mockAppeals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewAppeal = async (appealId: string) => {
    // In production, fetch appeal details from API
    setSelectedAppeal({
      id: appealId,
      fullName: 'John Smith',
      email: 'john@example.com',
      appealText: 'Sample appeal text...',
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">🔐 Admin Access</h1>
            <p className="text-slate-600">Enter password to access the dashboard</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter admin password"
              className="w-full p-4 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
            />
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800">📊 Admin Dashboard</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="Total Appeals"
              value={stats.totalAppeals}
              icon="📝"
              color="blue"
            />
            <StatCard
              title="Completed"
              value={stats.completedAppeals}
              icon="✅"
              color="green"
            />
            <StatCard
              title="Failed"
              value={stats.failedAppeals}
              icon="❌"
              color="red"
            />
            <StatCard
              title="Total Documents"
              value={stats.totalDocuments}
              icon="📄"
              color="purple"
            />
            <StatCard
              title="Processed Docs"
              value={stats.processedDocuments}
              icon="✔️"
              color="indigo"
            />
          </div>
        )}

        {/* Appeals Table */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Recent Appeals</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Appeal Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appeals.map((appeal) => (
                    <tr key={appeal.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                        {appeal.fullName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {appeal.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {APPEAL_TYPES.find(t => t.value === appeal.appealType)?.label.substring(0, 50) || appeal.appealType}...
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(appeal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            appeal.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appeal.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {appeal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewAppeal(appeal.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Document Management Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">📚 Document Management</h2>
          <p className="text-slate-600 mb-4">
            Upload and manage the 38 reference documents for AI appeal generation
          </p>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <p className="text-slate-500">
              Document upload functionality would be implemented here
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Upload DOCX files → Convert to TXT → Create embeddings
            </p>
          </div>
        </div>
      </div>

      {/* Appeal Detail Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Appeal Details</h2>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">Name:</p>
                <p className="text-slate-800">{selectedAppeal.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Email:</p>
                <p className="text-slate-800">{selectedAppeal.email}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Generated Appeal:</p>
                <div className="bg-slate-50 p-4 rounded-lg mt-2">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700">
                    {selectedAppeal.appealText}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
  }[color] || 'from-slate-500 to-slate-600';

  return (
    <div className={`bg-gradient-to-br ${colorClasses} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-4xl font-bold">{value}</span>
      </div>
      <p className="text-sm font-medium opacity-90">{title}</p>
    </div>
  );
}
