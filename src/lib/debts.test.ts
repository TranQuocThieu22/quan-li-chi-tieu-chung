import { describe, expect, it } from 'vitest';
import { expenseShares, groupByMonth, settleDebts } from './debts';

const members = [{ id: 1, name: 'An' }, { id: 2, name: 'Bình' }];

describe('settleDebts', () => {
  it('khoản chung chia đều, người trả ít hơn nợ phần chênh', () => {
    const { sharedTotal, average, transactions } = settleDebts(members, [
      { amount: 300_000, payerId: 1, beneficiaryId: null },
      { amount: 100_000, payerId: 2, beneficiaryId: null },
    ]);
    expect(sharedTotal).toBe(400_000);
    expect(average).toBe(200_000);
    expect(transactions).toEqual([{ from: 'Bình', fromId: 2, to: 'An', toId: 1, amount: 100_000 }]);
  });

  it('mua giùm: người được mua giùm nợ hết, không vào tổng chi chung', () => {
    const { sharedTotal, transactions } = settleDebts(members, [{ amount: 50_000, payerId: 1, beneficiaryId: 2 }]);
    expect(sharedTotal).toBe(0);
    expect(transactions).toEqual([{ from: 'Bình', fromId: 2, to: 'An', toId: 1, amount: 50_000 }]);
  });

  it('nợ tháng trước cộng vào tháng này, ngược chiều thì bù trừ', () => {
    const lastMonth = [{ amount: 400_000, payerId: 1, beneficiaryId: null }]; // Bình nợ An 200.000
    const thisMonth = [{ amount: 100_000, payerId: 2, beneficiaryId: null }]; // An nợ Bình 50.000
    expect(settleDebts(members, [...thisMonth, ...lastMonth]).transactions)
      .toEqual([{ from: 'Bình', fromId: 2, to: 'An', toId: 1, amount: 150_000 }]);
  });

  it('không có khoản nào thì không ai nợ ai', () => {
    expect(settleDebts(members, []).transactions).toEqual([]);
  });
});

describe('expenseShares', () => {
  it('khoản chung: người không trả nợ một phần chia đều', () => {
    expect(expenseShares(members, { amount: 295_000, payerId: 1, beneficiaryId: null }))
      .toEqual({ splitBy: 2, owes: [{ id: 2, name: 'Bình', amount: 147_500 }] });
  });

  it('mua giùm: người được mua giùm nợ hết', () => {
    expect(expenseShares(members, { amount: 66_000, payerId: 1, beneficiaryId: 2 }))
      .toEqual({ splitBy: null, owes: [{ id: 2, name: 'Bình', amount: 66_000 }] });
  });

  it('ba người: hai người không trả, mỗi người một phần ba', () => {
    const three = [...members, { id: 3, name: 'Chi' }];
    expect(expenseShares(three, { amount: 300_000, payerId: 2, beneficiaryId: null }).owes)
      .toEqual([{ id: 1, name: 'An', amount: 100_000 }, { id: 3, name: 'Chi', amount: 100_000 }]);
  });

  it('mua cho chính mình hoặc người trả không còn trong sổ thì không ai nợ', () => {
    expect(expenseShares(members, { amount: 50_000, payerId: 1, beneficiaryId: 1 }).owes).toEqual([]);
    expect(expenseShares(members, { amount: 50_000, payerId: 9, beneficiaryId: null }).owes).toEqual([]);
  });
});

describe('groupByMonth', () => {
  it('gom theo tháng, tháng gần nhất trước', () => {
    const groups = groupByMonth([
      { id: 1, date: new Date(2026, 8, 5) },
      { id: 2, date: new Date(2026, 9, 31) },
      { id: 3, date: new Date(2026, 8, 30) },
    ]);
    expect(groups.map(g => [g.month, g.items.map(i => i.id)])).toEqual([['2026-10', [2]], ['2026-09', [1, 3]]]);
  });
});
