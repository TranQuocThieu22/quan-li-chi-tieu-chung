// Service worker tối giản để trình duyệt cho phép cài app ra màn hình chính.
// Không cache gì: dữ liệu chi tiêu luôn lấy mới từ server.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
