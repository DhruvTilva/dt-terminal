import type { Metadata } from 'next'
import './globals.css'
import VisitorTracker from '@/components/VisitorTracker'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dt-terminal.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DT's Terminal — Free NSE/BSE Stock Scanner & AI Predictions",
    template: "%s | DT's Terminal",
  },
  description: "Free Indian stock market scanner. Find intraday & swing trade setups, AI-powered NSE/BSE predictions, live Nifty data, and trade signals — no subscription needed.",
  keywords: [
    'NSE stock scanner',
    'free intraday stocks India',
    'swing trade signals NSE',
    'best intraday stocks India',
    'stock scanner India free',
    'nifty 50 prediction',
    'AI stock prediction India',
    'trade finder NSE',
    'breakout stocks NSE today',
    'swing trade stocks today India',
    'BSE stock screener',
    'Indian stock market tool',
  ],
  authors: [{ name: "DT's Terminal" }],
  creator: "DT's Terminal",
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: "DT's Terminal",
    title: "DT's Terminal — Free NSE/BSE Stock Scanner & AI Predictions",
    description: "Free stock scanner for Indian traders. AI predictions, intraday signals, swing setups — NSE/BSE. No login required.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "DT's Terminal — Free NSE Stock Scanner",
    description: "Free stock scanner for Indian traders. AI predictions, intraday signals, swing setups — NSE/BSE.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full overflow-hidden">
        <VisitorTracker />
        {children}
      </body>
    </html>
  )
}
