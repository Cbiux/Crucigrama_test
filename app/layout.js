import { Bebas_Neue, Space_Mono, DM_Sans } from 'next/font/google'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
})

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space',
})

const dmSans = DM_Sans({
  weight: ['300', '400', '600'],
  subsets: ['latin'],
  variable: '--font-dm',
})

export const metadata = {
  title: 'Cruci Stellar',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${spaceMono.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  )
}
