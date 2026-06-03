'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Member = {
  id: number;
  name: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => setMembers(data));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (res.ok) {
        const newMember = await res.json();
        setMembers([...members, newMember]);
        setNewName('');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người này? Các khoản chi của họ cũng sẽ bị xóa!')) return;
    
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMembers(members.filter(m => m.id !== id));
      router.refresh();
    }
  };

  return (
    <div>
      <h1 className="title" style={{ textAlign: 'left', marginBottom: '2rem' }}>Quản lý thành viên</h1>
      
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 className="subtitle mb-4">Thêm người tham gia</h2>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Tên thành viên (VD: Quốc Thiệu)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto', margin: 0, padding: '0 2rem' }}>
            {loading ? 'Đang thêm...' : 'Thêm'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <h2 className="subtitle mb-4">Danh sách thành viên hiện tại</h2>
        {members.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Chưa có thành viên nào.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Tên thành viên</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', width: '100px', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>#{m.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{m.name}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDelete(m.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
