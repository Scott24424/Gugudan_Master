import './globals.css'

export const metadata = {
  title: 'Math App',
  description: 'Fun math for kids',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-sky-50 text-slate-800 font-sans antialiased">{children}</body>
    </html>
  )
}
