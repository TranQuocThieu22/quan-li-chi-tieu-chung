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
    <div className="chip-actions">
      <Link href={`/personal/edit/${id}`} className="chip-btn">Sửa</Link>
      <button type="button" onClick={handleDelete} className="chip-btn danger">Xóa</button>
    </div>
  );
}
