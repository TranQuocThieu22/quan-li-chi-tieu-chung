// Ngân sách: đọc từ database và gom cảnh báo (chỉ chạy ở server)
import prisma from '@/lib/db';
import { getActivePartnerships, getPartner } from '@/lib/auth';
import { budgetStatus, pickBudget, vietnamToday, type BudgetLevel } from '@/lib/budget';
import { getCategory, PERSONAL_CATEGORIES } from '@/lib/personal';
import { getSharedSpendingShare } from '@/lib/spending';

// Khoảng [start, end) của một tháng, cùng cách các trang đang lọc khoản chi
export function monthRange(month: string) {
  const [year, monthNum] = month.split('-').map(Number);
  return { start: new Date(year, monthNum - 1, 1), end: new Date(year, monthNum, 1) };
}

// Ngân sách tổng cá nhân đang áp dụng cho tháng (đặt ở tháng đó hoặc gần nhất trước đó)
export async function getPersonalBudget(userId: number, month: string) {
  const records = await prisma.personalBudget.findMany({ where: { userId, month: { lte: month } }, select: { month: true, amount: true } });
  return pickBudget(records, month);
}

// Ngân sách từng danh mục cá nhân đang áp dụng cho tháng: key danh mục → { amount, from }
export async function getCategoryBudgets(userId: number, month: string) {
  const records = await prisma.personalCategoryBudget.findMany({
    where: { userId, month: { lte: month } },
    select: { category: true, month: true, amount: true },
  });
  const result: Record<string, { amount: number; from: string }> = {};
  for (const c of PERSONAL_CATEGORIES) {
    const picked = pickBudget(records.filter(r => r.category === c.key), month);
    if (picked) result[c.key] = picked;
  }
  return result;
}

export async function getSharedBudget(partnershipId: number, month: string) {
  const records = await prisma.sharedBudget.findMany({ where: { partnershipId, month: { lte: month } }, select: { month: true, amount: true } });
  return pickBudget(records, month);
}

// Tổng chi của sổ trong tháng để so với ngân sách sổ: mọi khoản, kể cả đã trả và mua giùm — đều là tiền đã chi
export async function getSharedMonthTotal(partnershipId: number, month: string) {
  const { start, end } = monthRange(month);
  const { _sum } = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: { partnershipId, isDeleted: false, date: { gte: start, lt: end } },
  });
  return _sum.amount ?? 0;
}

export type BudgetAlert = { key: string; label: string; percent: number; level: BudgetLevel; remaining: number; href: string };

// Cảnh báo ngân sách của tháng hiện tại (giờ Việt Nam) đã dùng từ 80%: ngân sách tổng, từng danh mục, từng sổ chung
export async function getBudgetAlerts(userId: number): Promise<BudgetAlert[]> {
  const month = vietnamToday().month;
  const { start, end } = monthRange(month);
  const [personalBudget, categoryBudgets, partnerships] = await Promise.all([
    getPersonalBudget(userId, month),
    getCategoryBudgets(userId, month),
    getActivePartnerships(userId),
  ]);
  const needPersonal = personalBudget || Object.keys(categoryBudgets).length > 0;
  const [byCategory, shared, sharedBudgets] = await Promise.all([
    needPersonal
      ? prisma.personalExpense.groupBy({
          by: ['category'],
          _sum: { amount: true },
          where: { userId, isDeleted: false, date: { gte: start, lt: end } },
        })
      : [],
    personalBudget ? getSharedSpendingShare(userId, start, end) : null,
    Promise.all(partnerships.map(async p => ({ partnership: p, budget: await getSharedBudget(p.id, month) }))),
  ]);

  const alerts: BudgetAlert[] = [];
  const push = (key: string, label: string, spent: number, budget: number, href: string) => {
    const status = budgetStatus(spent, budget);
    if (status.level !== 'ok') alerts.push({ key, label, href, ...status });
  };

  const personalTotal = byCategory.reduce((sum, row) => sum + (row._sum.amount ?? 0), 0);
  if (personalBudget) push('personal', 'Ngân sách cá nhân', personalTotal + (shared?.total ?? 0), personalBudget.amount, '/personal');
  for (const [key, budget] of Object.entries(categoryBudgets)) {
    // Danh mục lạ trong dữ liệu cũ được tính vào "Khác", như ở trang Cá nhân
    const spent = byCategory
      .filter(row => getCategory(row.category).key === key)
      .reduce((sum, row) => sum + (row._sum.amount ?? 0), 0);
    const c = getCategory(key);
    push(`category-${key}`, `${c.icon} ${c.label}`, spent, budget.amount, '/personal');
  }
  for (const { partnership, budget } of sharedBudgets) {
    if (!budget) continue;
    const spent = await getSharedMonthTotal(partnership.id, month);
    push(`shared-${partnership.id}`, `Sổ chung với ${getPartner(partnership, userId).name}`, spent, budget.amount, '/');
  }
  return alerts;
}
