'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Ledger = { id: number; partnerName: string };

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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      <label htmlFor="ledger" style={{ fontWeight: 600 }}>Sổ chi tiêu với:</label>
      {ledgers.length > 1 ? (
        <select
          id="ledger"
          className="select"
          value={currentId}
          onChange={handleChange}
          disabled={isPending}
          style={{ width: 'auto', margin: 0, fontWeight: 600 }}
        >
          {ledgers.map(l => (
            <option key={l.id} value={l.id}>{l.partnerName}</option>
          ))}
        </select>
      ) : (
        <strong id="ledger">{ledgers[0]?.partnerName}</strong>
      )}
      <Link href="/admin" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none' }}>
        + Liên kết thêm
      </Link>
    </div>
  );
}
