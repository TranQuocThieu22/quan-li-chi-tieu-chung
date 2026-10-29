import Link from 'next/link';
import { countPendingImports } from '@/lib/import';

// Nhắc ở đầu trang chủ / cá nhân khi có giao dịch từ ngân hàng, MoMo đang chờ xác nhận
export default async function ImportBanner({ userId }: { userId: number }) {
  const count = await countPendingImports(userId);
  if (count === 0) return null;

  return (
    <Link href="/inbox" className="notice notice-info import-banner">
      <span>
        <strong>{count}</strong> giao dịch từ ngân hàng, MoMo chờ xác nhận
      </span>
      <span className="import-banner-cta">Xem →</span>
    </Link>
  );
}
