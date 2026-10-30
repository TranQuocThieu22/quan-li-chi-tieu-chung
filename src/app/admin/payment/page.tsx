import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import PageHeader from '@/components/PageHeader';
import PaymentSetup from '@/components/PaymentSetup';
import PaymentCard from '@/components/PaymentCard';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Tài khoản nhận tiền: người cùng sổ thấy mã QR này ở thẻ "Cần thanh toán" khi họ nợ mình
export default async function PaymentSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const profile = await prisma.paymentProfile.findUnique({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader title="Nhận tiền" subtitle="Người cùng sổ quét mã để chuyển khoản cho bạn" />

      <PaymentSetup
        initial={{
          bankBin: profile?.bankBin ?? '',
          bankAccount: profile?.bankAccount ?? '',
          accountName: profile?.accountName ?? '',
          qrImage: profile?.qrImage ?? '',
        }}
      />

      {profile && (
        <section className="card">
          <div className="card-title">Người cùng sổ sẽ thấy</div>
          <PaymentCard profile={profile} />
        </section>
      )}
    </div>
  );
}
