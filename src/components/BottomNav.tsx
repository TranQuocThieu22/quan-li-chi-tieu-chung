'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon, LinkIcon, UsersIcon, WalletIcon } from './icons';

// shared = false khi chưa liên kết với ai: ẩn sổ chung và thống kê vì các trang đó sẽ chuyển hướng đi
export default function BottomNav({ shared = true }: { shared?: boolean }) {
  const pathname = usePathname();

  const items = [
    ...(shared ? [{ href: '/', label: 'Sổ chung', Icon: UsersIcon }] : []),
    { href: '/personal', label: 'Cá nhân', Icon: WalletIcon },
    ...(shared ? [{ href: '/stats', label: 'Thống kê', Icon: ChartIcon }] : []),
    { href: '/admin', label: 'Liên kết', Icon: LinkIcon },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      <div className="bottom-nav-inner">
        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`bottom-nav-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
