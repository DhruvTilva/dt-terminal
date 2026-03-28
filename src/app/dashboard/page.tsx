'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/layout/Header'
import WatchlistPanel from '@/components/watchlist/WatchlistPanel'
import NewsFeed from '@/components/news/NewsFeed'
import NewsDetail from '@/components/news/NewsDetail'
import OpportunityCard from '@/components/dashboard/OpportunityCard'
import MarketPulse from '@/components/dashboard/MarketPulse'
import StockTable from '@/components/stocks/StockTable'
import { useMarketData } from '@/hooks/useMarketData'
import { useStore } from '@/store/useStore'
import GuestLoginPopup from '@/components/ui/GuestLoginPopup'

// ─── Status Bar ────────────────────────────────────────────────────────────
// Isolated component so the 1-second countdown doesn't re-render the full page

function StatusBar({ onRefresh }: { onRefresh: () => void }) {
  const { isRefreshing, lastUpdated, stocks, news } = useStore()
  const hasData = stocks.length > 0 || news.length > 0
  const [countdown, setCountdown] = useState(60)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (isRefreshing) {
      setCountdown(60)
    } else {
      timerRef.current = setInterval(() => {
        setCountdown(c => (c <= 1 ? 60 : c - 1))
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isRefreshing])

  // Compute elapsed since last update (updates every second via countdown)
  const elapsedSecs = lastUpdated
    ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
    : null
  const showJustNow = elapsedSecs !== null && elapsedSecs < 8

  const dotColor = !hasData ? '#F59E0B' : isRefreshing ? '#3B82F6' : '#22C55E'

  return (
    <div
      className="shrink-0 h-7 flex items-center px-4 gap-3 z-10"
      style={{ background: '#0B1220', borderTop: '1px solid #263042' }}
    >
      {/* Status dot */}
      <span
        className={`w-1.5 h-1.5 rounded-full ${!isRefreshing ? 'live-dot' : 'spin-dot'}`}
        style={{ background: dotColor }}
      />

      {/* Status label */}
      <span
        className="text-[9px] font-mono tracking-wide"
        style={{ color: isRefreshing ? '#3B82F6' : hasData ? '#22C55E' : '#F59E0B' }}
      >
        {!hasData ? 'CONNECTING…' : isRefreshing ? 'REFRESHING…' : 'LIVE · NSE / BSE'}
      </span>

      {hasData && (
        <>
          <span style={{ color: '#263042', fontSize: 9 }}>│</span>
          {isRefreshing ? (
            <span className="text-[9px] font-mono" style={{ color: '#6B7A90' }}>Fetching latest data…</span>
          ) : showJustNow ? (
            <span className="text-[9px] font-mono animate-fade" style={{ color: '#22C55E' }}>Updated just now</span>
          ) : (
            <span className="text-[9px] font-mono" style={{ color: '#6B7A90' }}>
              Auto refresh in {countdown}s
            </span>
          )}
        </>
      )}

      <div className="flex-1" />

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-1 text-[9px] font-mono transition-colors"
        style={{
          color: isRefreshing ? '#354558' : '#6B7A90',
          cursor: isRefreshing ? 'not-allowed' : 'pointer',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
          }}
        >
          ↻
        </span>
        {isRefreshing ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  )
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { refresh } = useMarketData()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', background: '#0B1220', overflow: 'hidden' }}
    >
      <Header />
      <GuestLoginPopup />

      {/* ── 3-column layout — fills all remaining height ── */}
      <div className="flex flex-1 min-h-0">

        {/* ════ LEFT: Watchlist ════ */}
        {/* Mobile: slide-over drawer */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 flex"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="w-64 h-full flex flex-col"
              style={{ background: '#121A2B', borderRight: '1px solid #263042' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 h-10 shrink-0" style={{ borderBottom: '1px solid #263042' }}>
                <span className="section-label">Watchlist</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-[11px] font-mono text-text-muted hover:text-text-primary"
                >✕</button>
              </div>
              <div className="flex-1 overflow-hidden">
                <WatchlistPanel />
              </div>
            </div>
            <div className="flex-1 bg-black/60" />
          </div>
        )}

        {/* Desktop: always-visible left panel */}
        <aside
          className="hidden lg:flex flex-col shrink-0"
          style={{ width: 220, background: '#121A2B', borderRight: '1px solid #263042' }}
        >
          <div className="shrink-0 h-10 flex items-center px-4" style={{ borderBottom: '1px solid #263042' }}>
            <span className="section-label">Watchlist</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <WatchlistPanel />
          </div>
        </aside>

        {/* ════ CENTER: News Feed ════ */}
        <main className="flex-1 min-w-0 flex flex-col" style={{ borderRight: '1px solid #263042' }}>
          {/* Mobile top bar */}
          <div
            className="lg:hidden shrink-0 h-10 flex items-center px-3 gap-2"
            style={{ borderBottom: '1px solid #263042', background: '#121A2B' }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-7 px-2.5 text-[10px] font-mono text-text-muted hover:text-text-primary transition-colors"
              style={{ border: '1px solid #263042' }}
            >
              ≡ Watchlist
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setRightOpen(true)}
              className="h-7 px-2.5 text-[10px] font-mono text-text-muted hover:text-text-primary transition-colors"
              style={{ border: '1px solid #263042' }}
            >
              Insights ▸
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MarketPulse />
            <OpportunityCard />
            <NewsFeed />
            <StockTable />
          </div>
        </main>

        {/* ════ RIGHT: Insights panel ════ */}
        {/* Mobile: slide-over drawer */}
        {rightOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 flex flex-row-reverse"
            onClick={() => setRightOpen(false)}
          >
            <div
              className="w-80 h-full flex flex-col"
              style={{ background: '#121A2B', borderLeft: '1px solid #263042' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 h-10 shrink-0" style={{ borderBottom: '1px solid #263042' }}>
                <span className="section-label">Insights</span>
                <button
                  onClick={() => setRightOpen(false)}
                  className="text-[11px] font-mono text-text-muted hover:text-text-primary"
                >✕</button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <NewsDetail />
              </div>
            </div>
            <div className="flex-1 bg-black/60" />
          </div>
        )}

        {/* Desktop: always-visible right panel */}
        <aside
          className="hidden lg:flex flex-col shrink-0"
          style={{ width: 300, background: '#121A2B', borderLeft: '1px solid #263042' }}
        >
          <div className="flex-1 min-h-0 overflow-hidden">
            <NewsDetail />
          </div>
        </aside>

      </div>

      {/* ── Status bar ── */}
      <StatusBar onRefresh={refresh} />
    </div>
  )
}
