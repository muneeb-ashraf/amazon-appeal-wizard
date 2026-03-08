'use client';

// ============================================================================
// ADMIN HEADER COMPONENT
// Top navigation bar for admin panel
// ============================================================================

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function AdminHeader({ onToggleSidebar, sidebarOpen }: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left: Logo and Menu Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AA</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-gray-900">
                Amazon Appeal Wizard
              </h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Cache Status Indicator */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-700 font-medium">Live</span>
          </div>

          {/* View Live Site */}
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View Live Site
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <span className="hidden md:block text-sm font-medium text-gray-700">
              Admin
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
