import Link from 'next/link';
import prisma from '@/lib/db';

// Nhiều khoản thì chỉ liệt kê mấy khoản gần nhất, phần còn lại gộp một dòng
const MAX_LISTED = 5;

// Nhắc ở đầu trang Sổ chung những khoản được ghi giùm mà chưa có số tiền.
// Lấy mọi tháng, không chỉ tháng đang xem: người ghi giùm không biết giá nên khoản này treo tới khi người trả điền.
// Hiện cho cả hai người trong sổ (người trả có thể chưa liên kết tài khoản), nhưng ghi rõ ai phải điền.
export default async function MissingAmountBanner({
  partnershipId,
  userId,
}: {
  partnershipId: number;
  userId: number;
}) {
  const expenses = await prisma.expense.findMany({
    where: { isDeleted: false, needsAmount: true, partnershipId },
    orderBy: { date: 'desc' },
    include: { payer: true },
  });
  if (expenses.length === 0) return null;

  const listed = expenses.slice(0, MAX_LISTED);
  const rest = expenses.length - listed.length;

  return (
    <section className="notice missing-amount">
      <div className="missing-amount-head">
        <strong>{expenses.length} khoản</strong> được ghi giùm nhưng chưa có số tiền — điền giúp để tính vào công nợ.
      </div>
      <ul className="missing-amount-list">
        {listed.map(exp => (
          <li key={exp.id}>
            <Link href={`/edit/${exp.id}`}>
              <span className="missing-amount-item">
                {exp.item}
                <span className="missing-amount-meta">
                  {exp.date.toLocaleDateString('vi-VN')} • {exp.payer.userId === userId ? 'Bạn' : exp.payer.name} trả
                </span>
              </span>
              <span className="import-banner-cta">Điền số tiền →</span>
            </Link>
          </li>
        ))}
      </ul>
      {rest > 0 && <div className="missing-amount-meta">… và {rest} khoản nữa trong Lịch sử chi tiêu.</div>}
    </section>
  );
}
