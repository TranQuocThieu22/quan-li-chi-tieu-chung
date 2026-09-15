import prisma from '@/lib/db';
import { getActivePartnerships, getPartner } from '@/lib/auth';

// Phần chi tiêu của một người trong các sổ chung đang liên kết, trong khoảng [start, end):
// - khoản chung chia đều cho các thành viên của sổ
// - khoản mua giùm tính hết cho người được mua giùm
// Khoản đã trả vẫn được tính vì tiền đã thực sự chi, chỉ phần công nợ là đã thanh toán.
export async function getSharedSpendingShare(userId: number, start: Date, end: Date) {
  const partnerships = await getActivePartnerships(userId);
  const expenses = partnerships.length === 0 ? [] : await prisma.expense.findMany({
    where: { isDeleted: false, partnershipId: { in: partnerships.map(p => p.id) }, date: { gte: start, lt: end } },
    select: { amount: true, beneficiaryId: true, partnershipId: true },
  });

  const ledgers = partnerships.map(p => {
    const myMemberId = p.members.find(m => m.userId === userId)?.id;
    const memberCount = Math.max(p.members.length, 1);
    const share = expenses
      .filter(e => e.partnershipId === p.id)
      .reduce((sum, e) => {
        if (e.beneficiaryId === null) return sum + e.amount / memberCount;
        return e.beneficiaryId === myMemberId ? sum + e.amount : sum;
      }, 0);
    return { partnershipId: p.id, partnerName: getPartner(p, userId).name, share: Math.round(share) };
  });

  return { total: ledgers.reduce((sum, l) => sum + l.share, 0), ledgers };
}
