'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '@/store/useStore'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Stock } from '@/types'

interface SearchResult {
  symbol: string
  name: string
  exchange: 'NSE' | 'BSE'
}

export default function WatchlistPanel() {
  const { watchlist, stocks, setWatchlist, addToWatchlist, removeFromWatchlist } = useStore()

  // Auth state — null means "checking"
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [loadingWatchlist, setLoadingWatchlist] = useState(true)

  // Search state
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  // UX state
  const [authMsg, setAuthMsg] = useState(false)
  const [addedSymbol, setAddedSymbol] = useState<string | null>(null)

  // Prices for watchlist items NOT in the main 30-stock store
  const [localPrices, setLocalPrices] = useState<Record<string, { price: number; changePercent: number }>>({})

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // ── Auth check + load watchlist from DB ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)

      if (user) {
        try {
          const res = await fetch('/api/watchlist')
          if (res.ok) {
            const data: Record<string, string>[] = await res.json()
            setWatchlist(
              data.map((item) => ({
                id: item.id,
                userId: item.user_id,
                symbol: item.symbol,
                name: item.name,
                exchange: (item.exchange as 'NSE' | 'BSE') || 'NSE',
                addedAt: item.created_at || item.added_at || new Date().toISOString(),
              }))
            )
          }
        } catch {}
      }
      setLoadingWatchlist(false)
    }
    init()
  }, [setWatchlist])

  // ── Fetch prices for symbols not in main stocks array ────────────────────
  const fetchMissingPrices = useCallback(async () => {
    const missing = watchlist
      .filter((w) => !stocks.find((s) => s.symbol === w.symbol))
      .map((w) => w.symbol)

    if (missing.length === 0) {
      setLocalPrices({})
      return
    }
    try {
      const res = await fetch(
        `/api/stocks?type=stocks&symbols=${missing.join(',')}`
      )
      if (res.ok) {
        const data: Stock[] = await res.json()
        const map: Record<string, { price: number; changePercent: number }> = {}
        data.forEach((s) => {
          map[s.symbol] = { price: s.price, changePercent: s.changePercent }
        })
        setLocalPrices(map)
      }
    } catch {}
  }, [watchlist, stocks])

  useEffect(() => {
    if (watchlist.length === 0) return
    fetchMissingPrices()
    const interval = setInterval(fetchMissingPrices, 60000)
    return () => clearInterval(interval)
  }, [fetchMissingPrices, watchlist.length])

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setResults([])
      setSearching(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/stocks/search?q=${encodeURIComponent(search.trim())}`
        )
        if (res.ok) {
          const data: SearchResult[] = await res.json()
          setResults(data.filter((r) => !watchlist.some((w) => w.symbol === r.symbol)))
        }
      } catch {
        setResults([])
      }
      setSearching(false)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, watchlist])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAddClick = () => {
    if (!isLoggedIn) {
      setAuthMsg(true)
      setTimeout(() => setAuthMsg(false), 3000)
      return
    }
    const next = !showAdd
    setShowAdd(next)
    if (!next) { setSearch(''); setResults([]) }
  }

  const handleAdd = async (symbol: string, name: string, exchange: 'NSE' | 'BSE') => {
    // Optimistic duplicate guard
    if (watchlist.some((w) => w.symbol === symbol)) return
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name, exchange }),
      })
      if (res.ok) {
        const data = await res.json()
        addToWatchlist({
          id: data.id,
          userId: data.user_id,
          symbol: data.symbol,
          name: data.name,
          exchange: data.exchange || 'NSE',
          addedAt: data.created_at || data.added_at || new Date().toISOString(),
        })
        setAddedSymbol(symbol)
        setTimeout(() => setAddedSymbol(null), 2000)
      }
    } catch {}
    setShowAdd(false)
    setSearch('')
    setResults([])
  }

  const handleRemove = async (symbol: string) => {
    removeFromWatchlist(symbol) // optimistic
    try {
      await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' })
    } catch {}
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Auth required message */}
      {authMsg && (
        <div
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 animate-fade"
          style={{
            background: 'rgba(244,63,94,0.08)',
            borderBottom: '1px solid rgba(244,63,94,0.25)',
          }}
        >
          <span style={{ fontSize: 10, color: '#F43F5E', fontFamily: 'var(--font-mono)' }}>
            ⚠ Login required to use Watchlist
          </span>
        </div>
      )}

      {/* Add Stock button */}
      <button
        onClick={handleAddClick}
        className="shrink-0 flex items-center justify-center gap-1.5 transition-colors"
        style={{
          height: 38,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          borderBottom: '1px solid #263042',
          color: showAdd ? '#F43F5E' : '#3B82F6',
          background: showAdd ? 'rgba(244,63,94,0.05)' : 'transparent',
        }}
      >
        {showAdd ? '✕ Cancel' : '+ Add Stock'}
      </button>

      {/* Search panel */}
      {showAdd && isLoggedIn && (
        <div
          className="shrink-0 animate-fade"
          style={{ borderBottom: '1px solid #263042', background: '#0D1626' }}
        >
          {/* Input row */}
          <div className="relative">
            <input
              autoFocus
              type="text"
              placeholder="Symbol or company name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent focus:outline-none"
              style={{
                height: 40,
                padding: '0 36px 0 14px',
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: '#E6EDF3',
                borderBottom: '1px solid #263042',
              }}
            />
            {searching ? (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  display: 'inline-block',
                  width: 11,
                  height: 11,
                  border: '2px solid #263042',
                  borderTopColor: '#3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            ) : (
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#354558', fontSize: 14, lineHeight: 1 }}
              >
                ⌕
              </span>
            )}
          </div>

          {/* Results dropdown */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {search.length === 0 ? (
              <div
                style={{
                  padding: '9px 14px',
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: '#354558',
                }}
              >
                Search NSE · BSE stocks
              </div>
            ) : !searching && results.length === 0 ? (
              <div
                style={{
                  padding: '9px 14px',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: '#6B7A90',
                }}
              >
                No results for &quot;{search}&quot;
              </div>
            ) : (
              results.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => handleAdd(r.symbol, r.name, r.exchange)}
                  className="w-full flex items-center justify-between hover:bg-bg-hover transition-colors"
                  style={{
                    padding: '8px 14px',
                    borderBottom: '1px solid rgba(38,48,66,0.4)',
                  }}
                >
                  <div className="min-w-0 text-left">
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#E6EDF3',
                        lineHeight: 1.3,
                      }}
                    >
                      {r.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: '#6B7A90',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 130,
                        lineHeight: 1.3,
                      }}
                    >
                      {r.name}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      color: '#6B7A90',
                      background: '#1A2336',
                      border: '1px solid #263042',
                      padding: '2px 5px',
                      borderRadius: 3,
                      flexShrink: 0,
                    }}
                  >
                    {r.exchange}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">

        {/* Auth check loading */}
        {isLoggedIn === null || loadingWatchlist ? (
          <div className="flex flex-col gap-2 p-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton rounded"
                style={{ height: 44 }}
              />
            ))}
          </div>

        ) : !isLoggedIn ? (
          /* Not signed in */
          <div
            className="flex flex-col items-center justify-center px-4 text-center"
            style={{ minHeight: 180, gap: 10 }}
          >
            <span style={{ fontSize: 32, opacity: 0.08 }}>◎</span>
            <p
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: '#6B7A90',
                lineHeight: 1.7,
              }}
            >
              Sign in to access<br />your watchlist
            </p>
            <button
              onClick={() => router.push('/login')}
              className="transition-colors"
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: '#3B82F6',
                padding: '5px 14px',
                border: '1px solid rgba(59,130,246,0.3)',
                borderRadius: 4,
                marginTop: 4,
                background: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59,130,246,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Sign In →
            </button>
          </div>

        ) : watchlist.length === 0 ? (
          /* Empty watchlist */
          <div
            className="flex flex-col items-center justify-center"
            style={{ height: 140, gap: 8 }}
          >
            <span style={{ fontSize: 28, opacity: 0.1 }}>◎</span>
            <p
              style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: '#6B7A90',
                textAlign: 'center',
              }}
            >
              Your watchlist is empty
            </p>
            <p
              style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: '#354558',
              }}
            >
              Add stocks to track prices
            </p>
          </div>

        ) : (
          /* Watchlist rows */
          watchlist.map((w) => {
            const mainStock = stocks.find((s) => s.symbol === w.symbol)
            const local = localPrices[w.symbol]
            const price = mainStock?.price ?? local?.price
            const changePercent = mainStock?.changePercent ?? local?.changePercent
            const isGainer = changePercent !== undefined && changePercent > 0
            const isLoser = changePercent !== undefined && changePercent < 0
            const isHighlight = addedSymbol === w.symbol

            return (
              <div
                key={w.symbol}
                className="group flex items-center justify-between hover:bg-bg-hover"
                style={{
                  padding: '9px 12px',
                  borderBottom: '1px solid rgba(38,48,66,0.6)',
                  background: isHighlight ? 'rgba(34,197,94,0.07)' : undefined,
                  transition: 'background 0.4s',
                }}
              >
                {/* Left: indicator dot + symbol + company name */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isGainer
                        ? '#22C55E'
                        : isLoser
                        ? '#F43F5E'
                        : '#354558',
                    }}
                  />
                  <div className="min-w-0">
                    <div
                      style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: '#E6EDF3',
                        lineHeight: 1.3,
                      }}
                    >
                      {w.symbol}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-mono)',
                        color: '#6B7A90',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 88,
                        lineHeight: 1.3,
                      }}
                    >
                      {w.name}
                    </div>
                  </div>
                </div>

                {/* Right: price block + remove button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-right">
                    {price !== undefined ? (
                      <>
                        <div
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-mono)',
                            color: '#E6EDF3',
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1.3,
                          }}
                        >
                          ₹{price.toLocaleString('en-IN', {
                            maximumFractionDigits: price < 100 ? 2 : 0,
                          })}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 600,
                            fontVariantNumeric: 'tabular-nums',
                            lineHeight: 1.3,
                            color: isGainer
                              ? '#22C55E'
                              : isLoser
                              ? '#F43F5E'
                              : '#6B7A90',
                          }}
                        >
                          {isGainer ? '+' : ''}
                          {changePercent!.toFixed(2)}%
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                          color: '#354558',
                          lineHeight: 2,
                        }}
                      >
                        —
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemove(w.symbol)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      fontSize: 11,
                      color: '#6B7A90',
                      padding: '2px 3px',
                      lineHeight: 1,
                      background: 'transparent',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#F43F5E'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6B7A90'
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
