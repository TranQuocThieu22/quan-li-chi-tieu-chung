import Link from 'next/link';
import prisma from '@/lib/db';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { payer: true, histories: { orderBy: { editedAt: 'desc' } } }
  });

  if (!expense) return notFound();

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (date: Date) => new Date(date).toLocaleDateString('vi-VN');

  const timeline: any[] = [];
  let nextState = {
    item: expense.item,
    amount: expense.amount,
    payerName: expense.payer?.name || 'Không rõ',
    date: expense.date
  };

  expense.histories.forEach(h => {
    const oldState = {
      item: h.oldItem,
      amount: h.oldAmount,
      payerName: h.oldPayerName,
      date: h.oldDate
    };
    
    timeline.push({
      id: h.id,
      action: h.action,
      time: h.editedAt,
      old: oldState,
      new: nextState
    });

    nextState = oldState;
  });

  const renderDiff = (label: string, oldVal: string, newVal: string, isMoney: boolean = false) => {
    if (oldVal === newVal) {
      return (
        <div style={{marginBottom: '0.25rem', display: 'flex', gap: '0.5rem'}}>
          <strong style={{minWidth: '80px'}}>{label}:</strong> 
          <span style={{color: 'var(--text-primary)'}}>{isMoney ? formatMoney(parseInt(oldVal)) : oldVal}</span>
        </div>
      );
    }
    return (
      <div style={{marginBottom: '0.5rem', background: 'var(--bg-color)', borderRadius: '6px', border: '1px solid var(--border-color)', overflow: 'hidden', fontFamily: 'monospace'}}>
        <div style={{display: 'flex', padding: '0.4rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171'}}>
          <span style={{width: '100px'}}>- {label}:</span>
          <span style={{textDecoration: 'line-through'}}>{isMoney ? formatMoney(parseInt(oldVal)) : oldVal}</span>
        </div>
        <div style={{display: 'flex', padding: '0.4rem 1rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399'}}>
          <span style={{width: '100px'}}>+ {label}:</span>
          <span style={{fontWeight: 700}}>{isMoney ? formatMoney(parseInt(newVal)) : newVal}</span>
        </div>
      </div>
    );
  };

  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Lịch Sử Thay Đổi</h1>
        <Link href="/" className="btn btn-secondary" style={{width: 'auto'}}>Trở về</Link>
      </header>

      <div className="card mb-4" style={{border: '1px solid var(--primary-color)'}}>
        <h2 className="subtitle" style={{color: 'var(--primary-color)'}}>
          Trạng thái hiện tại {expense.isDeleted ? '(Đã Xóa)' : ''}
        </h2>
        <p><strong>Món đồ:</strong> {expense.item}</p>
        <p><strong>Số tiền:</strong> {formatMoney(expense.amount)}</p>
        <p><strong>Người trả:</strong> {expense.payer?.name}</p>
        <p><strong>Ngày mua:</strong> {formatDate(expense.date)}</p>
      </div>

      <h2 className="title mt-6">Dấu vết lịch sử (Diff Compare)</h2>
      {timeline.length === 0 ? (
        <p className="text-center" style={{color: 'var(--text-secondary)'}}>Khoản chi này chưa từng bị chỉnh sửa.</p>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          {timeline.map((event) => (
            <div key={event.id} className="card" style={{
              margin: 0, 
              padding: '1.25rem', 
              borderLeft: event.action === 'DELETE' ? '4px solid var(--danger-color)' : '4px solid var(--primary-color)'
            }}>
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  background: event.action === 'DELETE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                  color: event.action === 'DELETE' ? 'var(--danger-color)' : 'var(--primary-color)'
                }}>
                  {event.action}
                </span>
                <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                  Vào lúc {new Date(event.time).toLocaleString('vi-VN')}
                </span>
              </div>
              
              <div style={{fontSize: '0.9rem', lineHeight: 1.6}}>
                {renderDiff('Món đồ', event.old.item, event.new.item)}
                {renderDiff('Số tiền', event.old.amount.toString(), event.new.amount.toString(), true)}
                {renderDiff('Người trả', event.old.payerName, event.new.payerName)}
                {renderDiff('Ngày mua', formatDate(event.old.date), formatDate(event.new.date))}
              </div>
            </div>
          ))}
          
          {/* Add a root creation event */}
          <div className="card" style={{margin: 0, padding: '1.25rem', borderLeft: '4px solid var(--success-color)'}}>
             <div style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600,
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: 'var(--success-color)'
                }}>
                  CREATE
                </span>
                <span style={{fontSize: '0.875rem', color: 'var(--text-secondary)'}}>
                  Vào lúc {new Date(expense.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <p style={{marginBottom: '0.25rem'}}><strong>Món đồ:</strong> {nextState.item}</p>
              <p style={{marginBottom: '0.25rem'}}><strong>Số tiền:</strong> {formatMoney(nextState.amount)}</p>
              <p style={{marginBottom: '0.25rem'}}><strong>Người trả:</strong> {nextState.payerName}</p>
              <p style={{marginBottom: '0.25rem'}}><strong>Ngày mua:</strong> {formatDate(nextState.date)}</p>
          </div>
        </div>
      )}
    </main>
  );
}
