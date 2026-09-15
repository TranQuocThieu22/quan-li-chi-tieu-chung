'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PublicUser = { id: number; name: string; email: string; image: string | null };
type Invite = { id: number; user: PublicUser; createdAt: string };
type PartnerState = { me: PublicUser; partner: PublicUser | null; incoming: Invite[]; outgoing: Invite[] };

function UserRow({ user, children }: { user: PublicUser; children?: React.ReactNode }) {
  return (
    <div className="flex-between" style={{ gap: '1rem', padding: '0.75rem 0', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        {user.image ? (
          <img src={user.image} alt="" referrerPolicy="no-referrer" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', overflowWrap: 'anywhere' }}>{user.email}</div>
        </div>
      </div>
      {children && <div style={{ display: 'flex', gap: '0.5rem' }}>{children}</div>}
    </div>
  );
}

const smallBtn = { width: 'auto', margin: 0, padding: '0.5rem 1rem' };

export default function PartnerPage() {
  const router = useRouter();
  const [state, setState] = useState<PartnerState | null>(null);
  const [email, setEmail] = useState('');
  const [searchResult, setSearchResult] = useState<{ user: PublicUser; isLinked: boolean } | null>(null);
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
    }), action === 'accept' ? 'Liên kết thành công!' : undefined);
    if (data) {
      reload();
      router.refresh();
    }
  };

  const unlink = async () => {
    if (!state?.partner) return;
    if (!confirm(`Hủy liên kết với ${state.partner.name}? Dữ liệu chi tiêu vẫn được giữ lại và sẽ hiện lại nếu hai bạn liên kết lại.`)) return;
    const data = await run(() => fetch('/api/partner', { method: 'DELETE' }), 'Đã hủy liên kết.');
    if (data) {
      reload();
      router.refresh();
    }
  };

  if (!state) return <p style={{ color: 'var(--text-secondary)' }}>Đang tải...</p>;

  return (
    <div>
      <h1 className="title" style={{ textAlign: 'left', marginBottom: '2rem' }}>Liên kết tài khoản</h1>

      {message && (
        <div className={`card ${message.type === 'error' ? 'debt-negative' : 'debt-positive'}`} style={{ padding: '1rem 1.5rem' }}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ padding: '2rem' }}>
        <h2 className="subtitle mb-4">Tài khoản của bạn</h2>
        <UserRow user={state.me} />
      </div>

      {state.partner ? (
        <div className="card" style={{ padding: '2rem' }}>
          <h2 className="subtitle mb-4">Đang quản lý chi tiêu chung với</h2>
          <UserRow user={state.partner}>
            <button onClick={unlink} disabled={busy} className="btn btn-secondary" style={{ ...smallBtn, color: 'var(--danger-color)' }}>
              Hủy liên kết
            </button>
          </UserRow>
          <Link href="/" className="btn btn-primary mt-4">Tới trang chi tiêu</Link>
        </div>
      ) : (
        <>
          {state.incoming.length > 0 && (
            <div className="card" style={{ padding: '2rem', border: '1px solid var(--primary-color)' }}>
              <h2 className="subtitle mb-4">Lời mời liên kết gửi đến bạn</h2>
              {state.incoming.map(invite => (
                <UserRow key={invite.id} user={invite.user}>
                  <button onClick={() => respond(invite.id, 'accept')} disabled={busy} className="btn btn-primary" style={smallBtn}>Chấp nhận</button>
                  <button onClick={() => respond(invite.id, 'decline')} disabled={busy} className="btn btn-secondary" style={smallBtn}>Từ chối</button>
                </UserRow>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: '2rem' }}>
            <h2 className="subtitle mb-4">Tìm tài khoản Google để liên kết</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Nhập email Google của người bạn muốn chia sẻ chi tiêu. Người đó cần đăng nhập ứng dụng ít nhất một lần.
            </p>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                type="email"
                className="input"
                placeholder="VD: nguoithan@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: '1 1 220px', margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" disabled={busy} style={{ ...smallBtn, padding: '0 2rem' }}>
                Tìm
              </button>
            </form>

            {searchResult && (
              <div className="mt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <UserRow user={searchResult.user}>
                  {searchResult.isLinked ? (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đã liên kết với người khác</span>
                  ) : (
                    <button onClick={() => sendInvite(searchResult.user.email)} disabled={busy} className="btn btn-primary" style={smallBtn}>
                      Gửi lời mời
                    </button>
                  )}
                </UserRow>
              </div>
            )}
          </div>

          {state.outgoing.length > 0 && (
            <div className="card" style={{ padding: '2rem' }}>
              <h2 className="subtitle mb-4">Lời mời đang chờ phản hồi</h2>
              {state.outgoing.map(invite => (
                <UserRow key={invite.id} user={invite.user}>
                  <button onClick={() => respond(invite.id, 'cancel')} disabled={busy} className="btn btn-secondary" style={smallBtn}>Hủy lời mời</button>
                </UserRow>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
