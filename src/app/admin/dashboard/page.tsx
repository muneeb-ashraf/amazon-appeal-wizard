'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import DashboardStats from '@/components/admin/dashboard/DashboardStats';
import RecentAppeals from '@/components/admin/dashboard/RecentAppeals';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentAppeals, setRecentAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch stats
      const statsResponse = await fetch('/api/admin/appeals/stats');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);
      } else {
        throw new Error(statsData.error || 'Failed to load statistics');
      }

      // Fetch recent appeals (last 10)
      const appealsResponse = await fetch('/api/admin/appeals?limit=10&sortBy=createdAt&sortOrder=desc');
      const appealsData = await appealsResponse.json();

      if (appealsData.success) {
        setRecentAppeals(appealsData.appeals);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-red-900 font-semibold mb-1">Error Loading Dashboard</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of appeal submissions and system performance</p>
        </div>
        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && <DashboardStats stats={stats} />}

      {/* Recent Appeals */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Appeals</h2>
        <RecentAppeals appeals={recentAppeals} onRefresh={loadDashboardData} />
      </div>
    </div>
  );
}
