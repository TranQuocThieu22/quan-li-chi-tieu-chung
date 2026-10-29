import PageHeader from '@/components/PageHeader';
import PersonalExpenseForm from '@/components/PersonalExpenseForm';

// Render theo request để ngày mặc định trong form là hôm nay, không phải ngày build
export const dynamic = 'force-dynamic';

export default function AddPersonalExpense() {
  return (
    <main className="container">
      <PageHeader title="Thêm chi tiêu cá nhân" backHref="/personal" />

      <div className="card">
        <PersonalExpenseForm />
      </div>
    </main>
  );
}
