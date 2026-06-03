'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--card-bg)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--primary-color)' }}>SUPER ADMIN</h2>
        </div>
        
        <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link 
            href="/admin" 
            style={{ 
              display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none', 
              background: pathname === '/admin' ? 'var(--primary-color)' : 'transparent',
              color: pathname === '/admin' ? '#fff' : 'var(--text-primary)',
              fontWeight: pathname === '/admin' ? 600 : 400
            }}
          >
            Quản lý thành viên
          </Link>
          <Link 
            href="/admin/logs" 
            style={{ 
              display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', textDecoration: 'none', 
              background: pathname === '/admin/logs' ? 'var(--primary-color)' : 'transparent',
              color: pathname === '/admin/logs' ? '#fff' : 'var(--text-primary)',
              fontWeight: pathname === '/admin/logs' ? 600 : 400
            }}
          >
            Nhật ký hoạt động
          </Link>
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
