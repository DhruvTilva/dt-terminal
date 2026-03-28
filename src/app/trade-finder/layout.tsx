import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Finder — Free NSE Stock Scanner',
  description: 'Scan NSE/BSE stocks for intraday and swing trade setups. Filter by breakout, momentum, RSI, volume spike and more — free stock screener for Indian traders.',
  openGraph: {
    title: 'Trade Finder — Free NSE Stock Scanner | DT\'s Terminal',
    description: 'Scan NSE/BSE stocks for intraday and swing trade setups. Filter by breakout, momentum, RSI — free stock screener India.',
    url: '/trade-finder',
  },
}

export default function TradeFinderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
