'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { NIFTY_50_STOCKS } from '@/lib/stocks'

export default function WatchlistPanel() {
  const { watchlist, stocks, addToWatchlist, removeFromWatchlist } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const suggestions = NIFTY_50_STOCKS.filter(s =>
    !watchlist.some(w => w.symbol === s.symbol) &&
    (s.symbol.toLowerCase().includes(search.toLowerCase()) ||
     s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAdd = async (symbol: string, name: string) => {
    try {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name, exchange: 'NSE' }),
      })
    } catch {}
    addToWatchlist({ id: Date.now().toString(), userId: '', symbol, name, exchange: 'NSE', addedAt: new Date().toISOString() })
    setShowAdd(false)
    setSearch('')
  }

  const handleRemove = async (symbol: string) => {
    try { await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' }) } catch {}
    removeFromWatchlist(symbol)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Add toggle */}
      <button
        onClick={() => setShowAdd(v => !v)}
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

      {/* Search & suggestions */}
      {showAdd && (
        <div className="shrink-0" style={{ borderBottom: '1px solid #263042', background: '#121A2B' }}>
          <input
            autoFocus
            type="text"
            placeholder="Search symbol or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent focus:outline-none"
            style={{
              height: 38,
              padding: '0 16px',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: '#E6EDF3',
              borderBottom: '1px solid #263042',
            }}
          />
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {suggestions.slice(0, 8).map(s => (
              <button
                key={s.symbol}
                onClick={() => handleAdd(s.symbol, s.name)}
                className="w-full flex items-center justify-between hover:bg-bg-hover transition-colors"
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid rgba(38,48,66,0.5)',
                }}
              >
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#E6EDF3' }}>
                  {s.symbol}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
              </button>
            ))}
            {search.length > 0 && suggestions.length === 0 && (
              <div style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
                No matches
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watchlist rows */}
      <div className="flex-1 overflow-y-auto">
        {watchlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ height: 120, gap: 8 }}>
            <span style={{ fontSize: 24, opacity: 0.15 }}>◎</span>
            <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90', textAlign: 'center' }}>
              Watchlist is empty
            </p>
            <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90', opacity: 0.6 }}>
              Add stocks above to track
            </p>
          </div>
        ) : (
          watchlist.map(w => {
            const stock = stocks.find(s => s.symbol === w.symbol)
            const isGainer = stock && stock.changePercent > 0
            const isLoser  = stock && stock.changePercent < 0
            return (
              <div
                key={w.symbol}
                className="group flex items-center justify-between hover:bg-bg-hover transition-colors"
                style={{ padding: '10px 14px', borderBottom: '1px solid rgba(38,48,66,0.6)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: 6, height: 6,
                      background: isGainer ? '#22C55E' : isLoser ? '#F43F5E' : '#354558',
                    }}
                  />
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#E6EDF3' }}>
                    {w.symbol}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {stock ? (
                    <>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{stock.price.toFixed(0)}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        minWidth: 52,
                        textAlign: 'right',
                        color: isGainer ? '#22C55E' : isLoser ? '#F43F5E' : '#6B7A90',
                      }}>
                        {isGainer ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>—</span>
                  )}
                  <button
                    onClick={() => handleRemove(w.symbol)}
                    className="opacity-0 group-hover:opacity-100 transition-all hover:text-red"
                    style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90', marginLeft: 2, padding: '0 2px' }}
                  >✕</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
