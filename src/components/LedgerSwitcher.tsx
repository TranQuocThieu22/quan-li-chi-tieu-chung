'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

type Ledger = { id: number; partnerName: string };

// Nằm trong phụ đề tiêu đề trang: "với <tên>" hoặc ô chọn khi có nhiều sổ
export default function LedgerSwitcher({ ledgers, currentId }: { ledgers: Ledger[]; currentId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const res = await fetch('/api/partner/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: Number(e.target.value) }),
    });
    if (!res.ok) {
      alert('Không chuyển được sổ chi tiêu');
      return;
    }
    startTransition(() => router.refresh());
  };

  if (ledgers.length <= 1) {
    return <>với <strong style={{ color: 'var(--text-primary)' }}>{ledgers[0]?.partnerName}</strong></>;
  }

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
      với
      <select
        className="ledger-select"
        aria-label="Chọn sổ chi tiêu"
        value={currentId}
        onChange={handleChange}
        disabled={isPending}
      >
        {ledgers.map(l => (
          <option key={l.id} value={l.id}>{l.partnerName}</option>
        ))}
      </select>
    </label>
  );
}
