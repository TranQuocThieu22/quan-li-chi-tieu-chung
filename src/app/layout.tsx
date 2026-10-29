import type { Metadata, Viewport } from 'next'
import InstallPrompt from '@/components/InstallPrompt'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quản Lý Chi Tiêu Chung',
  description: 'Ứng dụng quản lý chi tiêu chung 2 người',
  applicationName: 'Chi Tiêu',
  appleWebApp: {
    capable: true,
    title: 'Chi Tiêu',
    statusBarStyle: 'black',
  },
}

export const viewport: Viewport = {
  themeColor: '#0b1120',
  // Cho phép dùng env(safe-area-inset-*) để né thanh home trên iPhone
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}
