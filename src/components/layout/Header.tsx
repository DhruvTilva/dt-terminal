'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DbNotification } from '@/types'

export default function Header() {
  const { indices, stocks, alerts, searchQuery, setSearchQuery, markAlertRead, isRefreshing } = useStore()
  const [showAlerts, setShowAlerts] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)       // true after auth check with no user
  const [showTradeToast, setShowTradeToast] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const alertsRef = useRef<HTMLDivElement>(null)

  // DB-backed notifications state
  const [dbNotifs, setDbNotifs] = useState<DbNotification[]>([])
  const [notifTab, setNotifTab] = useState<'notif' | 'live'>('notif')
  const lastFetchRef = useRef<number>(0)

  // Unread counts
  const liveUnread  = alerts.filter(a => !a.read).length
  const dbUnread    = dbNotifs.filter(n => !n.is_read).length
  const unread      = liveUnread + dbUnread
  const router = useRouter()
  const pathname = usePathname()

  // Fetch current user name from profiles table
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async (result: { data: { user: { id?: string; user_metadata?: { name?: string }; email?: string } | null } }) => {
      const user = result.data.user
      if (!user) { setIsGuest(true); return }
      // Try profiles table first, fall back to user_metadata
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      const name = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || null
      setUserName(name)
    })
  }, [])

  // Fetch DB notifications (only for logged-in users, with 5-min staleness guard)
  const fetchNotifications = useCallback(async (force = false) => {
    if (isGuest) return
    const now = Date.now()
    if (!force && now - lastFetchRef.current < 5 * 60 * 1000) return
    lastFetchRef.current = now
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setDbNotifs(data.notifications || [])
    } catch { /* silent — never break the UI */ }
  }, [isGuest])

  // Fetch on mount once user auth resolves
  useEffect(() => {
    if (!isGuest && userName !== null) fetchNotifications(true)
  }, [isGuest, userName, fetchNotifications])

  // Fetch when user opens the dropdown (if stale)
  const handleToggleAlerts = () => {
    setShowAlerts(v => {
      if (!v) fetchNotifications()
      return !v
    })
  }

  // Mark a single DB notification as read
  const markDbRead = async (id: string) => {
    setDbNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {})
  }

  // Mark all DB notifications as read
  const markAllDbRead = async () => {
    setDbNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {})
  }

  // Close user menu + mobile menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false)
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setShowAlerts(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleTradeFinderClick = () => {
    if (isGuest) {
      setShowTradeToast(true)
      setTimeout(() => setShowTradeToast(false), 2500)
      setTimeout(() => router.push('/login'), 800)
      return
    }
    router.push('/trade-finder')
  }

  const handleLogout = async () => {
    setShowUserMenu(false)
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
          <div className="flex items-center gap-0" style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
            <span style={{ color: '#E6EDF3' }}>DT&apos;s&nbsp;</span>
            <span style={{ color: '#3B82F6', fontWeight: 700 }}>Terminal</span>
          </div>
          <span className="hidden sm:block text-[9px] font-mono text-text-muted bg-bg-tertiary border border-border-primary px-1.5 py-0.5 tracking-wider">NSE · BSE</span>
        </div>

        <div className="hidden sm:block w-px h-5 bg-border-primary mx-1" />

        {/* Search */}
        <div className="hidden sm:flex items-center flex-1 max-w-md">
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
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="h-8 px-4 text-[11px] font-mono transition-colors flex items-center"
            style={{
              color: pathname === '/dashboard' ? '#E6EDF3' : '#6B7A90',
              borderBottom: pathname === '/dashboard' ? '2px solid #3B82F6' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            DASHBOARD
          </button>
          <button
            onClick={handleTradeFinderClick}
            className="h-8 px-4 text-[11px] font-mono transition-colors flex items-center gap-1.5"
            style={{
              color: isGuest
                ? 'rgba(107,122,144,0.65)'
                : pathname === '/trade-finder' ? '#E6EDF3' : '#6B7A90',
              borderBottom: (!isGuest && pathname === '/trade-finder') ? '2px solid #F97316' : '2px solid transparent',
              background: 'transparent',
              opacity: isGuest ? 0.75 : 1,
            }}
          >
            TRADE FINDER
            {isGuest && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )}
          </button>
        </div>

        <div className="flex-1" />

        {/* Mobile nav menu — sm:hidden so only appears on xs screens */}
        <div className="relative block sm:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setShowMobileMenu(v => !v)}
            className="flex items-center justify-center w-8 h-8 text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
            style={{ color: showMobileMenu ? '#E6EDF3' : '#6B7A90' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {showMobileMenu && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-bg-secondary border border-border-secondary z-50 animate-fade shadow-2xl overflow-hidden rounded-lg">
              <button
                onClick={() => { router.push('/dashboard'); setShowMobileMenu(false) }}
                className="w-full text-left px-4 py-3 text-[12px] font-mono transition-colors"
                style={{
                  color: pathname === '/dashboard' ? '#E6EDF3' : '#6B7A90',
                  background: pathname === '/dashboard' ? 'rgba(59,130,246,0.06)' : 'transparent',
                  borderLeft: pathname === '/dashboard' ? '2px solid #3B82F6' : '2px solid transparent',
                }}
              >
                DASHBOARD
              </button>
              <button
                onClick={() => {
                  setShowMobileMenu(false)
                  if (isGuest) {
                    setShowTradeToast(true)
                    setTimeout(() => setShowTradeToast(false), 2500)
                    setTimeout(() => router.push('/login'), 800)
                    return
                  }
                  router.push('/trade-finder')
                }}
                className="w-full text-left px-4 py-3 text-[12px] font-mono transition-colors flex items-center gap-2"
                style={{
                  color: isGuest ? 'rgba(107,122,144,0.65)' : pathname === '/trade-finder' ? '#E6EDF3' : '#6B7A90',
                  background: (!isGuest && pathname === '/trade-finder') ? 'rgba(249,115,22,0.06)' : 'transparent',
                  borderLeft: (!isGuest && pathname === '/trade-finder') ? '2px solid #F97316' : '2px solid transparent',
                }}
              >
                TRADE FINDER
                {isGuest && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                )}
              </button>
              <button
                onClick={() => { router.push('/creator'); setShowMobileMenu(false) }}
                className="w-full text-left px-4 py-3 text-[12px] font-mono transition-colors"
                style={{
                  color: pathname === '/creator' ? '#E6EDF3' : '#6B7A90',
                  background: pathname === '/creator' ? 'rgba(139,92,246,0.06)' : 'transparent',
                  borderLeft: pathname === '/creator' ? '2px solid #8B5CF6' : '2px solid transparent',
                }}
              >
                CREATOR
              </button>
            </div>
          )}
        </div>

        {/* Creator link */}
        <button
          onClick={() => router.push('/creator')}
          className="hidden sm:block h-8 px-3 text-[11px] font-mono transition-colors"
          style={{
            color: pathname === '/creator' ? '#E6EDF3' : '#4A5568',
            borderBottom: pathname === '/creator' ? '2px solid #8B5CF6' : '2px solid transparent',
            background: 'transparent',
          }}
        >
          CREATOR
        </button>

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
          {/* Alerts + Notifications */}
          <div className="relative flex items-center" ref={alertsRef}>
            <button
              onClick={handleToggleAlerts}
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
              <div className="absolute right-0 top-full w-84 bg-bg-secondary border border-border-secondary z-50 animate-fade shadow-2xl" style={{ width: 320 }}>

                {/* Header row */}
                <div className="px-3 py-2 border-b border-border-primary flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {/* Tab: Notifications */}
                    <button
                      onClick={() => setNotifTab('notif')}
                      className="text-[10px] font-mono px-2 py-1 transition-colors"
                      style={{
                        color: notifTab === 'notif' ? '#E6EDF3' : '#6B7A90',
                        borderBottom: notifTab === 'notif' ? '1px solid #3B82F6' : '1px solid transparent',
                      }}
                    >
                      INBOX {dbUnread > 0 && <span style={{ background: '#F43F5E', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 2, marginLeft: 3 }}>{dbUnread}</span>}
                    </button>
                    {/* Tab: Live */}
                    <button
                      onClick={() => setNotifTab('live')}
                      className="text-[10px] font-mono px-2 py-1 transition-colors"
                      style={{
                        color: notifTab === 'live' ? '#E6EDF3' : '#6B7A90',
                        borderBottom: notifTab === 'live' ? '1px solid #F97316' : '1px solid transparent',
                      }}
                    >
                      LIVE {liveUnread > 0 && <span style={{ background: '#F97316', color: '#fff', fontSize: 8, padding: '1px 4px', borderRadius: 2, marginLeft: 3 }}>{liveUnread}</span>}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {notifTab === 'notif' && dbUnread > 0 && (
                      <button
                        onClick={markAllDbRead}
                        className="text-[10px] font-mono text-text-muted hover:text-blue transition-colors"
                        style={{ color: '#3B82F6' }}
                      >
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowAlerts(false)} className="text-[10px] text-text-muted hover:text-text-primary font-mono">✕</button>
                  </div>
                </div>

                {/* ── INBOX TAB (DB notifications) ── */}
                {notifTab === 'notif' && (
                  <div className="max-h-72 overflow-y-auto">
                    {isGuest ? (
                      <div className="px-3 py-8 text-center text-[11px] font-mono text-text-muted">Sign in to see notifications</div>
                    ) : dbNotifs.length === 0 ? (
                      <div className="px-3 py-8 text-center text-[11px] font-mono text-text-muted">No notifications yet</div>
                    ) : dbNotifs.map(n => {
                      const icon = n.type === 'admin' ? '📣'
                        : n.category === 'bulk' ? '📊'
                        : n.category === 'insider' ? '🏢'
                        : n.category === 'promoter_selling' ? '⚠️'
                        : n.category === 'fii' ? '🏦'
                        : n.category === 'pump_dump' ? '🚨'
                        : n.category === 'weak_fundamentals' ? '📉'
                        : '🔔'

                      const timeAgo = (() => {
                        const diff = Date.now() - new Date(n.created_at).getTime()
                        const m = Math.floor(diff / 60000)
                        if (m < 1)  return 'just now'
                        if (m < 60) return `${m}m ago`
                        const h = Math.floor(m / 60)
                        if (h < 24) return `${h}h ago`
                        return `${Math.floor(h / 24)}d ago`
                      })()

                      return (
                        <button
                          key={n.id}
                          onClick={() => markDbRead(n.id)}
                          className={`w-full text-left px-3 py-2.5 border-b border-border-primary/40 hover:bg-bg-hover transition-colors flex items-start gap-2.5 ${!n.is_read ? 'bg-blue/5' : ''}`}
                        >
                          <span className="mt-0.5 text-[14px] shrink-0">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] text-text-primary leading-snug line-clamp-2">{n.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {n.stock_symbol && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5" style={{ background: 'rgba(59,130,246,0.12)', color: '#58a6ff', borderRadius: 3 }}>
                                  {n.stock_symbol}
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-text-muted">{timeAgo}</span>
                              {!n.is_read && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue shrink-0" style={{ background: '#3B82F6' }} />}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── LIVE TAB (existing Zustand alerts, untouched) ── */}
                {notifTab === 'live' && (
                  <div className="max-h-72 overflow-y-auto">
                    {alerts.length === 0
                      ? <div className="px-3 py-8 text-center text-[11px] font-mono text-text-muted">No live alerts yet</div>
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
                )}

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

          {/* User menu */}
          <div className="relative flex items-center" ref={userMenuRef}>
            {userName ? (
              <button
                onClick={() => setShowUserMenu(v => !v)}
                className="flex items-center gap-2 h-8 px-3 text-[11px] font-mono text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors rounded"
              >
                <span
                  className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
                  style={{ background: '#1E2E4A', color: '#3B82F6', border: '1px solid #263042' }}
                >
                  {userName.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[80px] truncate">
                  {userName}
                </span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="h-8 px-3 text-[11px] font-mono text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
              >
                SIGN IN
              </button>
            )}

            {showUserMenu && userName && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border-secondary rounded-lg z-50 animate-fade shadow-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-border-primary">
                  <p className="text-[12px] text-text-primary font-medium truncate">Hi, {userName}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-[12px] font-mono text-text-muted hover:text-red hover:bg-bg-hover transition-colors flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Finder locked toast */}
      {showTradeToast && (
        <div
          className="fixed z-[60] animate-fade"
          style={{
            top: 56,
            right: 16,
            background: '#1A2336',
            border: '1px solid rgba(249,115,22,0.35)',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: 260,
          }}
        >
          <div className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#F97316', lineHeight: 1.4 }}>
              Login required to access Trade Finder
            </p>
          </div>
        </div>
      )}

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
