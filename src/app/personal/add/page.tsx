import Link from 'next/link';
import PersonalExpenseForm from '@/components/PersonalExpenseForm';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

export default function AddPersonalExpense() {
  return (
    <main className="container">
      <header>
        <h1 className="title" style={{marginBottom: 0}}>Thêm Chi Tiêu Cá Nhân</h1>
        <Link href="/personal" className="btn btn-secondary" style={{width: 'auto'}}>Hủy</Link>
      </header>

      <div className="card">
        <PersonalExpenseForm />
      </div>
    </main>
  );
}
