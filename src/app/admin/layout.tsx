import { redirect } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { getActivePartnerships, getCurrentUser, isSuperAdmin } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const partnerships = await getActivePartnerships(user.id);

  return (
    <AdminShell isSuperAdmin={isSuperAdmin(user)} hasPartnership={partnerships.length > 0}>
      {children}
    </AdminShell>
  );
}
