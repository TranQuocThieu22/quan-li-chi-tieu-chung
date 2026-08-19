'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Member = { id: number; name: string };

export default function AddExpense() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  
  // Format today as YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    payerId: '',
    beneficiaryId: '',
    notes: '',
    imageUrl: '',
    date: today
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
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        setMembers(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, payerId: data[0].id.toString() }));
        }
      });
  }, []);

  useEffect(() => {
    if (isPayOnBehalf) {
      const otherMember = members.find(m => m.id.toString() !== formData.payerId);
      if (otherMember) {
        setFormData(prev => ({ ...prev, beneficiaryId: otherMember.id.toString() }));
      }
    }
  }, [formData.payerId, isPayOnBehalf, members]);

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
    <main className="container">
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
                placeholder="VD: Tiền điện tháng 5" 
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
                placeholder="Ghi chú thêm..." 
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="label">Ảnh hóa đơn (Tùy chọn)</label>
              <input 
                type="file" 
                accept="image/*"
                className="input" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Check size < 5MB
                    if (file.size > 5 * 1024 * 1024) {
                      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
                      e.target.value = '';
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({...formData, imageUrl: reader.result as string});
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setFormData({...formData, imageUrl: ''});
                  }
                }}
              />
              {formData.imageUrl && (
                <div style={{marginTop: '0.5rem'}}>
                  <img src={formData.imageUrl} alt="Hóa đơn" style={{maxHeight: '150px', borderRadius: '8px', border: '1px solid var(--border-color)'}} />
                  <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} style={{display: 'block', marginTop: '0.5rem', color: 'var(--danger-color)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500}}>Xóa ảnh</button>
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="checkbox" 
                id="isPayOnBehalf" 
                checked={isPayOnBehalf} 
                onChange={(e) => {
                  const checked = e.target.checked;
                  setIsPayOnBehalf(checked);
                  if (checked) {
                    const otherMember = members.find(m => m.id.toString() !== formData.payerId);
                    if (otherMember) {
                      setFormData(prev => ({ ...prev, beneficiaryId: otherMember.id.toString() }));
                    }
                  } else {
                    setFormData(prev => ({ ...prev, beneficiaryId: '' }));
                  }
                }} 
                style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }}
              />
              <label htmlFor="isPayOnBehalf" style={{ cursor: 'pointer', fontWeight: 500, margin: 0 }}>Là khoản trả giùm / mua giùm</label>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu khoản chi'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
