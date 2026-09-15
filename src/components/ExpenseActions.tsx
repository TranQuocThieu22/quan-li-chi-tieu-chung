'use client';
import { useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExpenseActions({ id, hasHistory, isSettled }: { id: number, hasHistory: boolean, isSettled: boolean }) {
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
    <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.5rem', alignItems: 'center', flexWrap: 'wrap'}}>
      <label style={{display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 500, color: optimisticSettled ? 'var(--success-color)' : 'var(--text-secondary)'}}>
        <input
          type="checkbox"
          checked={optimisticSettled}
          disabled={isPending}
          onChange={(e) => handleToggleSettled(e.target.checked)}
          style={{width: '1rem', height: '1rem', cursor: 'pointer'}}
        />
        Đã trả
      </label>
      <Link href={`/edit/${id}`} style={{fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none'}}>Sửa</Link>
      <button onClick={handleDelete} style={{fontSize: '0.875rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Xóa</button>
      {hasHistory && (
        <Link href={`/history/${id}`} style={{fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none'}}>Xem lịch sử</Link>
      )}
    </div>
  );
}
