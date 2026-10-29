// Tạo dữ liệu mẫu cho database ở máy: npm run db:seed
// XOÁ SẠCH dữ liệu cũ rồi tạo lại — vì vậy từ chối chạy nếu DATABASE_URL không trỏ tới máy này.
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL ?? '';
const host = (() => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
})();
if (!['localhost', '127.0.0.1'].includes(host)) {
  console.error(`Từ chối: DATABASE_URL không phải database ở máy (host "${host || '?'}"). Script này xoá sạch dữ liệu.`);
  process.exit(1);
}

const prisma = new PrismaClient();

// Số giả ngẫu nhiên cố định để lần nào chạy cũng ra cùng dữ liệu
let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
};
const pick = (list) => list[Math.floor(rand() * list.length)];

const now = new Date();
// Giữa trưa UTC để ngày không bị lệch theo múi giờ
const dayOf = (monthsAgo, day) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day, 12));

const SHARED_ITEMS = {
  food: [['Ăn lẩu cuối tuần', 450_000, 900_000], ['Bún chả', 90_000, 160_000], ['Đặt pizza', 250_000, 420_000]],
  groceries: [['Đi chợ', 300_000, 850_000], ['Siêu thị cuối tuần', 600_000, 1_400_000]],
  bills: [['Tiền điện', 600_000, 1_300_000], ['Tiền nước', 120_000, 250_000], ['Internet', 220_000, 220_000]],
  home: [['Tiền nhà', 5_000_000, 5_000_000], ['Sửa vòi nước', 150_000, 400_000]],
  transport: [['Đổ xăng', 80_000, 150_000], ['Grab về quê', 350_000, 600_000]],
  shopping: [['Mua nồi chiên', 1_200_000, 1_900_000], ['Đồ gia dụng', 200_000, 700_000]],
  entertainment: [['Xem phim', 180_000, 320_000], ['Netflix', 260_000, 260_000]],
  other: [['Quà sinh nhật', 300_000, 900_000]],
};

const PERSONAL_ITEMS = [
  ['food', 'Cà phê sáng', 25_000, 60_000],
  ['food', 'Cơm trưa', 40_000, 80_000],
  ['transport', 'Grab đi làm', 35_000, 90_000],
  ['shopping', 'Áo thun', 150_000, 400_000],
  ['entertainment', 'Game', 100_000, 300_000],
  ['health', 'Thuốc cảm', 50_000, 150_000],
  ['education', 'Sách', 90_000, 250_000],
];

const amountBetween = (min, max) => Math.round((min + rand() * (max - min)) / 1000) * 1000;

async function main() {
  // Xoá theo thứ tự khoá ngoại
  await prisma.importedTransaction.deleteMany();
  await prisma.expenseHistory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.member.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.partnership.deleteMany();
  await prisma.personalExpense.deleteMany();
  await prisma.personalBudget.deleteMany();
  await prisma.user.deleteMany();

  const [me, partner, parents] = await Promise.all(
    [
      ['dev-1', 'dev.thieu@example.com', 'Quốc Thiệu'],
      ['dev-2', 'dev.minhanh@example.com', 'Minh Anh'],
      ['dev-3', 'dev.bome@example.com', 'Bố mẹ'],
      // Người dùng chính là superadmin để vào được trang Superadmin ở máy
    ].map(([googleId, email, name], i) => prisma.user.create({ data: { googleId, email, name, isSuperAdmin: i === 0 } })),
  );

  // Hai sổ cho người dùng chính để thử ô chọn sổ; userAId luôn nhỏ hơn userBId
  async function link(a, b) {
    const [x, y] = a.id < b.id ? [a, b] : [b, a];
    const partnership = await prisma.partnership.create({ data: { userAId: x.id, userBId: y.id } });
    const members = await Promise.all(
      [a, b].map(u => prisma.member.create({ data: { name: u.name, userId: u.id, partnershipId: partnership.id } })),
    );
    return { partnership, members };
  }

  const couple = await link(me, partner);
  const family = await link(me, parents);
  const [meMember, partnerMember] = couple.members;

  // Sáu tháng chi tiêu chung; tháng cũ đã trả gần hết, tháng này còn nhiều khoản chưa trả
  let sharedCount = 0;
  for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
    const lastDay = monthsAgo === 0 ? Math.max(1, now.getUTCDate()) : 28;
    const entries = [['home', 'Tiền nhà', 5_000_000, 1], ['bills', 'Tiền điện', amountBetween(600_000, 1_300_000), 5]];
    const extra = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < extra; i++) {
      const category = pick(Object.keys(SHARED_ITEMS));
      const [item, min, max] = pick(SHARED_ITEMS[category]);
      entries.push([category, item, amountBetween(min, max), 1 + Math.floor(rand() * 28)]);
    }

    for (const [category, item, amount, day] of entries) {
      if (day > lastDay) continue;
      const payer = rand() < 0.55 ? meMember : partnerMember;
      const other = payer === meMember ? partnerMember : meMember;
      const onBehalf = category !== 'home' && rand() < 0.12;
      const settled = monthsAgo > 0 ? rand() < 0.85 : rand() < 0.3;
      const date = dayOf(monthsAgo, day);
      await prisma.expense.create({
        data: {
          item,
          amount,
          category,
          payerId: payer.id,
          beneficiaryId: onBehalf ? other.id : null,
          partnershipId: couple.partnership.id,
          date,
          notes: rand() < 0.15 ? 'Ghi chú mẫu' : null,
          isSettled: settled,
          settledAt: settled ? date : null,
          createdAt: date,
        },
      });
      sharedCount++;
    }
  }

  // Một khoản có lịch sử sửa để thử trang Lịch sử thay đổi
  const edited = await prisma.expense.create({
    data: {
      item: 'Đi siêu thị',
      amount: 1_150_000,
      category: 'groceries',
      payerId: partnerMember.id,
      partnershipId: couple.partnership.id,
      date: dayOf(0, 1),
      createdAt: dayOf(0, 1),
    },
  });
  await prisma.expenseHistory.create({
    data: {
      expenseId: edited.id,
      action: 'UPDATE',
      oldItem: 'Siêu thị',
      oldAmount: 950_000,
      oldPayerName: partnerMember.name,
      oldDate: dayOf(0, 1),
      oldCategory: 'other',
      editedAt: dayOf(0, 1),
    },
  });

  // Sổ thứ hai ít khoản
  const [meInFamily, parentsMember] = family.members;
  for (const [item, amount, payer] of [['Biếu bố mẹ', 2_000_000, meInFamily], ['Đi khám', 600_000, parentsMember]]) {
    await prisma.expense.create({
      data: { item, amount, category: 'other', payerId: payer.id, partnershipId: family.partnership.id, date: dayOf(0, 1) },
    });
  }

  // Chi tiêu cá nhân ba tháng và ngân sách tháng này
  let personalCount = 0;
  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const lastDay = monthsAgo === 0 ? Math.max(1, now.getUTCDate()) : 28;
    for (let i = 0; i < 12; i++) {
      const [category, item, min, max] = pick(PERSONAL_ITEMS);
      const day = 1 + Math.floor(rand() * lastDay);
      await prisma.personalExpense.create({
        data: { userId: me.id, item, amount: amountBetween(min, max), category, date: dayOf(monthsAgo, day) },
      });
      personalCount++;
    }
  }
  await prisma.personalBudget.create({
    data: { userId: me.id, month: now.toISOString().slice(0, 7), amount: 9_000_000 },
  });

  console.log(`Đã tạo 3 người dùng, 2 sổ chung, ${sharedCount + 3} khoản chi chung, ${personalCount} khoản cá nhân.`);
  console.log(`Đăng nhập ở máy: npm run dev:login            (${me.name}, ${me.email})`);
  console.log(`              hoặc npm run dev:login -- ${partner.email}`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
