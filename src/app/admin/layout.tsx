import { redirect } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { getCurrentUser, isSuperAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return <AdminShell isSuperAdmin={isSuperAdmin(user)}>{children}</AdminShell>;
}
