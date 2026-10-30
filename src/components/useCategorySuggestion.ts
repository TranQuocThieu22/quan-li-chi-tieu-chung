'use client';

import { useState } from 'react';
import { normalizeItemName } from '@/lib/guess-category';

// notification: đoán từ nội dung giao dịch ngân hàng lúc mở form, chưa gõ tên món
type Source = 'known' | 'keyword' | 'notification' | null;

const HINTS = { known: 'như lần trước', keyword: 'tự chọn theo tên món', notification: 'theo nội dung thông báo' };

// Tự chọn danh mục theo tên món cho tới khi người dùng tự bấm chọn:
// ưu tiên danh mục của khoản gần nhất cùng tên (knownCategories), không có thì đoán theo từ khoá.
export function useCategorySuggestion({
  guess,
  knownCategories = {},
  fallback,
  enabled,
  initialSource = null,
}: {
  guess: (item: string) => string | null;
  knownCategories?: Record<string, string>;
  fallback: string;
  enabled: boolean;
  initialSource?: Source;
}) {
  const [touched, setTouched] = useState(!enabled);
  const [source, setSource] = useState<Source>(initialSource);

  // Trả danh mục mới cho tên món, hoặc null nếu người dùng đã tự chọn (giữ nguyên)
  const suggestFor = (item: string) => {
    if (touched) return null;
    const known = knownCategories[normalizeItemName(item)];
    const guessed = known ? null : guess(item);
    setSource(known ? 'known' : guessed ? 'keyword' : null);
    return known ?? guessed ?? fallback;
  };

  return {
    suggestFor,
    markTouched: () => setTouched(true),
    hint: !touched && source ? HINTS[source] : undefined,
  };
}

// Danh mục điền sẵn khi mở form từ một tên món có sẵn (vd. nội dung giao dịch ngân hàng)
export function initialSuggestion(
  item: string,
  guess: (item: string) => string | null,
  knownCategories: Record<string, string>,
  fallback: string,
): { category: string; source: Source } {
  const known = knownCategories[normalizeItemName(item)];
  if (known) return { category: known, source: 'known' };
  const guessed = item ? guess(item) : null;
  return guessed ? { category: guessed, source: 'notification' } : { category: fallback, source: null };
}
