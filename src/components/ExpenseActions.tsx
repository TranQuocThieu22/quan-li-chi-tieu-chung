'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ExpenseActions({ id, hasHistory, isAuth }: { id: number, hasHistory: boolean, isAuth?: boolean }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này? (Lịch sử vẫn được lưu lại)')) return;
    
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.5rem'}}>
      <Link href={`/edit/${id}`} style={{fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none'}}>Sửa</Link>
      <button onClick={handleDelete} style={{fontSize: '0.875rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Xóa</button>
      {hasHistory && isAuth && (
        <Link href={`/history/${id}`} style={{fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none'}}>Xem lịch sử</Link>
      )}
    </div>
  );
}
