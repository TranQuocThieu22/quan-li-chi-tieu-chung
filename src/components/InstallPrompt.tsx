'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

// Sự kiện chỉ có trên Chrome/Edge/Android, chưa có trong lib.dom
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'install-prompt-dismissed-at';
const DISMISS_DAYS = 14;

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  const ua = navigator.userAgent;
  // iPadOS báo mình là Mac nhưng có màn cảm ứng
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// Không có gì để theo dõi, chỉ để đọc môi trường trình duyệt mà không lệch khi hydrate
const noopSubscribe = () => () => {};

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);
  // iOS không có sự kiện cài đặt, phải hướng dẫn thêm thủ công
  const showIOSHint = useSyncExternalStore(
    noopSubscribe,
    () => isIOS() && !isStandalone() && !recentlyDismissed(),
    () => false,
  );

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    }

    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setClosed(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setClosed(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setClosed(true);
  };

  const mode = closed ? 'hidden' : deferred ? 'native' : showIOSHint ? 'ios' : 'hidden';
  if (mode === 'hidden') return null;

  return (
    <div role="dialog" aria-label="Cài đặt ứng dụng" className="install-prompt">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" width={40} height={40} />
      <div className="install-prompt-text">
        <strong>Thêm vào màn hình chính</strong>
        {mode === 'native' ? (
          <div>Mở nhanh như app, không cần trình duyệt.</div>
        ) : (
          <div>
            Nhấn nút <strong>Chia sẻ</strong> <ShareIcon /> rồi chọn <strong>Thêm vào MH chính</strong>.
          </div>
        )}
      </div>
      {mode === 'native' && (
        <button type="button" className="btn btn-primary btn-sm" onClick={install}>
          Cài đặt
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Đóng" className="install-prompt-close">
        ×
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px' }} aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}
