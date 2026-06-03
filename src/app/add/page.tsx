'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Member = { id: number; name: string };

export default function AddExpense() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    payerId: '',
    notes: ''
  });

  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, payerId: data[0].id.toString() }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.payerId) {
      alert("Vui lòng tạo thành viên trước khi thêm khoản chi!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        alert('Có lỗi xảy ra khi lưu dữ liệu!');
      }
    } catch (error) {
      alert('Lỗi kết nối!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Thêm Khoản Chi</h1>
        <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Hủy</Link>
      </header>

      <div className="card">
        {members.length === 0 ? (
          <div className="text-center">
            <p className="mb-4">Bạn cần phải thêm thành viên trước khi tạo khoản chi.</p>
            <Link href="/admin" className="btn btn-primary">Đi tới trang cấu hình</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Bạn là ai? (Người trả tiền)</label>
              <select 
                className="select" 
                value={formData.payerId}
                onChange={(e) => setFormData({...formData, payerId: e.target.value})}
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Tên món đồ / Dịch vụ</label>
              <input 
                type="text" 
                className="input" 
                placeholder="VD: Tiền điện tháng 5" 
                required
                value={formData.item}
                onChange={(e) => setFormData({...formData, item: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="label">Số tiền (VNĐ)</label>
              <input 
                type="number" 
                className="input" 
                placeholder="VD: 150000" 
                required
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="label">Ghi chú (Tùy chọn)</label>
              <textarea 
                className="textarea" 
                placeholder="Ghi chú thêm..." 
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu khoản chi'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
