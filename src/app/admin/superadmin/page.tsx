import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCurrentUser, isSuperAdmin, ROOT_SUPERADMIN_EMAIL } from '@/lib/auth';
import SuperAdminToggle from '@/components/SuperAdminToggle';

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
      <h1 className="title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Superadmin</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        {users.length} người dùng • {partnerships.length} cặp đang liên kết • {users.filter(isSuperAdmin).length} superadmin
      </p>

      {/* Danh sách dạng thẻ thay cho bảng để dùng tốt trên điện thoại */}
      <ul className="card" style={{ padding: 0, overflow: 'hidden', listStyle: 'none' }}>
        {users.map(u => {
          const admin = isSuperAdmin(u);
          const isRoot = u.email === ROOT_SUPERADMIN_EMAIL;
          const partners = partnersOf.get(u.id);
          return (
            <li key={u.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                {u.image ? (
                  <img src={u.image} alt="" referrerPolicy="no-referrer" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>{u.name}{u.id === me.id && ' (bạn)'}</span>
                    <span style={{
                      padding: '0.1rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
                      background: admin ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: admin ? 'var(--primary-color)' : 'var(--text-secondary)',
                      border: admin ? '1px solid transparent' : '1px solid var(--border-color)',
                    }}>
                      {admin ? 'Superadmin' : 'Người dùng'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', overflowWrap: 'anywhere' }}>{u.email}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Liên kết: {partners ? partners.join(', ') : 'Chưa liên kết'} • Tham gia {u.createdAt.toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div style={{ flexShrink: 0, paddingTop: '0.1rem' }}>
                  {isRoot ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Mặc định</span>
                  ) : u.id === me.id ? null : (
                    <SuperAdminToggle userId={u.id} userName={u.name} isSuperAdmin={admin} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
