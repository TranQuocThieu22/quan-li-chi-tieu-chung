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

  const cell = { padding: '1rem', verticalAlign: 'middle' as const };
  const head = { padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' as const };

  return (
    <div>
      <h1 className="title" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>Superadmin</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {users.length} người dùng • {partnerships.length} cặp đang liên kết • {users.filter(isSuperAdmin).length} superadmin
      </p>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-color)' }}>
            <tr>
              <th style={head}>Người dùng</th>
              <th style={head}>Liên kết với</th>
              <th style={head}>Ngày tham gia</th>
              <th style={head}>Quyền</th>
              <th style={{ ...head, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const admin = isSuperAdmin(u);
              const isRoot = u.email === ROOT_SUPERADMIN_EMAIL;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={cell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {u.image ? (
                        <img src={u.image} alt="" referrerPolicy="no-referrer" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}{u.id === me.id && ' (bạn)'}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={cell}>{partnersOf.get(u.id)?.join(', ') ?? <span style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Chưa liên kết</span>}</td>
                  <td style={{ ...cell, whiteSpace: 'nowrap' }}>{u.createdAt.toLocaleDateString('vi-VN')}</td>
                  <td style={cell}>
                    <span style={{
                      padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
                      background: admin ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                      color: admin ? 'var(--primary-color)' : 'var(--text-secondary)',
                      border: admin ? 'none' : '1px solid var(--border-color)',
                    }}>
                      {admin ? 'Superadmin' : 'Người dùng'}
                    </span>
                  </td>
                  <td style={{ ...cell, textAlign: 'right' }}>
                    {isRoot ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Mặc định</span>
                    ) : u.id === me.id ? null : (
                      <SuperAdminToggle userId={u.id} userName={u.name} isSuperAdmin={admin} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
