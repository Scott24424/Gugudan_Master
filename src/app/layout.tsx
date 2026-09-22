import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
  title: '신나는 구구단 마스터',
  description: '문제를 맞히고 몬스터를 키워보자!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-sky-50 text-slate-800 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
