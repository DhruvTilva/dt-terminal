'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const { indices, stocks, alerts, searchQuery, setSearchQuery, markAlertRead, isRefreshing } = useStore()
  const [showAlerts, setShowAlerts] = useState(false)
  const unread = alerts.filter(a => !a.read).length
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    try { const s = createClient(); await s.auth.signOut() } catch {}
    router.push('/login')
  }

  const tickerItems = [
    ...indices.map(idx => ({ label: idx.name, value: idx.value, change: idx.changePercent, isIndex: true })),
    ...stocks
      .filter(s => Math.abs(s.changePercent) > 0.5)
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 16)
      .map(s => ({ label: s.symbol, value: s.price, change: s.changePercent, isIndex: false })),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border-primary" style={{ background: 'linear-gradient(180deg, #121A2B 0%, #0B1220 100%)' }}>
      {/* ── Top nav ── */}
      <div className="flex items-center h-12 px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Big live dot before brand name */}
          <span className="w-2.5 h-2.5 rounded-full live-dot shrink-0" style={{ background: '#22C55E' }} />
          <div className="flex items-baseline gap-0" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#E6EDF3' }}>DT&apos;s&nbsp;</span>
            <span style={{ color: '#3B82F6', fontWeight: 700 }}>Terminal</span>
          </div>
          <span className="hidden sm:block text-[9px] font-mono text-text-muted bg-bg-tertiary border border-border-primary px-1.5 py-0.5 tracking-wider">NSE · BSE</span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-border-primary mx-1" />

        {/* Search */}
        <div className="hidden sm:flex flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search stocks, news…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-bg-secondary border border-border-primary h-8 px-3 text-[12px] font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue/50 transition-colors"
            style={{ '--tw-shadow': '0 0 0 2px rgba(59,130,246,0.1)' } as React.CSSProperties}
          />
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-0 shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="h-8 px-3 text-[11px] font-mono transition-colors"
            style={{
              color: pathname === '/dashboard' ? '#E6EDF3' : '#6B7A90',
              borderBottom: pathname === '/dashboard' ? '2px solid #3B82F6' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => router.push('/trade-finder')}
            className="h-8 px-3 text-[11px] font-mono transition-colors"
            style={{
              color: pathname === '/trade-finder' ? '#E6EDF3' : '#6B7A90',
              borderBottom: pathname === '/trade-finder' ? '2px solid #F97316' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            TRADE FINDER
          </button>
        </div>

        <div className="flex-1" />

        {/* LIVE / Refreshing badge */}
        {isRefreshing ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3B82F6', animation: 'spin 0.9s linear infinite' }} />
            <span className="text-[9px] font-mono font-bold tracking-widest" style={{ color: '#3B82F6' }}>REFRESHING</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green/10 border border-green/20">
            <span className="w-2.5 h-2.5 rounded-full bg-green live-dot" />
            <span className="text-[9px] font-mono font-bold text-green tracking-widest">LIVE</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 ml-1">
          {/* Alerts */}
          <div className="relative">
            <button
              onClick={() => setShowAlerts(v => !v)}
              className={`flex items-center gap-1.5 h-8 px-3 text-[11px] font-mono transition-colors ${showAlerts ? 'text-text-primary bg-bg-hover' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'}`}
            >
              ALERTS
              {unread > 0 && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', background: '#F43F5E', color: '#fff', borderRadius: 3, lineHeight: '14px', fontFamily: 'var(--font-mono)' }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 top-full w-80 bg-bg-secondary border border-border-secondary z-50 animate-fade shadow-2xl">
                <div className="px-3 py-2 border-b border-border-primary flex items-center justify-between">
                  <span className="section-label">Alerts · {unread} unread</span>
                  <button onClick={() => setShowAlerts(false)} className="text-[10px] text-text-muted hover:text-text-primary font-mono">✕</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {alerts.length === 0
                    ? <div className="px-3 py-8 text-center text-[11px] font-mono text-text-muted">No alerts yet</div>
                    : alerts.slice(0, 10).map(a => (
                      <button key={a.id} onClick={() => markAlertRead(a.id)}
                        className={`w-full text-left px-3 py-2.5 border-b border-border-primary/40 hover:bg-bg-hover transition-colors flex items-start gap-2.5 ${!a.read ? 'bg-blue/5' : ''}`}
                      >
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.impact === 'high' ? 'bg-red' : a.impact === 'medium' ? 'bg-yellow' : 'bg-text-muted'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-text-primary truncate">{a.title}</p>
                          <p className="text-[10px] font-mono text-text-muted mt-0.5 line-clamp-2">{a.message}</p>
                        </div>
                      </button>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push('/dashboard?view=bookmarks')}
            className="hidden sm:block h-8 px-3 text-[11px] font-mono text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            SAVED
          </button>

          <div className="w-px h-5 bg-border-primary mx-1" />

          <button
            onClick={handleLogout}
            className="h-8 px-3 text-[11px] font-mono text-text-muted hover:text-red transition-colors"
          >
            EXIT
          </button>
        </div>
      </div>

      {/* ── Ticker ── */}
      <div className="h-6 border-t border-border-primary bg-bg-primary overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(90deg, #0B1220, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none" style={{ background: 'linear-gradient(270deg, #0B1220, transparent)' }} />

        {tickerItems.length > 0 ? (
          <div className="ticker-track inline-flex items-center h-full">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-4 text-[11px] font-mono tabular-nums whitespace-nowrap">
                <span className={`font-semibold ${item.isIndex ? 'text-yellow' : 'text-text-secondary'}`}>{item.label}</span>
                <span className="text-text-primary">
                  {item.isIndex
                    ? item.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })
                    : `₹${item.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </span>
                <span className={item.change >= 0 ? 'text-green' : 'text-red'}>
                  {item.change >= 0 ? '▲' : '▼'}{Math.abs(item.change).toFixed(2)}%
                </span>
                <span className="text-border-secondary opacity-40">│</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="flex items-center h-full px-4 gap-6">
            {[70, 100, 80, 90, 110, 70, 95].map((w, i) => <div key={i} className="skeleton h-2.5" style={{ width: w }} />)}
          </div>
        )}
      </div>
    </header>
  )
}
