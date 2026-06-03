import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quản Lý Chi Tiêu Chung',
  description: 'Ứng dụng quản lý chi tiêu chung 2 người',
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
      </body>
    </html>
  )
}
