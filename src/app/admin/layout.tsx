// ============================================================================
// ADMIN LAYOUT WRAPPER
// Wraps all admin pages with the admin layout
// ============================================================================

import AdminLayout from '@/components/admin/layout/AdminLayout';

export const metadata = {
  title: 'Admin Panel - Amazon Appeal Wizard',
  description: 'Admin control panel for Amazon Appeal Wizard',
};

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
