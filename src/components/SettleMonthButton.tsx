'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

const formatMoney = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// Sau khi chuyển khoản xong: đánh dấu đã trả mọi khoản chưa trả của tháng đang xem, để "Cần thanh toán" về 0.
// Dùng API hàng loạt nên ghi lịch sử như khi đánh dấu tay.
export default function SettleMonthButton({ ids, total, monthLabel }: { ids: number[]; total: number; monthLabel: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const settle = () => {
    if (!confirm(`Đánh dấu đã trả ${ids.length} khoản chưa trả của ${monthLabel} (${formatMoney(total)})?`)) return;
    startTransition(async () => {
      try {
        const res = await fetch('/api/expenses/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids, action: 'settle' }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || 'Không đánh dấu được, vui lòng thử lại.');
          return;
        }
        router.refresh();
      } catch {
        alert('Lỗi kết nối!');
      }
    });
  };

  return (
    <button type="button" className="btn btn-success btn-block mt-4" disabled={isPending} onClick={settle}>
      {isPending ? 'Đang đánh dấu...' : `Đã thanh toán xong ${monthLabel}`}
    </button>
  );
}
