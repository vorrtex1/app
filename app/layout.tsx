import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = { title: 'TradeRun — Local work, done right', description: 'Book trusted local tradespeople and manage jobs in one place.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html> }
