import Link from 'next/link';
import { cookies } from 'next/headers';
import { findOldUncategorized, recategorizedCookie } from '@/lib/recategorize';

// Nhắc ở trang chủ khi còn khoản chi cũ đang là "Khác" mà đoán được danh mục
export default async function RecategorizeBanner({ partnershipId }: { partnershipId: number }) {
  if ((await cookies()).has(recategorizedCookie(partnershipId))) return null;
  const count = (await findOldUncategorized(partnershipId)).filter(e => e.proposed).length;
  if (count === 0) return null;

  return (
    <Link href="/recategorize" className="notice notice-info import-banner">
      <span>
        <strong>{count}</strong> khoản cũ đang ở 📦 Khác có thể tự xếp danh mục
      </span>
      <span className="import-banner-cta">Xem →</span>
    </Link>
  );
}
