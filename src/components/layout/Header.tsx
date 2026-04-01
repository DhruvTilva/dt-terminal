'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { DbNotification } from '@/types'
import PWAInstallButton from '@/components/PWAInstallButton'

export default function Header() {
  const { indices, stocks, searchQuery, setSearchQuery, isRefreshing } = useStore()
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
  const [notifTab, setNotifTab] = useState<'live' | 'inbox'>('live')
  const lastFetchRef = useRef<number>(0)

  // Split notifications by type
  const liveNotifs  = dbNotifs.filter(n => n.type === 'auto')
  const inboxNotifs = dbNotifs.filter(n => n.type === 'admin')

  // Unread counts
  const liveUnread  = liveNotifs.filter(n => !n.is_read).length
  const inboxUnread = inboxNotifs.filter(n => !n.is_read).length
  const unread      = liveUnread + inboxUnread
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
          {/* PWA Install button — mobile only, hidden when already installed */}
          <PWAInstallButton />

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
              <div className="absolute right-0 top-full bg-bg-secondary border border-border-secondary z-50 animate-fade shadow-2xl" style={{ width: 340, marginTop: 4, borderRadius: 8 }}>

                {/* Header row */}
                <div style={{ padding: '12px 14px 0 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Notifications</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {(notifTab === 'live' ? liveUnread : inboxUnread) > 0 && (
                        <button
                          onClick={markAllDbRead}
                          style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowAlerts(false)} style={{ fontSize: 13, color: '#6B7A90', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 2px' }}>✕</button>
                    </div>
                  </div>

                  {/* Tabs — LIVE first, then INBOX */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => setNotifTab('live')}
                      style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)', padding: '6px 12px',
                        background: notifTab === 'live' ? 'rgba(249,115,22,0.1)' : 'transparent',
                        border: notifTab === 'live' ? '1px solid rgba(249,115,22,0.25)' : '1px solid transparent',
                        color: notifTab === 'live' ? '#F97316' : '#6B7A90',
                        borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      LIVE
                      {liveUnread > 0 && (
                        <span style={{ background: '#F97316', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, lineHeight: '14px' }}>{liveUnread}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setNotifTab('inbox')}
                      style={{
                        fontSize: 11, fontFamily: 'var(--font-mono)', padding: '6px 12px',
                        background: notifTab === 'inbox' ? 'rgba(59,130,246,0.12)' : 'transparent',
                        border: notifTab === 'inbox' ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                        color: notifTab === 'inbox' ? '#58a6ff' : '#6B7A90',
                        borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s',
                      }}
                    >
                      INBOX
                      {inboxUnread > 0 && (
                        <span style={{ background: '#F43F5E', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, lineHeight: '14px' }}>{inboxUnread}</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#1E2A3B', margin: '10px 0 0 0' }} />

                {/* ── LIVE TAB (Smart Auto Alerts — type='auto') ── */}
                {notifTab === 'live' && (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {isGuest ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>Sign in to see alerts</div>
                    ) : liveNotifs.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>No alerts yet</div>
                    ) : liveNotifs.map(n => {
                      const icon = n.category === 'bulk' ? '📊'
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
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '12px 14px',
                            borderBottom: '1px solid #1E2A3B',
                            background: !n.is_read ? 'rgba(249,115,22,0.04)' : 'transparent',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = !n.is_read ? 'rgba(249,115,22,0.04)' : 'transparent')}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1, lineHeight: 1 }}>{icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, color: '#C9D1D9', lineHeight: 1.5, marginBottom: 5, wordBreak: 'break-word' }}>{n.message}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {n.stock_symbol && (
                                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', background: 'rgba(249,115,22,0.12)', color: '#F97316', borderRadius: 3, padding: '1px 6px' }}>
                                  {n.stock_symbol}
                                </span>
                              )}
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4A5568' }}>{timeAgo}</span>
                              {!n.is_read && (
                                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0, display: 'inline-block' }} />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* ── INBOX TAB (Admin manual notifications — type='admin') ── */}
                {notifTab === 'inbox' && (
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {isGuest ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>Sign in to see notifications</div>
                    ) : inboxNotifs.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>No messages yet</div>
                    ) : inboxNotifs.map(n => {
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
                          style={{
                            width: '100%', textAlign: 'left',
                            padding: '12px 14px',
                            borderBottom: '1px solid #1E2A3B',
                            background: !n.is_read ? 'rgba(59,130,246,0.04)' : 'transparent',
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = !n.is_read ? 'rgba(59,130,246,0.04)' : 'transparent')}
                        >
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1, lineHeight: 1 }}>📣</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, color: '#C9D1D9', lineHeight: 1.5, marginBottom: 5, wordBreak: 'break-word' }}>{n.message}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4A5568' }}>{timeAgo}</span>
                              {!n.is_read && (
                                <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', flexShrink: 0, display: 'inline-block' }} />
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Footer padding */}
                <div style={{ height: 6 }} />

              </div>
            )}
          </div>

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
              <div
                className="absolute right-0 top-full z-50 animate-fade"
                style={{
                  marginTop: 6,
                  width: 200,
                  background: '#121A2B',
                  border: '1px solid #1E2A3B',
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                }}
              >
                {/* Avatar + name row */}
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #1E2A3B', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 32, height: 32,
                      borderRadius: '50%',
                      background: '#1E2E4A',
                      border: '1px solid #263042',
                      color: '#3B82F6',
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userName}
                    </p>
                    <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#4A5568', marginTop: 1 }}>Admin</p>
                  </div>
                </div>

                {/* Sign out */}
                <div style={{ padding: '6px' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%', textAlign: 'left',
                      padding: '9px 12px',
                      borderRadius: 6,
                      fontSize: 12, fontFamily: 'var(--font-mono)',
                      color: '#6B7A90',
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#F43F5E' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6B7A90' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
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
