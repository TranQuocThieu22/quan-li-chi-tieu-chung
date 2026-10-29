'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';

type PublicUser = { id: number; name: string; email: string; image: string | null };
type Invite = { id: number; user: PublicUser; createdAt: string };
type Partner = { partnershipId: number; user: PublicUser; linkedAt: string };
type PartnerState = { me: PublicUser; partners: Partner[]; incoming: Invite[]; outgoing: Invite[] };

function UserRow({ user, children }: { user: PublicUser; children?: React.ReactNode }) {
  return (
    <div className="user-row">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" referrerPolicy="no-referrer" className="avatar" />
      ) : (
        <div className="avatar primary">{user.name.charAt(0).toUpperCase()}</div>
      )}
      <div className="user-info">
        <div className="user-name">{user.name}</div>
        <div className="user-email">{user.email}</div>
      </div>
      {children && <div className="user-actions">{children}</div>}
    </div>
  );
}

export default function PartnerPage() {
  const router = useRouter();
  const [state, setState] = useState<PartnerState | null>(null);
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{ user: PublicUser; alreadyLinked: boolean } | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    fetch('/api/partner').then(async res => {
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      setState(await res.json());
    });
  }, [router, reloadKey]);

  const run = async (request: () => Promise<Response>, successText?: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await request();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
        return null;
      }
      if (successText) setMessage({ type: 'success', text: successText });
      return data;
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối' });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchResult(null);
    const data = await run(() => fetch(`/api/partner/search?email=${encodeURIComponent(email.trim())}`));
    if (data) setSearchResult(data);
  };

  const sendInvite = async (targetEmail: string) => {
    const data = await run(
      () => fetch('/api/partner/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      }),
      'Đã gửi lời mời. Người kia cần đăng nhập và chấp nhận lời mời.'
    );
    if (data) {
      setSearchResult(null);
      setEmail('');
      reload();
    }
  };

  const respond = async (id: number, action: 'accept' | 'decline' | 'cancel') => {
    const data = await run(() => fetch(`/api/partner/invitations/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    }), action === 'accept' ? 'Liên kết thành công! Một sổ chi tiêu riêng đã được tạo.' : undefined);
    if (data) {
      reload();
      router.refresh();
    }
  };

  const openLedger = async (partnershipId: number) => {
    const data = await run(() => fetch('/api/partner/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: partnershipId }),
    }));
    if (data) {
      router.push('/');
      router.refresh();
    }
  };

  const unlink = async (partner: Partner) => {
    if (!confirm(`Hủy liên kết với ${partner.user.name}? Sổ chi tiêu của hai bạn vẫn được giữ lại và sẽ hiện lại nếu liên kết lại.`)) return;
    const data = await run(() => fetch(`/api/partner/links/${partner.partnershipId}`, { method: 'DELETE' }), 'Đã hủy liên kết.');
    if (data) {
      reload();
      router.refresh();
    }
  };

  if (!state) return <p className="loading">Đang tải...</p>;

  return (
    <div>
      <PageHeader title="Liên kết tài khoản" />

      {message && (
        <div className={`notice ${message.type === 'error' ? 'notice-error' : 'notice-success'}`}>
          {message.text}
        </div>
      )}

      <section className="card">
        <div className="card-title">Tài khoản của bạn</div>
        <UserRow user={state.me} />
      </section>

      {state.incoming.length > 0 && (
        <section className="card highlight">
          <div className="card-title">Lời mời liên kết gửi đến bạn</div>
          {state.incoming.map(invite => (
            <UserRow key={invite.id} user={invite.user}>
              <button onClick={() => respond(invite.id, 'accept')} disabled={busy} className="btn btn-primary btn-sm">Chấp nhận</button>
              <button onClick={() => respond(invite.id, 'decline')} disabled={busy} className="btn btn-secondary btn-sm">Từ chối</button>
            </UserRow>
          ))}
        </section>
      )}

      <section className="card">
        <div className="card-title">Sổ chi tiêu đang liên kết ({state.partners.length})</div>
        {state.partners.length === 0 ? (
          <p className="text-muted text-sm">Bạn chưa liên kết với ai. Hãy tìm tài khoản bên dưới để bắt đầu.</p>
        ) : (
          state.partners.map(partner => (
            <UserRow key={partner.partnershipId} user={partner.user}>
              <button onClick={() => openLedger(partner.partnershipId)} disabled={busy} className="btn btn-primary btn-sm">Mở sổ</button>
              <button onClick={() => unlink(partner)} disabled={busy} className="btn btn-danger-soft btn-sm">Hủy liên kết</button>
            </UserRow>
          ))
        )}
      </section>

      <section className="card">
        <div className="card-title">Liên kết với tài khoản Google khác</div>
        <p className="text-muted text-sm" style={{ marginBottom: '0.75rem' }}>
          Mỗi người bạn liên kết sẽ có một sổ chi tiêu riêng. Người đó cần đăng nhập ứng dụng ít nhất một lần.
        </p>
        <form onSubmit={handleSearch} className="inline-form">
          <input
            type="email"
            className="input"
            placeholder="VD: nguoithan@gmail.com"
            aria-label="Email tài khoản Google"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Tìm
          </button>
        </form>

        {searchResult && (
          <>
            <hr className="divider" />
            <UserRow user={searchResult.user}>
              {searchResult.alreadyLinked ? (
                <span className="badge">Đã liên kết</span>
              ) : (
                <button onClick={() => sendInvite(searchResult.user.email)} disabled={busy} className="btn btn-primary btn-sm">
                  Gửi lời mời
                </button>
              )}
            </UserRow>
          </>
        )}
      </section>

      {state.outgoing.length > 0 && (
        <section className="card">
          <div className="card-title">Lời mời đang chờ phản hồi</div>
          {state.outgoing.map(invite => (
            <UserRow key={invite.id} user={invite.user}>
              <button onClick={() => respond(invite.id, 'cancel')} disabled={busy} className="btn btn-secondary btn-sm">Hủy lời mời</button>
            </UserRow>
          ))}
        </section>
      )}
    </div>
  );
}
