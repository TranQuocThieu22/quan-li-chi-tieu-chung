import Link from 'next/link';
import { ChevronLeftIcon } from './icons';

// Tiêu đề trang: nút quay lại (tùy chọn) — tiêu đề + phụ đề — nút hành động bên phải
export default function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      {backHref && (
        <Link href={backHref} className="icon-btn" aria-label="Quay lại">
          <ChevronLeftIcon />
        </Link>
      )}
      <div className="page-header-main">
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      {action}
    </header>
  );
}
