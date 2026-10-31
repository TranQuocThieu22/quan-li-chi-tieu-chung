// Phần tính ngân sách dùng chung (client và server, không import Prisma)

// Hôm nay theo giờ Việt Nam — server Vercel chạy giờ UTC nên 0h–7h sáng sẽ lệch một ngày, sang tháng cũng lệch tháng
export function vietnamToday(now = new Date()) {
  const [year, month, day] = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).split('-');
  return { month: `${year}-${month}`, day: Number(day) };
}

// Số ngày còn lại của tháng (tính cả hôm nay) nếu đang ở tháng đó, ngược lại 0
export function daysLeftInMonth(month: string, now = new Date()) {
  const today = vietnamToday(now);
  if (today.month !== month) return 0;
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNum, 0)).getUTCDate() - today.day + 1;
}

// Ngân sách áp dụng cho một tháng: bản đặt cho tháng đó hoặc gần nhất trước đó; 0 nghĩa là đã tắt
export function pickBudget(records: { month: string; amount: number }[], month: string) {
  const latest = records
    .filter(r => r.month <= month)
    .reduce<{ month: string; amount: number } | null>((best, r) => (!best || r.month > best.month ? r : best), null);
  return latest && latest.amount > 0 ? { amount: latest.amount, from: latest.month } : null;
}

export type BudgetLevel = 'ok' | 'warn' | 'over';

// Từ 80% thì nhắc, chi quá ngân sách là vượt (so số tiền, không so phần trăm đã làm tròn)
export function budgetStatus(spent: number, budget: number) {
  const percent = Math.round((spent / budget) * 100);
  const level: BudgetLevel = spent > budget ? 'over' : percent >= 80 ? 'warn' : 'ok';
  return { percent, level, remaining: budget - spent };
}

export const BUDGET_COLORS: Record<BudgetLevel, string> = {
  ok: 'var(--success-color)',
  warn: 'var(--warning-color)',
  over: 'var(--danger-color)',
};
