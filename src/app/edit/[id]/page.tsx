'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Member = { id: number; name: string; isMe: boolean };

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
    imageUrl: '',
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
      
    if (id) {
      fetch(`/api/expenses/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(data => {
          // Thành viên lấy theo sổ của chính khoản chi này
          fetch(`/api/members?partnershipId=${data.partnershipId}`)
            .then(res => res.ok ? res.json() : { members: [] })
            .then(m => setMembers(m.members));
          setFormData({
            item: data.item,
            amount: data.amount.toString(),
            payerId: data.payerId.toString(),
            beneficiaryId: data.beneficiaryId ? data.beneficiaryId.toString() : '',
            notes: data.notes || '',
            imageUrl: data.imageUrl || '',
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

          <div className="form-group">
            <label className="label">Ảnh hóa đơn (Tùy chọn)</label>
            <input 
              type="file" 
              accept="image/*"
              multiple
              className="input" 
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;
                
                const newImages: string[] = [];
                let processed = 0;
                
                files.forEach(file => {
                  if (file.size > 5 * 1024 * 1024) {
                    alert(`Ảnh ${file.name} quá lớn. Vui lòng chọn ảnh dưới 5MB.`);
                    processed++;
                    return;
                  }
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    newImages.push(reader.result as string);
                    processed++;
                    if (processed === files.length) {
                      let allImages = [];
                      if (formData.imageUrl) {
                        try {
                          const parsed = JSON.parse(formData.imageUrl);
                          allImages = Array.isArray(parsed) ? parsed : [formData.imageUrl];
                        } catch (e) {
                          allImages = [formData.imageUrl]; // Fallback if it's an old single base64 string
                        }
                      }
                      setFormData({...formData, imageUrl: JSON.stringify([...allImages, ...newImages])});
                    }
                  };
                  reader.readAsDataURL(file);
                });
                e.target.value = ''; // Reset input
              }}
            />
            {formData.imageUrl && formData.imageUrl !== '[]' && (
              <div style={{marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                {(() => {
                  let imgs: string[] = [];
                  try {
                    const parsed = JSON.parse(formData.imageUrl);
                    imgs = Array.isArray(parsed) ? parsed : [formData.imageUrl];
                  } catch (e) {
                    imgs = [formData.imageUrl];
                  }
                  return imgs.map((imgUrl: string, idx: number) => (
                    <div key={idx} style={{position: 'relative'}}>
                      <img src={imgUrl} alt={`Hóa đơn ${idx + 1}`} style={{height: '100px', width: 'auto', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover'}} />
                      <button 
                        type="button" 
                        onClick={() => {
                          const newImgs = [...imgs];
                          newImgs.splice(idx, 1);
                          setFormData({...formData, imageUrl: newImgs.length > 0 ? JSON.stringify(newImgs) : ''});
                        }} 
                        style={{position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'}}
                      >
                        ×
                      </button>
                    </div>
                  ));
                })()}
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
            {loading ? 'Đang lưu...' : 'Lưu chỉnh sửa'}
          </button>
        </form>
      </div>
    </main>
  )
}
