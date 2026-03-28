import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Live Market Dashboard',
  description: 'Real-time NSE/BSE market dashboard — Nifty 50 live data, stock watchlist, AI market pulse, top movers, and live market news.',
  openGraph: {
    title: 'Live Market Dashboard | DT\'s Terminal',
    description: 'Real-time NSE/BSE market dashboard — Nifty 50 live data, stock watchlist, AI market pulse, top movers, and live market news.',
    url: '/dashboard',
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
