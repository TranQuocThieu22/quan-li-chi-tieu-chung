'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Bỏ qua một giao dịch đang chờ, hoặc đưa mục đã bỏ qua trở lại hộp chờ (trang Tự động nhập)
export default function ImportActions({ id, action }: { id: number; action: 'dismiss' | 'restore' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      try {
        const res = await fetch(`/api/import/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          alert(data.error || 'Không cập nhật được');
          return;
        }
        router.refresh();
      } catch {
        alert('Lỗi kết nối!');
      }
    });

  return (
    <button type="button" className="chip-btn" disabled={isPending} onClick={run}>
      {action === 'dismiss' ? 'Bỏ qua' : 'Đưa lại vào chờ'}
    </button>
  );
}
