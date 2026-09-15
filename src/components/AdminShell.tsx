'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminShell({ isSuperAdmin, children }: { isSuperAdmin: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/admin', label: 'Liên kết tài khoản' },
    { href: '/admin/logs', label: 'Nhật ký hoạt động' },
    ...(isSuperAdmin ? [{ href: '/admin/superadmin', label: 'Superadmin' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--primary-color)' }}>CÀI ĐẶT</h2>
        </div>

        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none',
                background: pathname === item.href ? 'var(--primary-color)' : 'transparent',
                color: pathname === item.href ? '#fff' : 'var(--text-primary)',
                fontWeight: pathname === item.href ? 600 : 400
              }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            style={{
              display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none',
              color: 'var(--text-secondary)'
            }}
          >
            ← Trở về Trang chủ
          </Link>
        </nav>

        <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--danger-color)', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 600 }}
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
