'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Member = { id: number; name: string };

export default function EditExpense({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [id, setId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    payerId: '',
    beneficiaryId: '',
    notes: '',
    date: ''
  });

  const [displayAmount, setDisplayAmount] = useState('');
  const [isPayOnBehalf, setIsPayOnBehalf] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setDisplayAmount('');
      setFormData({ ...formData, amount: '' });
      return;
    }
    const formatted = new Intl.NumberFormat('vi-VN').format(parseInt(rawValue, 10));
    setDisplayAmount(formatted);
    setFormData({ ...formData, amount: rawValue });
  };

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => setMembers(data));
      
    if (id) {
      fetch(`/api/expenses/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          setFormData({
            item: data.item,
            amount: data.amount.toString(),
            payerId: data.payerId.toString(),
            beneficiaryId: data.beneficiaryId ? data.beneficiaryId.toString() : '',
            notes: data.notes || '',
            date: new Date(data.date).toISOString().split('T')[0]
          });
          setDisplayAmount(new Intl.NumberFormat('vi-VN').format(data.amount));
          if (data.beneficiaryId) {
            setIsPayOnBehalf(true);
          }
        })
        .catch(() => {
          alert('Không tìm thấy khoản chi này!');
          router.push('/');
        });
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
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

  if (!formData.item) return <div className="container text-center">Đang tải...</div>;

  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Sửa Khoản Chi</h1>
        <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Hủy</Link>
      </header>

      <div className="card">
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
            <label className="label">Ngày mua</label>
            <input 
              type="date" 
              className="input" 
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="label">Tên món đồ / Dịch vụ</label>
            <input 
              type="text" 
              className="input" 
              required
              value={formData.item}
              onChange={(e) => setFormData({...formData, item: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="label">Số tiền (VNĐ)</label>
            <input 
              type="text"
              inputMode="numeric"
              className="input" 
              placeholder="VD: 150.000"
              required
              value={displayAmount}
              onChange={handleAmountChange}
            />
          </div>

          <div className="form-group">
            <label className="label">Ghi chú (Tùy chọn)</label>
            <textarea 
              className="textarea" 
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <input 
              type="checkbox" 
              id="isPayOnBehalf" 
              checked={isPayOnBehalf} 
              onChange={(e) => {
                setIsPayOnBehalf(e.target.checked);
                if (!e.target.checked) {
                  setFormData({ ...formData, beneficiaryId: '' });
                }
              }} 
              style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
            />
            <label htmlFor="isPayOnBehalf" style={{ cursor: 'pointer', fontWeight: 500, margin: 0 }}>Là khoản trả giùm / mua giùm</label>
          </div>

          {isPayOnBehalf && (
            <div className="form-group" style={{ marginTop: '1rem', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
              <label className="label">Mua cho ai?</label>
              <select 
                className="select" 
                value={formData.beneficiaryId}
                onChange={(e) => setFormData({...formData, beneficiaryId: e.target.value})}
                required={isPayOnBehalf}
              >
                <option value="">-- Chọn người được mua giùm --</option>
                {members.filter(m => m.id.toString() !== formData.payerId).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
          </button>
        </form>
      </div>
    </main>
  )
}
