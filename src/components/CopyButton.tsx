'use client';

import { useState } from 'react';

// Nút chữ "Chép" cạnh một giá trị (số tài khoản…), đổi thành "Đã chép ✓" một lúc sau khi chép
export default function CopyButton({ value, label = 'Chép' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Không chép được, hãy chọn và chép tay.');
    }
  };
  return (
    <button type="button" className="text-btn" onClick={copy}>
      {copied ? 'Đã chép ✓' : label}
    </button>
  );
}
