import { describe, expect, it } from 'vitest';
import { budgetStatus, daysLeftInMonth, pickBudget, vietnamToday } from './budget';

describe('vietnamToday', () => {
  it('theo giờ Việt Nam, không theo UTC', () => {
    // 20:00 UTC ngày 31/10 là 03:00 sáng 1/11 ở Việt Nam
    expect(vietnamToday(new Date('2026-10-31T20:00:00Z'))).toEqual({ month: '2026-11', day: 1 });
    expect(vietnamToday(new Date('2026-10-30T10:00:00Z'))).toEqual({ month: '2026-10', day: 30 });
  });
});

describe('daysLeftInMonth', () => {
  it('đếm cả hôm nay, theo giờ Việt Nam', () => {
    // 3h sáng 31/10 giờ Việt Nam (20:00 UTC 30/10): còn đúng 1 ngày, không phải 2
    expect(daysLeftInMonth('2026-10', new Date('2026-10-30T20:00:00Z'))).toBe(1);
    expect(daysLeftInMonth('2026-10', new Date('2026-10-01T05:00:00Z'))).toBe(31);
  });

  it('tháng khác tháng hiện tại thì 0', () => {
    expect(daysLeftInMonth('2026-09', new Date('2026-10-15T05:00:00Z'))).toBe(0);
    expect(daysLeftInMonth('2026-11', new Date('2026-10-15T05:00:00Z'))).toBe(0);
  });
});

describe('pickBudget', () => {
  const records = [
    { month: '2026-08', amount: 5_000_000 },
    { month: '2026-10', amount: 6_000_000 },
    { month: '2026-12', amount: 0 },
  ];

  it('lấy ngân sách tháng đó, hoặc gần nhất trước đó', () => {
    expect(pickBudget(records, '2026-10')).toEqual({ amount: 6_000_000, from: '2026-10' });
    expect(pickBudget(records, '2026-11')).toEqual({ amount: 6_000_000, from: '2026-10' });
    expect(pickBudget(records, '2026-09')).toEqual({ amount: 5_000_000, from: '2026-08' });
  });

  it('chưa đặt, hoặc đã tắt (0), thì null', () => {
    expect(pickBudget(records, '2026-07')).toBeNull();
    expect(pickBudget(records, '2027-01')).toBeNull();
  });
});

describe('budgetStatus', () => {
  it('dưới 80% là ổn, từ 80% là sắp hết, trên 100% là vượt', () => {
    expect(budgetStatus(790_000, 1_000_000)).toEqual({ percent: 79, level: 'ok', remaining: 210_000 });
    expect(budgetStatus(800_000, 1_000_000)).toEqual({ percent: 80, level: 'warn', remaining: 200_000 });
    expect(budgetStatus(1_000_000, 1_000_000)).toEqual({ percent: 100, level: 'warn', remaining: 0 });
    expect(budgetStatus(1_200_000, 1_000_000)).toEqual({ percent: 120, level: 'over', remaining: -200_000 });
  });

  it('vượt một chút mà làm tròn ra 100% vẫn là vượt', () => {
    expect(budgetStatus(10_043_000, 10_000_000)).toEqual({ percent: 100, level: 'over', remaining: -43_000 });
  });
});
