// Chạy một lần lúc build trên Vercel (package.json "build"): danh mục "Đồ uống" và "Tiền nhà" có từ 31/10/2026, nên khoản
// cũ ở danh mục trước đây ("Ăn uống" → nay "Đồ ăn"; tiền nhà nằm ở "Nhà cửa" / "Hóa đơn") mà bộ đoán mới nhận ra thì chuyển
// sang danh mục mới. Khoản sổ chung có ghi lịch sử sửa, như đổi danh mục hàng loạt.
// Chỉ đụng khoản tạo trước CUTOFF. Đã có khoản thuộc danh mục mới tạo trước CUTOFF nghĩa là bước đó đã chạy → bỏ qua, để không
// chuyển lại những khoản người dùng tự đổi về. Gỡ khỏi lệnh build sau khi đã chạy trên production.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import { guessPersonalCategory } from '../src/lib/personal.ts';
import { guessSharedCategory } from '../src/lib/shared.ts';

const CUTOFF = new Date('2026-10-31T10:30:00Z');
// to: danh mục mới; personalFrom / sharedFrom: danh mục cũ của khoản cá nhân / sổ chung có thể thuộc danh mục mới
const MOVES = [
  { to: 'drinks', personalFrom: 'food', sharedFrom: 'food' },
  { to: 'rent', personalFrom: 'bills', sharedFrom: 'home' },
];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('move-new-categories: thiếu DATABASE_URL');
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

async function move({ to, personalFrom, sharedFrom }) {
  const marker = { category: to, createdAt: { lt: CUTOFF } };
  if ((await prisma.expense.count({ where: marker })) + (await prisma.personalExpense.count({ where: marker })) > 0) {
    console.log(`move-new-categories: ${to} đã chạy trước đây, bỏ qua`);
    return;
  }

  const old = { isDeleted: false, createdAt: { lt: CUTOFF } };
  const personal = (await prisma.personalExpense.findMany({ where: { ...old, category: personalFrom }, select: { id: true, item: true } }))
    .filter(e => guessPersonalCategory(e.item) === to);
  const shared = (await prisma.expense.findMany({ where: { ...old, category: sharedFrom }, include: { payer: true, beneficiary: true } }))
    .filter(e => guessSharedCategory(e.item) === to);

  await prisma.$transaction([
    prisma.personalExpense.updateMany({ where: { id: { in: personal.map(e => e.id) } }, data: { category: to } }),
    // Giống /api/expenses/bulk: lưu bản cũ để xem / sửa lại ở trang Lịch sử
    prisma.expenseHistory.createMany({
      data: shared.map(e => ({
        expenseId: e.id,
        action: 'UPDATE',
        oldItem: e.item,
        oldAmount: e.amount,
        oldPayerName: e.payer.name,
        oldBeneficiaryName: e.beneficiary?.name,
        oldDate: e.date,
        oldNotes: e.notes,
        oldImageUrl: e.imageUrl,
        oldCategory: e.category,
      })),
    }),
    prisma.expense.updateMany({ where: { id: { in: shared.map(e => e.id) } }, data: { category: to } }),
  ]);

  const names = list => [...new Set(list.map(e => e.item))].slice(0, 30).join(', ');
  console.log(`move-new-categories: ${to} — cá nhân ${personal.length} khoản (${names(personal)})`);
  console.log(`move-new-categories: ${to} — sổ chung ${shared.length} khoản (${names(shared)})`);
}

try {
  for (const m of MOVES) await move(m);
} finally {
  await prisma.$disconnect();
}
