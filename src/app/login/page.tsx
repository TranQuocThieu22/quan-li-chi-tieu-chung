'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        router.refresh();
        router.push('/admin');
      } else {
        const data = await res.json();
        setError(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container" style={{maxWidth: '400px', margin: '4rem auto'}}>
      <header className="text-center">
        <h1 className="title">Đăng Nhập</h1>
        <p className="subtitle mb-6">Trang này dành cho quản trị viên</p>
      </header>
      
      <div className="card">
        {error && <div className="debt-negative mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Tài khoản</label>
            <input 
              type="text" 
              className="input" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="label">Mật khẩu</label>
            <input 
              type="password" 
              className="input" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link href="/" style={{color: 'var(--text-secondary)'}}>Trở về Trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
