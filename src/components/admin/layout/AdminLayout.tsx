'use client';

// ============================================================================
// ADMIN LAYOUT COMPONENT
// Main layout wrapper for admin panel
// ============================================================================

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import ToastProvider from '@/components/admin/shared/ToastProvider';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Sidebar state - start open on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Set initial sidebar state based on screen size
    if (typeof window !== 'undefined') {
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Hide header and sidebar on login page
  if (isLoginPage) {
    return (
      <>
        <ToastProvider />
        {children}
      </>
    );
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar */}
          <AdminSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Overlay for mobile when sidebar is open */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main
            className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}
          >
            <div className="container mx-auto px-4 pt-20 pb-8 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
