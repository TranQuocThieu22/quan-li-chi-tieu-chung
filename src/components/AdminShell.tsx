'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminShell({ isSuperAdmin, children }: { isSuperAdmin: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);

  // Trên điện thoại tab nằm trên một hàng cuộn ngang: đưa tab đang mở vào giữa tầm nhìn
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

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

  // Bố cục responsive nằm trong globals.css (.admin-*)
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>CÀI ĐẶT</h2>
        </div>

        <nav ref={navRef} className="admin-nav" aria-label="Cài đặt">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/" className="admin-nav-link muted">← Trang chủ</Link>
        </nav>

        <div className="admin-logout-wrap">
          <button onClick={handleLogout} className="admin-logout">Đăng xuất</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
