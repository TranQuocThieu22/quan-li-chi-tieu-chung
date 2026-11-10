'use client';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExpenseActions({
  id,
  hasHistory,
  isSettled,
  needsAmount = false,
}: {
  id: number;
  hasHistory: boolean;
  isSettled: boolean;
  // Chưa biết số tiền thì chưa có gì để trả: tắt ô "Đã trả" cho tới khi điền
  needsAmount?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticSettled, setOptimisticSettled] = useOptimistic(isSettled);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này? (Lịch sử vẫn được lưu lại)')) return;

    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const handleToggleSettled = (checked: boolean) => {
    startTransition(async () => {
      setOptimisticSettled(checked);
      try {
        const res = await fetch(`/api/expenses/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isSettled: checked }),
        });
        if (!res.ok) alert('Không cập nhật được trạng thái đã trả');
      } catch {
        alert('Lỗi kết nối!');
      }
      router.refresh();
    });
  };

  return (
    <div className="chip-actions">
      <label
        className={`chip-btn${optimisticSettled ? ' on' : ''}${needsAmount ? ' off' : ''}`}
        title={needsAmount ? 'Điền số tiền trước khi đánh dấu đã trả' : undefined}
      >
        <input
          type="checkbox"
          checked={optimisticSettled}
          disabled={isPending || needsAmount}
          onChange={(e) => handleToggleSettled(e.target.checked)}
        />
        Đã trả
      </label>
      <Link href={`/edit/${id}`} className="chip-btn">Sửa</Link>
      {hasHistory && <Link href={`/history/${id}`} className="chip-btn">Lịch sử</Link>}
      <button type="button" onClick={handleDelete} className="chip-btn danger">Xóa</button>
    </div>
  );
}
