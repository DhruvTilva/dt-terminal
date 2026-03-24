'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/Header'
import type { TradeFinderResult, TradeSignal } from '@/lib/trade-strategies'

// ─── Constants ────────────────────────────────────────────────────────────────

type TabId = 'strict_morning' | 'general_morning' | 'candle_patterns' | 'long_trend' | 'high_volatility'
type Filter = 'all' | 'bullish' | 'bearish' | 'high_confidence'

const TABS: { id: TabId; emoji: string; label: string; desc: string }[] = [
  { id: 'strict_morning',   emoji: '🎯', label: 'Strict Morning',   desc: '9:15–10:00 · all candles same direction · 5 days' },
  { id: 'general_morning',  emoji: '🌅', label: 'General Morning',  desc: '9:15–10:00 · net move direction · 5 of 7 days' },
  { id: 'candle_patterns',  emoji: '🕯️', label: 'Candle Signals',   desc: 'Last 3–5 candles · pattern detection' },
  { id: 'long_trend',       emoji: '📈', label: 'Long Trend',       desc: '20SMA > 50SMA · ≥1 month trend · entry suitability' },
  { id: 'high_volatility',  emoji: '⚡', label: 'High Volatility',  desc: '9:30–10:30 · ≥50pt range · 3/3 days' },
]

const STRATEGY_COLORS: Record<TabId, string> = {
  strict_morning:  '#8B5CF6',
  general_morning: '#3B82F6',
  candle_patterns: '#F59E0B',
  long_trend:      '#22C55E',
  high_volatility: '#F97316',
}

// ─── Helper Components ────────────────────────────────────────────────────────

function TimeAgo({ timestamp }: { timestamp: number }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    const update = () => {
      const secs = Math.floor((Date.now() - timestamp) / 1000)
      if (secs < 10) setLabel('Updated just now')
      else if (secs < 60) setLabel(`Updated ${secs}s ago`)
      else if (secs < 3600) setLabel(`Updated ${Math.floor(secs / 60)}m ago`)
      else setLabel(`Updated ${Math.floor(secs / 3600)}h ago`)
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [timestamp])

  return (
    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
      {label}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#9FB0C0'
  const bg = score >= 85 ? 'rgba(34,197,94,0.1)' : score >= 70 ? 'rgba(245,158,11,0.1)' : 'rgba(159,176,192,0.08)'
  return (
    <span style={{
      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
      color, background: bg, padding: '2px 6px', borderRadius: 2,
      border: `1px solid ${color}30`,
    }}>
      {score}
    </span>
  )
}

function DirectionBadge({ direction }: { direction: 'bullish' | 'bearish' }) {
  const isBull = direction === 'bullish'
  return (
    <span style={{
      fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
      color: isBull ? '#22C55E' : '#F43F5E',
      background: isBull ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)',
      padding: '2px 8px', borderRadius: 2,
      border: `1px solid ${isBull ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}`,
    }}>
      {isBull ? '▲ BULLISH' : '▼ BEARISH'}
    </span>
  )
}

function StrategyBadge({ strategyType, categoryLabel }: { strategyType: TabId; categoryLabel: string }) {
  const color = STRATEGY_COLORS[strategyType]
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em',
      color, background: `${color}18`, padding: '2px 6px', borderRadius: 2,
      border: `1px solid ${color}30`, whiteSpace: 'nowrap',
    }}>
      {categoryLabel.toUpperCase()}
    </span>
  )
}

// ─── Empty / Loading / Error States ──────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{
        display: 'inline-block', width: 28, height: 28, borderRadius: '50%',
        border: '2px solid #263042', borderTopColor: '#3B82F6',
        animation: 'spin 0.9s linear infinite', marginBottom: 16,
      }} />
      <p style={{ fontSize: 13, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
        Scanning NIFTY 100 stocks…
      </p>
      <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>
        Fetching intraday + daily data · Running 5 strategy engines
      </p>
      <p style={{ fontSize: 10, color: '#354558', fontFamily: 'var(--font-mono)', marginTop: 8 }}>
        First scan may take 30–60 seconds
      </p>
    </div>
  )
}

function EmptyState({ tabLabel, filter }: { tabLabel: string; filter: Filter }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>—</div>
      <p style={{ fontSize: 14, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
        No {tabLabel} signals found
      </p>
      <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>
        {filter !== 'all'
          ? `No stocks match the "${filter}" filter in this category. Try "All".`
          : 'No stocks met the strict criteria for this strategy. Quality over quantity.'}
      </p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#F43F5E', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
        {error}
      </p>
      <button
        onClick={onRetry}
        style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9FB0C0',
          background: '#1A2336', border: '1px solid #263042', padding: '6px 16px', cursor: 'pointer',
        }}
      >
        Retry Scan
      </button>
    </div>
  )
}

// ─── Trade Table ──────────────────────────────────────────────────────────────

function TradeTable({ signals }: { signals: TradeSignal[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #263042' }}>
            {['Stock', 'Price', 'Change %', 'Strategy', 'Direction', 'Score', 'Match', 'Reason'].map(h => (
              <th
                key={h}
                style={{
                  padding: '6px 12px', textAlign: 'left',
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase',
                  whiteSpace: 'nowrap', background: '#0B1220',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signals.map((s, idx) => (
            <tr
              key={s.id}
              style={{
                borderBottom: '1px solid #1A2336',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(26,35,54,0.4)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#18243A')}
              onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(26,35,54,0.4)')}
            >
              {/* Stock */}
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#E6EDF3' }}>
                  {s.symbol}
                </div>
                <div style={{ fontSize: 10, color: '#6B7A90', marginTop: 1 }}>
                  {s.stockName}
                </div>
              </td>

              {/* Price */}
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#E6EDF3', fontWeight: 600 }}>
                  ₹{s.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </td>

              {/* Change % */}
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: s.changePercent >= 0 ? '#22C55E' : '#F43F5E',
                }}>
                  {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                </span>
              </td>

              {/* Strategy */}
              <td style={{ padding: '10px 12px' }}>
                <StrategyBadge strategyType={s.strategyType as TabId} categoryLabel={s.categoryLabel} />
              </td>

              {/* Direction */}
              <td style={{ padding: '10px 12px' }}>
                <DirectionBadge direction={s.direction} />
              </td>

              {/* Score */}
              <td style={{ padding: '10px 12px' }}>
                <ScoreBadge score={s.score} />
              </td>

              {/* Match Info */}
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9FB0C0' }}>
                  {s.matchInfo}
                </span>
              </td>

              {/* Reason */}
              <td style={{ padding: '10px 12px', maxWidth: 420, minWidth: 220 }}>
                <p style={{
                  fontSize: 11, color: '#9FB0C0', lineHeight: 1.55,
                  display: '-webkit-box', WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  margin: 0,
                }}>
                  {s.reason}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradeFinderPage() {
  const [data, setData] = useState<TradeFinderResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('strict_morning')
  const [filter, setFilter] = useState<Filter>('all')
  const [lastFetch, setLastFetch] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/trade-finder')
      if (!res.ok) throw new Error(`Scan failed (${res.status})`)
      const json: TradeFinderResult = await res.json()
      setData(json)
      setLastFetch(Date.now())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    intervalRef.current = setInterval(fetchData, 5 * 60 * 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchData])

  const getSignals = (tab: TabId): TradeSignal[] => {
    if (!data) return []
    const all = data[tab] as TradeSignal[]
    return all.filter(s => {
      if (filter === 'bullish') return s.direction === 'bullish'
      if (filter === 'bearish') return s.direction === 'bearish'
      if (filter === 'high_confidence') return s.score >= 80
      return true
    })
  }

  const getCount = (tab: TabId) => (data ? (data[tab] as TradeSignal[]).length : 0)
  const signals = getSignals(activeTab)
  const activeColor = STRATEGY_COLORS[activeTab]

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0B1220' }}>
      <Header />

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* ── Page Header ── */}
        <div style={{ padding: '14px 20px 0', borderBottom: '1px solid #263042', background: '#0B1220' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 18, fontWeight: 800, color: '#E6EDF3',
                  fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px',
                }}>
                  Trade Finder
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                  color: '#3B82F6', background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.25)', padding: '2px 7px',
                  fontFamily: 'var(--font-mono)',
                }}>
                  SCANNER
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                {loading
                  ? 'Scanning NIFTY 100 stocks — fetching intraday + daily data…'
                  : `${data?.totalScanned ?? 0} stocks scanned · ${signals.length} match${signals.length !== 1 ? 'es' : ''} in this view`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2, flexShrink: 0 }}>
              {!loading && lastFetch > 0 && <TimeAgo timestamp={lastFetch} />}
              <button
                onClick={fetchData}
                disabled={loading}
                style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600,
                  color: loading ? '#354558' : '#9FB0C0',
                  background: 'transparent', border: '1px solid #263042',
                  padding: '4px 12px', cursor: loading ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.05em',
                }}
              >
                {loading ? '⟳ SCANNING…' : '↻ REFRESH'}
              </button>
            </div>
          </div>

          {/* ── Filters ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {(
              [
                { id: 'all' as Filter, label: 'ALL' },
                { id: 'bullish' as Filter, label: '▲ BULLISH' },
                { id: 'bearish' as Filter, label: '▼ BEARISH' },
                { id: 'high_confidence' as Filter, label: '★ HIGH CONFIDENCE (≥80)' },
              ] as { id: Filter; label: string }[]
            ).map(f => {
              const active = filter === f.id
              const fc = f.id === 'bullish' ? '#22C55E' : f.id === 'bearish' ? '#F43F5E' : '#3B82F6'
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    letterSpacing: '0.07em', padding: '3px 10px',
                    border: `1px solid ${active ? fc : '#263042'}`,
                    color: active ? fc : '#6B7A90',
                    background: active ? `${fc}18` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* ── Strategy Tabs ── */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 0 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const color = STRATEGY_COLORS[tab.id]
              const count = getCount(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.desc}
                  style={{
                    padding: '8px 14px', background: 'transparent', cursor: 'pointer',
                    borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 13 }}>{tab.emoji}</span>
                  <span style={{
                    fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: isActive ? '#E6EDF3' : '#6B7A90',
                  }}>
                    {tab.label.toUpperCase()}
                  </span>
                  {data !== null && (
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      padding: '1px 5px', borderRadius: 2,
                      background: isActive ? `${color}20` : '#1A2336',
                      color: isActive ? color : '#6B7A90',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Strategy Description ── */}
        {!loading && (
          <div style={{
            padding: '8px 20px',
            borderBottom: '1px solid #1A2336',
            background: '#121A2B',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{
              display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
              background: activeColor, flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
              {TABS.find(t => t.id === activeTab)?.desc}
            </span>
          </div>
        )}

        {/* ── Content Area ── */}
        <div style={{ padding: loading ? 0 : '0 0 40px' }}>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchData} />
          ) : signals.length === 0 ? (
            <EmptyState tabLabel={TABS.find(t => t.id === activeTab)?.label ?? ''} filter={filter} />
          ) : (
            <TradeTable signals={signals} />
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && data && (
          <div style={{
            padding: '10px 20px', borderTop: '1px solid #1A2336',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558' }}>
              NIFTY 100 UNIVERSE · NSE · AUTO-REFRESH 5 MIN · STRICT MATCH ONLY
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558' }}>
              Scanned {new Date(data.scannedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
