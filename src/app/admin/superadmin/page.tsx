import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser, isSuperAdmin, ROOT_SUPERADMIN_EMAIL } from '@/lib/auth';
import SuperAdminToggle from '@/components/SuperAdminToggle';
import PageHeader from '@/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect('/login');
  if (!isSuperAdmin(me)) redirect('/admin');

  const [users, partnerships] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.partnership.findMany({ where: { endedAt: null }, include: { userA: true, userB: true } }),
  ]);

  // Một người có thể liên kết với nhiều người
  const partnersOf = new Map<number, string[]>();
  partnerships.forEach(p => {
    partnersOf.set(p.userAId, [...(partnersOf.get(p.userAId) ?? []), p.userB.name]);
    partnersOf.set(p.userBId, [...(partnersOf.get(p.userBId) ?? []), p.userA.name]);
  });

  return (
    <div>
      <PageHeader
        title="Superadmin"
        subtitle={`${users.length} người dùng • ${partnerships.length} cặp đang liên kết • ${users.filter(isSuperAdmin).length} superadmin`}
      />

      {/* Danh sách dạng thẻ thay cho bảng để dùng tốt trên điện thoại */}
      <ul className="card flush list">
        {users.map(u => {
          const admin = isSuperAdmin(u);
          const isRoot = u.email === ROOT_SUPERADMIN_EMAIL;
          const partners = partnersOf.get(u.id);
          return (
            <li key={u.id} className="list-item">
              <div className="expense-row">
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.image} alt="" referrerPolicy="no-referrer" className="avatar" />
                ) : (
                  <div className="avatar primary">{u.name.charAt(0).toUpperCase()}</div>
                )}

                <div className="expense-body">
                  <div className="expense-top">
                    <div className="expense-title">
                      {u.name}{u.id === me.id && ' (bạn)'}
                      <span className={`badge${admin ? ' badge-primary' : ''}`}>{admin ? 'Superadmin' : 'Người dùng'}</span>
                    </div>
                    {isRoot ? (
                      <span className="text-muted text-sm" style={{ whiteSpace: 'nowrap' }}>Mặc định</span>
                    ) : u.id === me.id ? null : (
                      <SuperAdminToggle userId={u.id} userName={u.name} isSuperAdmin={admin} />
                    )}
                  </div>
                  <div className="user-email">{u.email}</div>
                  <div className="expense-meta" style={{ fontSize: '0.75rem' }}>
                    Liên kết: {partners ? partners.join(', ') : 'Chưa liên kết'} • Tham gia {u.createdAt.toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
