'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeResult {
  id: string
  stock_symbol: string
  stock_name: string
  exchange: string
  strategy_type: string
  direction: 'bullish' | 'bearish'
  score: number
  match_info: string
  reason: string
  price: number
  change_percent: number
  rank: number
}

interface SessionInfo {
  scanDate: string
  status: string
  totalStocks: number
  processedStocks: number
  signalsFound: number
  completedAt: string | null
}

interface ResultsPayload {
  session: SessionInfo
  results: Record<string, TradeResult[]>
  totalSignals: number
  generatedAt: string | null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STRATEGIES = [
  { key: 'strict_morning',  label: 'Strict Morning',  color: '#3B82F6' },
  { key: 'general_morning', label: 'General Morning', color: '#8B5CF6' },
  { key: 'candle_pattern',  label: 'Candle Signals',  color: '#F59E0B' },
  { key: 'long_trend',      label: 'Long Trend',      color: '#22C55E' },
  { key: 'high_volatility', label: 'High Volatility', color: '#F97316' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtPrice(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtChange(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}

// ─── Components ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#9FB0C0'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
      color, background: `${color}18`, borderRadius: 4,
      padding: '2px 6px', letterSpacing: '0.03em',
    }}>{score}</span>
  )
}

function DirectionChip({ direction }: { direction: 'bullish' | 'bearish' }) {
  const isBull = direction === 'bullish'
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
      color: isBull ? '#22C55E' : '#F43F5E',
      background: isBull ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)',
      borderRadius: 4, padding: '2px 7px', textTransform: 'uppercase',
    }}>{isBull ? '▲ Bull' : '▼ Bear'}</span>
  )
}

function ResultRow({
  result, isExpanded, onToggle,
}: {
  result: TradeResult
  isExpanded: boolean
  onToggle: () => void
}) {
  const changeColor = result.change_percent >= 0 ? '#22C55E' : '#F43F5E'

  return (
    <div
      onClick={onToggle}
      style={{
        borderBottom: '1px solid #263042',
        cursor: 'pointer',
        background: isExpanded ? '#1B2C44' : 'transparent',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#18243A' }}
      onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 90px 1fr 80px 70px 52px 42px',
        alignItems: 'center', gap: 8, padding: '10px 16px',
      }}>
        {/* Rank */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#6B7A90', textAlign: 'right' }}>
          {result.rank}
        </span>
        {/* Symbol */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#E6EDF3' }}>
          {result.stock_symbol}
        </span>
        {/* Name + match info */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#9FB0C0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {result.stock_name}
          </div>
          <div style={{ fontSize: 11, color: '#6B7A90', marginTop: 1 }}>{result.match_info}</div>
        </div>
        {/* Price */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#E6EDF3', textAlign: 'right' }}>
          {fmtPrice(result.price)}
        </span>
        {/* Change % */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: changeColor, textAlign: 'right', fontWeight: 600 }}>
          {fmtChange(result.change_percent)}
        </span>
        {/* Direction */}
        <DirectionChip direction={result.direction} />
        {/* Score */}
        <ScoreBadge score={result.score} />
      </div>

      {/* Expanded reason */}
      {isExpanded && (
        <div style={{ padding: '0 16px 14px 136px', fontSize: 12, lineHeight: 1.6, color: '#9FB0C0' }}>
          {result.reason}
        </div>
      )}
    </div>
  )
}

function EmptyState({ scanAvailable }: { scanAvailable: boolean }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      {scanAvailable ? (
        <>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#E6EDF3', marginBottom: 6 }}>No signals for this filter</div>
          <div style={{ fontSize: 12, color: '#6B7A90' }}>Try a different strategy tab or direction filter</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, color: '#E6EDF3', marginBottom: 6 }}>No scan data available yet</div>
          <div style={{ fontSize: 12, color: '#6B7A90', maxWidth: 360, margin: '0 auto' }}>
            The daily scan runs automatically at 4:30 PM IST after market close.
            Results will appear here after the first scan completes.
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradeFinderPage() {
  const [data, setData]           = useState<ResultsPayload | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('strict_morning')
  const [direction, setDirection] = useState<'all' | 'bullish' | 'bearish'>('all')
  const [expanded, setExpanded]   = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/trade-finder/results?strategy=all&limit=100')
      if (res.status === 404) {
        setData(null)
      } else if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError((json as { error?: string }).error || `Error ${res.status}`)
      } else {
        setData(await res.json() as ResultsPayload)
      }
    } catch (e) {
      setError('Network error — could not fetch results')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchResults() }, [fetchResults])

  const allResults: TradeResult[] = data?.results?.[activeTab] ?? []
  const filtered = direction === 'all'
    ? allResults
    : allResults.filter(r => r.direction === direction)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0B1220' }}>

      {/* ── Shared Header (brand + nav + ticker) ───────────────────────────── */}
      <Header />

      {/* ── Sub-header (filters + scan info + strategy tabs) ───────────────── */}
      <div style={{
        background: '#121A2B', borderBottom: '1px solid #263042',
        padding: '10px 20px 0', flexShrink: 0,
      }}>
        {/* Filters row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>
            {data?.session ? 'Pre-computed daily scan results' : 'Awaiting first scan…'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Direction filter */}
            {(['all', 'bullish', 'bearish'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 5,
                  border: '1px solid',
                  borderColor: direction === d
                    ? (d === 'bullish' ? '#22C55E' : d === 'bearish' ? '#F43F5E' : '#3B82F6')
                    : '#263042',
                  background: direction === d
                    ? (d === 'bullish' ? 'rgba(34,197,94,0.15)' : d === 'bearish' ? 'rgba(244,63,94,0.15)' : 'rgba(59,130,246,0.15)')
                    : 'transparent',
                  color: direction === d
                    ? (d === 'bullish' ? '#22C55E' : d === 'bearish' ? '#F43F5E' : '#3B82F6')
                    : '#6B7A90',
                  cursor: 'pointer',
                }}
              >{d === 'bullish' ? '▲ Bullish' : d === 'bearish' ? '▼ Bearish' : 'All'}</button>
            ))}

            {/* Refresh */}
            <button
              onClick={fetchResults}
              disabled={loading}
              style={{
                fontSize: 12, padding: '4px 10px', borderRadius: 5,
                border: '1px solid #263042', background: 'transparent',
                color: loading ? '#354558' : '#9FB0C0', cursor: loading ? 'default' : 'pointer',
              }}
            >{loading ? '⟳' : '↺ Refresh'}</button>
          </div>
        </div>

        {/* Scan info bar */}
        {data?.session && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12,
            fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)',
            flexWrap: 'wrap',
          }}>
            <span>Scan date: <span style={{ color: '#9FB0C0' }}>{data.session.scanDate}</span></span>
            <span style={{ color: '#263042' }}>·</span>
            <span>Stocks scanned: <span style={{ color: '#9FB0C0' }}>{data.session.processedStocks.toLocaleString()}</span></span>
            <span style={{ color: '#263042' }}>·</span>
            <span>Total signals: <span style={{ color: '#9FB0C0' }}>{data.totalSignals}</span></span>
            <span style={{ color: '#263042' }}>·</span>
            <span>Generated: <span style={{ color: '#9FB0C0' }}>{fmtDate(data.session.completedAt)}</span></span>
          </div>
        )}

        {/* Strategy tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
          {STRATEGIES.map(s => {
            const count = data?.results?.[s.key]?.length ?? 0
            const isActive = activeTab === s.key
            return (
              <button
                key={s.key}
                onClick={() => { setActiveTab(s.key); setExpanded(null) }}
                style={{
                  padding: '8px 16px', fontSize: 12, fontWeight: 600,
                  borderRadius: '6px 6px 0 0', border: 'none',
                  background: isActive ? '#0B1220' : 'transparent',
                  color: isActive ? s.color : '#6B7A90',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  borderBottom: isActive ? `2px solid ${s.color}` : '2px solid transparent',
                }}
              >
                {s.label}
                {count > 0 && (
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 700,
                    color: isActive ? s.color : '#354558',
                    background: isActive ? `${s.color}1A` : '#1A2336',
                    borderRadius: 10, padding: '1px 6px',
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {loading && (
          <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#6B7A90' }}>
            Loading scan results…
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#F43F5E', marginBottom: 8 }}>{error}</div>
            <button onClick={fetchResults} style={{ fontSize: 12, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !data && <EmptyState scanAvailable={false} />}

        {!loading && !error && data && (
          <>
            {/* Column headers */}
            {filtered.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '28px 90px 1fr 80px 70px 52px 42px',
                gap: 8, padding: '8px 16px',
                borderBottom: '1px solid #1A2336',
                background: '#121A2B',
              }}>
                {['#', 'Symbol', 'Name / Signal', 'Price', 'Change', 'Dir', 'Score'].map((h, i) => (
                  <span key={i} style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: '#354558', fontFamily: 'var(--font-mono)',
                    textAlign: (i === 3 || i === 4) ? 'right' : 'left',
                  }}>{h}</span>
                ))}
              </div>
            )}

            {/* Rows */}
            {filtered.length === 0
              ? <EmptyState scanAvailable={true} />
              : filtered.map(result => (
                  <ResultRow
                    key={result.id}
                    result={result}
                    isExpanded={expanded === result.id}
                    onToggle={() => setExpanded(expanded === result.id ? null : result.id)}
                  />
                ))
            }

            {/* Footer */}
            {filtered.length > 0 && (
              <div style={{
                padding: '12px 16px',
                fontSize: 11, color: '#354558', fontFamily: 'var(--font-mono)',
                borderTop: '1px solid #1A2336', textAlign: 'center',
              }}>
                {filtered.length} signal{filtered.length !== 1 ? 's' : ''} shown
                {' · '}Based on last 3 trading sessions
                {' · '}Click any row to expand reason
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
