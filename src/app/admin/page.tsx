'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Member = { id: number; name: string };

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const res = await fetch('/api/members');
    const data = await res.json();
    setMembers(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    setNewName('');
    await fetchMembers();
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa thành viên này sẽ xóa luôn tất cả khoản chi của họ. Bạn có chắc chắn?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    await fetchMembers();
  };

  return (
    <div>
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Cấu Hình Thành Viên</h1>
        <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Trang Chủ</Link>
      </header>

      <div className="card">
        <form onSubmit={handleAdd} className="flex-between" style={{gap: '1rem', marginBottom: '1.5rem'}}>
          <input
            type="text"
            className="input"
            placeholder="Nhập tên thành viên mới..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" style={{width: 'auto'}} disabled={loading}>
            Thêm
          </button>
        </form>

        {members.length === 0 ? (
          <p className="text-center" style={{color: 'var(--text-secondary)'}}>Chưa có thành viên nào.</p>
        ) : (
          <ul className="expense-list">
            {members.map(m => (
              <li key={m.id} className="expense-item">
                <span style={{fontWeight: 500}}>{m.name}</span>
                <button 
                  onClick={() => handleDelete(m.id)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--danger-color)', 
                    cursor: 'pointer', fontWeight: 600, padding: '0.5rem'
                  }}
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
