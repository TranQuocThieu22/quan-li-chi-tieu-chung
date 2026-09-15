'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminToggle({ userId, userName, isSuperAdmin }: { userId: number; userName: string; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const question = isSuperAdmin
      ? `Gỡ quyền superadmin của ${userName}?`
      : `Cấp quyền superadmin cho ${userName}? Người này sẽ quản lý được quyền của mọi người dùng.`;
    if (!confirm(question)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuperAdmin: !isSuperAdmin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Có lỗi xảy ra');
        return;
      }
      router.refresh();
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, whiteSpace: 'nowrap', color: isSuperAdmin ? 'var(--danger-color)' : 'var(--primary-color)' }}
    >
      {loading ? 'Đang lưu...' : isSuperAdmin ? 'Gỡ quyền' : 'Cấp quyền'}
    </button>
  );
}
