import { redirect } from 'next/navigation';

export default function DashboardPage() {
  // Redirect to the new admin dashboard
  redirect('/admin/dashboard');
}