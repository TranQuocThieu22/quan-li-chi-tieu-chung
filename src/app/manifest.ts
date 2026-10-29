import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Quản Lý Chi Tiêu Chung',
    short_name: 'Chi Tiêu',
    description: 'Ứng dụng quản lý chi tiêu chung 2 người',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'vi',
    background_color: '#0b1120',
    theme_color: '#0b1120',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Nội dung icon nằm trong vùng an toàn nên dùng luôn cho icon dạng mask (Android)
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
