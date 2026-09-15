import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
  denied: 'Bạn đã hủy đăng nhập với Google.',
  state: 'Phiên đăng nhập đã hết hạn, vui lòng thử lại.',
  token: 'Không xác thực được với Google, vui lòng thử lại.',
  email: 'Tài khoản Google này chưa xác minh email.',
  config: 'Máy chủ chưa cấu hình GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getCurrentUser()) redirect('/');

  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? 'Có lỗi xảy ra, vui lòng thử lại.' : '';

  return (
    <main className="container" style={{maxWidth: '400px', margin: '4rem auto'}}>
      <header className="text-center" style={{justifyContent: 'center'}}>
        <div>
          <h1 className="title">Chi Tiêu Chung</h1>
          <p className="subtitle mb-6">Đăng nhập để quản lý chi tiêu cùng người thân</p>
        </div>
      </header>

      <div className="card">
        {errorMessage && <div className="debt-negative mb-4 text-center">{errorMessage}</div>}
        {/* Thẻ <a> thường vì route này chuyển hướng sang Google */}
        <a href="/api/auth/google" className="btn btn-primary" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'}}>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
          </svg>
          Đăng nhập bằng Google
        </a>
      </div>
    </main>
  );
}
