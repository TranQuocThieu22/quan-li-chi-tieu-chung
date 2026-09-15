'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PersonalExpenseActions({ id }: { id: number }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) return;

    const res = await fetch(`/api/personal-expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) alert('Không xóa được khoản chi');
    router.refresh();
  };

  return (
    <div style={{display: 'flex', gap: '0.75rem', marginTop: '0.5rem'}}>
      <Link href={`/personal/edit/${id}`} style={{fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none'}}>Sửa</Link>
      <button onClick={handleDelete} style={{fontSize: '0.875rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0}}>Xóa</button>
    </div>
  );
}
