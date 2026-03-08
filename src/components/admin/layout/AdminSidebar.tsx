'use client';

// ============================================================================
// ADMIN SIDEBAR COMPONENT
// Left navigation sidebar for admin panel
// ============================================================================

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: JSX.Element;
  description: string;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose && window.innerWidth < 1024) {
      onClose();
    }
  };

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      description: 'Overview and stats',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      name: 'Appeals',
      href: '/admin/appeals',
      description: 'View all appeals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: 'AI Instructions',
      href: '/admin/ai-instructions',
      description: 'Edit prompts & settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      name: 'Form Fields',
      href: '/admin/form-fields',
      description: 'Manage form options',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: 'Templates',
      href: '/admin/templates',
      description: 'Manage documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      name: 'Testing',
      href: '/admin/testing',
      description: 'Test configurations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      name: 'History',
      href: '/admin/history',
      description: 'View change log',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className={`
        w-64 bg-white border-r border-gray-200
        fixed left-0 top-16 bottom-0 overflow-y-auto
        transition-transform duration-300 ease-in-out
        z-30
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleLinkClick}
            className={`
              flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors
              ${
                isActive(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <div className={`mt-0.5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${isActive(item.href) ? 'text-blue-700' : 'text-gray-900'}`}>
                {item.name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {item.description}
              </div>
            </div>
          </Link>
        ))}
      </nav>

      {/* Help Section */}
      <div className="p-4 border-t border-gray-200 mt-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Admin Panel</h3>
          <p className="text-xs text-blue-700">
            Manage appeals, view statistics, and configure AI settings.
          </p>
        </div>
      </div>
    </aside>
  );
}
