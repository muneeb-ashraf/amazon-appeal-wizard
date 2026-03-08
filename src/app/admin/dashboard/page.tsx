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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of appeal submissions and system performance</p>
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
