// Công nợ sổ chung; thuần, không import Prisma

export type DebtMember = { id: number; name: string };
export type DebtExpense = { amount: number; payerId: number; beneficiaryId: number | null };
export type DebtTransaction = { from: string; fromId: number; to: string; toId: number; amount: number };

// Ai trả cho ai từ các khoản chưa trả (người gọi lọc isSettled):
// - khoản chung chia đều cho các thành viên
// - khoản mua giùm thì người được mua giùm nợ hết cho người trả
// Người trả không còn là thành viên thì khoản đó bỏ qua phần của họ (như trước).
// Công nợ cộng được: nợ của nhiều tháng tính chung một lượt bằng tổng nợ từng tháng.
export function settleDebts(members: DebtMember[], expenses: DebtExpense[]) {
  const paid = new Map(members.map(m => [m.id, 0]));
  const balance = new Map(members.map(m => [m.id, 0]));
  let sharedTotal = 0;

  for (const exp of expenses) {
    if (paid.has(exp.payerId)) {
      paid.set(exp.payerId, paid.get(exp.payerId)! + exp.amount);
      balance.set(exp.payerId, balance.get(exp.payerId)! + exp.amount);
    }
    if (exp.beneficiaryId) {
      if (balance.has(exp.beneficiaryId)) balance.set(exp.beneficiaryId, balance.get(exp.beneficiaryId)! - exp.amount);
    } else {
      sharedTotal += exp.amount;
    }
  }

  const average = members.length > 0 ? sharedTotal / members.length : 0;
  const balances = members.map(m => ({ id: m.id, name: m.name, totalPaid: paid.get(m.id)!, balance: balance.get(m.id)! - average }));

  const debtors = balances.filter(b => b.balance < -0.01).map(b => ({ ...b })).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter(b => b.balance > 0.01).map(b => ({ ...b })).sort((a, b) => b.balance - a.balance);
  const transactions: DebtTransaction[] = [];

  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const amount = Math.min(-debtor.balance, creditor.balance);
    if (amount > 0.01) {
      transactions.push({ from: debtor.name, fromId: debtor.id, to: creditor.name, toId: creditor.id, amount });
    }
    debtor.balance += amount;
    creditor.balance -= amount;
    if (Math.abs(debtor.balance) < 0.01) d++;
    if (Math.abs(creditor.balance) < 0.01) c++;
  }

  return { sharedTotal, average, balances, transactions };
}

// Phần một khoản chưa trả mà từng người phải trả lại cho người trả, cùng luật với settleDebts:
// khoản chung chia đều (splitBy = số thành viên), mua giùm thì người được mua giùm nợ hết (splitBy = null)
export type ExpenseShares = { splitBy: number | null; owes: { id: number; name: string; amount: number }[] };
export function expenseShares(members: DebtMember[], exp: DebtExpense): ExpenseShares {
  if (!members.some(m => m.id === exp.payerId)) return { splitBy: null, owes: [] };
  if (exp.beneficiaryId) {
    const beneficiary = members.find(m => m.id === exp.beneficiaryId);
    const owes = beneficiary && beneficiary.id !== exp.payerId
      ? [{ id: beneficiary.id, name: beneficiary.name, amount: exp.amount }]
      : [];
    return { splitBy: null, owes };
  }
  const share = exp.amount / members.length;
  return {
    splitBy: members.length,
    owes: members.filter(m => m.id !== exp.payerId).map(m => ({ id: m.id, name: m.name, amount: share })),
  };
}

// Gom khoản theo tháng YYYY-MM (theo giờ của Date đưa vào, cùng cách trang chủ cắt tháng), tháng gần nhất trước
export function groupByMonth<T extends { date: Date }>(expenses: T[]) {
  const groups = new Map<string, T[]>();
  for (const exp of expenses) {
    const key = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, '0')}`;
    groups.set(key, [...(groups.get(key) ?? []), exp]);
  }
  return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([month, items]) => ({ month, items }));
}
