'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/Header'
import type { TradeFinderResult, TradeSignal } from '@/lib/trade-strategies'
import { SEGMENT_META, getSegmentStocks } from '@/lib/full-scan-universe'
import type { FullScanSegment } from '@/lib/full-scan-universe'
import { BATCH_SIZE } from '@/app/api/trade-finder/batch/route'

// ─── Types & Constants ────────────────────────────────────────────────────────

type TabId = 'strict_morning' | 'general_morning' | 'candle_patterns' | 'long_trend' | 'high_volatility'
type Filter = 'all' | 'bullish' | 'bearish' | 'high_confidence'
type ScanStatus = 'idle' | 'running' | 'stopped' | 'completed'

const TABS: { id: TabId; emoji: string; label: string; desc: string }[] = [
  { id: 'strict_morning',  emoji: '🎯', label: 'Strict Morning',  desc: '9:15–10:00 · all candles same direction · 5 days' },
  { id: 'general_morning', emoji: '🌅', label: 'General Morning', desc: '9:15–10:00 · net move direction · 5 of 7 days' },
  { id: 'candle_patterns', emoji: '🕯️', label: 'Candle Signals',  desc: 'Last 3–5 candles · pattern detection' },
  { id: 'long_trend',      emoji: '📈', label: 'Long Trend',      desc: '20SMA > 50SMA · ≥1 month trend · entry suitability' },
  { id: 'high_volatility', emoji: '⚡', label: 'High Volatility', desc: '9:30–10:30 · ≥50pt range · 3/3 days' },
]

const STRATEGY_COLORS: Record<TabId, string> = {
  strict_morning:  '#8B5CF6',
  general_morning: '#3B82F6',
  candle_patterns: '#F59E0B',
  long_trend:      '#22C55E',
  high_volatility: '#F97316',
}

const EMPTY_RESULT: TradeFinderResult = {
  strict_morning: [], general_morning: [], candle_patterns: [],
  long_trend: [], high_volatility: [], scannedAt: '', totalScanned: 0,
}

// ─── Merge helper ─────────────────────────────────────────────────────────────

function mergeResults(base: TradeFinderResult, patch: TradeFinderResult): TradeFinderResult {
  const dedup = <T extends { id: string }>(a: T[], b: T[]): T[] => {
    const ids = new Set(a.map(x => x.id))
    return [...a, ...b.filter(x => !ids.has(x.id))].sort((x: any, y: any) => y.score - x.score)
  }
  return {
    strict_morning:  dedup(base.strict_morning,  patch.strict_morning),
    general_morning: dedup(base.general_morning, patch.general_morning),
    candle_patterns: dedup(base.candle_patterns, patch.candle_patterns),
    long_trend:      dedup(base.long_trend,      patch.long_trend),
    high_volatility: dedup(base.high_volatility, patch.high_volatility),
    scannedAt:       new Date().toISOString(),
    totalScanned:    base.totalScanned + patch.totalScanned,
  }
}

function countSignals(r: TradeFinderResult): number {
  return r.strict_morning.length + r.general_morning.length +
    r.candle_patterns.length + r.long_trend.length + r.high_volatility.length
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TimeAgo({ timestamp }: { timestamp: number }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const update = () => {
      const s = Math.floor((Date.now() - timestamp) / 1000)
      if (s < 10) setLabel('Updated just now')
      else if (s < 60) setLabel(`Updated ${s}s ago`)
      else if (s < 3600) setLabel(`Updated ${Math.floor(s / 60)}m ago`)
      else setLabel(`Updated ${Math.floor(s / 3600)}h ago`)
    }
    update()
    const id = setInterval(update, 5000)
    return () => clearInterval(id)
  }, [timestamp])
  return <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>{label}</span>
}

function ScoreBadge({ score }: { score: number }) {
  const c = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#9FB0C0'
  const bg = score >= 85 ? 'rgba(34,197,94,0.1)' : score >= 70 ? 'rgba(245,158,11,0.1)' : 'rgba(159,176,192,0.08)'
  return (
    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: c, background: bg, padding: '2px 6px', borderRadius: 2, border: `1px solid ${c}30` }}>
      {score}
    </span>
  )
}

function DirectionBadge({ direction }: { direction: 'bullish' | 'bearish' }) {
  const bull = direction === 'bullish'
  return (
    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: bull ? '#22C55E' : '#F43F5E', background: bull ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)', padding: '2px 8px', borderRadius: 2, border: `1px solid ${bull ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)'}` }}>
      {bull ? '▲ BULLISH' : '▼ BEARISH'}
    </span>
  )
}

function StrategyBadge({ strategyType, categoryLabel }: { strategyType: TabId; categoryLabel: string }) {
  const c = STRATEGY_COLORS[strategyType]
  return (
    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em', color: c, background: `${c}18`, padding: '2px 6px', borderRadius: 2, border: `1px solid ${c}30`, whiteSpace: 'nowrap' }}>
      {categoryLabel.toUpperCase()}
    </span>
  )
}

function LoadingState() {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', width: 28, height: 28, borderRadius: '50%', border: '2px solid #263042', borderTopColor: '#3B82F6', animation: 'spin 0.9s linear infinite', marginBottom: 16 }} />
      <p style={{ fontSize: 13, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>Scanning NIFTY 100 stocks…</p>
      <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>Fetching intraday + daily data · Running 5 strategy engines</p>
      <p style={{ fontSize: 10, color: '#354558', fontFamily: 'var(--font-mono)', marginTop: 8 }}>First scan may take 30–60 seconds</p>
    </div>
  )
}

function EmptyState({ tabLabel, filter }: { tabLabel: string; filter: Filter }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12, color: '#354558' }}>—</div>
      <p style={{ fontSize: 14, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>No {tabLabel} signals found</p>
      <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>
        {filter !== 'all' ? `No stocks match the "${filter}" filter. Try "All".` : 'No stocks met the strict criteria. Quality over quantity.'}
      </p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#F43F5E', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>{error}</p>
      <button onClick={onRetry} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#9FB0C0', background: '#1A2336', border: '1px solid #263042', padding: '6px 16px', cursor: 'pointer' }}>
        Retry Scan
      </button>
    </div>
  )
}

function TradeTable({ signals }: { signals: TradeSignal[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #263042' }}>
            {['Stock', 'Price', 'Change %', 'Strategy', 'Direction', 'Score', 'Match', 'Reason'].map(h => (
              <th key={h} style={{ padding: '6px 12px', textAlign: 'left', fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', background: '#0B1220' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {signals.map((s, idx) => (
            <tr
              key={s.id}
              style={{ borderBottom: '1px solid #1A2336', background: idx % 2 === 0 ? 'transparent' : 'rgba(26,35,54,0.4)', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#18243A')}
              onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(26,35,54,0.4)')}
            >
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#E6EDF3' }}>{s.symbol}</div>
                <div style={{ fontSize: 10, color: '#6B7A90', marginTop: 1 }}>{s.stockName}</div>
              </td>
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: '#E6EDF3', fontWeight: 600 }}>
                  ₹{s.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
              </td>
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: s.changePercent >= 0 ? '#22C55E' : '#F43F5E' }}>
                  {s.changePercent >= 0 ? '+' : ''}{s.changePercent.toFixed(2)}%
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}><StrategyBadge strategyType={s.strategyType as TabId} categoryLabel={s.categoryLabel} /></td>
              <td style={{ padding: '10px 12px' }}><DirectionBadge direction={s.direction} /></td>
              <td style={{ padding: '10px 12px' }}><ScoreBadge score={s.score} /></td>
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9FB0C0' }}>{s.matchInfo}</span>
              </td>
              <td style={{ padding: '10px 12px', maxWidth: 420, minWidth: 220 }}>
                <p style={{ fontSize: 11, color: '#9FB0C0', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  status, segment, processedCount, totalStocks, matchesFound, onStop, onRestart,
}: {
  status: ScanStatus; segment: FullScanSegment; processedCount: number
  totalStocks: number; matchesFound: number; onStop: () => void; onRestart: () => void
}) {
  if (status === 'idle') return null

  const pct = totalStocks > 0 ? Math.min(100, Math.round((processedCount / totalStocks) * 100)) : 0
  const meta = SEGMENT_META[segment]

  const statusColor = status === 'running' ? '#F59E0B' : status === 'completed' ? '#22C55E' : '#F43F5E'
  const statusDot = status === 'running' ? '🟡' : status === 'completed' ? '🟢' : '🔴'
  const statusLabel = status === 'running' ? `Scanning ${meta.label}…` : status === 'completed' ? 'Scan Completed' : 'Scan Stopped'

  return (
    <div style={{ padding: '10px 20px', background: '#121A2B', borderBottom: '1px solid #263042' }}>
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11 }}>{statusDot}</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: statusColor, letterSpacing: '0.05em' }}>
            {statusLabel}
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
            {processedCount} / {totalStocks} stocks scanned
          </span>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#9FB0C0' }}>
            · {matchesFound} signal{matchesFound !== 1 ? 's' : ''} found
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {status === 'running' && (
            <button
              onClick={onStop}
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F43F5E', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', padding: '3px 12px', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              ■ STOP SCAN
            </button>
          )}
          {(status === 'stopped' || status === 'completed') && (
            <button
              onClick={onRestart}
              style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '3px 12px', cursor: 'pointer', letterSpacing: '0.05em' }}
            >
              ↺ RE-SCAN
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#1A2336', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            height: '100%', background: statusColor, borderRadius: 2,
            width: `${pct}%`,
            transition: status === 'running' ? 'width 0.4s ease' : 'none',
            boxShadow: status === 'running' ? `0 0 8px ${statusColor}60` : 'none',
          }}
        />
      </div>

      {/* Stop message */}
      {status === 'stopped' && (
        <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#F43F5E' }}>
          Scan stopped at {processedCount} / {totalStocks} stocks. Results shown are from completed batches.
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradeFinderPage() {
  // Default scan state
  const [data, setData] = useState<TradeFinderResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Tab + filter
  const [activeTab, setActiveTab] = useState<TabId>('strict_morning')
  const [filter, setFilter] = useState<Filter>('all')

  // Full scan state
  const [fullScanStatus, setFullScanStatus] = useState<ScanStatus>('idle')
  const [fullScanSegment, setFullScanSegment] = useState<FullScanSegment>('large')
  const [fullScanData, setFullScanData] = useState<TradeFinderResult>(EMPTY_RESULT)
  const [processedCount, setProcessedCount] = useState(0)
  const [totalStocksInScan, setTotalStocksInScan] = useState(0)

  // Refs
  const defaultIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const sessionIdRef = useRef<string>('')

  // ── Default scan ──────────────────────────────────────────────────────────

  const fetchDefaultData = useCallback(async () => {
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
    fetchDefaultData()
    defaultIntervalRef.current = setInterval(fetchDefaultData, 5 * 60 * 1000)
    return () => { if (defaultIntervalRef.current) clearInterval(defaultIntervalRef.current) }
  }, [fetchDefaultData])

  // ── Full scan ─────────────────────────────────────────────────────────────

  const stopFullScan = useCallback(() => {
    abortControllerRef.current?.abort()
    setFullScanStatus(prev => prev === 'running' ? 'stopped' : prev)
  }, [])

  const startFullScan = useCallback(async (segment: FullScanSegment) => {
    // Abort any previous scan
    abortControllerRef.current?.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller
    const sessionId = `${segment}-${Date.now()}`
    sessionIdRef.current = sessionId

    const stocks = getSegmentStocks(segment)
    const total = stocks.length
    const totalBatches = Math.ceil(total / BATCH_SIZE)

    setFullScanStatus('running')
    setFullScanData(EMPTY_RESULT)
    setProcessedCount(0)
    setTotalStocksInScan(total)

    let accumulated: TradeFinderResult = EMPTY_RESULT

    for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
      if (controller.signal.aborted) break

      try {
        const res = await fetch('/api/trade-finder/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ segment, batchIndex: batchIdx, sessionId }),
          signal: controller.signal,
        })

        if (!res.ok) continue

        const batchResult: TradeFinderResult = await res.json()
        accumulated = mergeResults(accumulated, batchResult)

        const scanned = Math.min(total, (batchIdx + 1) * BATCH_SIZE)
        setProcessedCount(scanned)
        setFullScanData({ ...accumulated }) // trigger re-render with live results

      } catch (e: any) {
        if (e?.name === 'AbortError') break
        // Network error on batch — continue to next
        const scanned = Math.min(total, (batchIdx + 1) * BATCH_SIZE)
        setProcessedCount(scanned)
      }
    }

    if (!controller.signal.aborted) {
      setFullScanStatus('completed')
      setProcessedCount(total)
    }
  }, [])

  const restartFullScan = useCallback(() => {
    startFullScan(fullScanSegment)
  }, [fullScanSegment, startFullScan])

  // ── Display data: merge default + full scan ────────────────────────────────

  const displayData: TradeFinderResult | null = (() => {
    if (!data && fullScanStatus === 'idle') return null
    const base = data ?? EMPTY_RESULT
    if (fullScanStatus === 'idle') return base
    return mergeResults(base, fullScanData)
  })()

  const getSignals = (tab: TabId): TradeSignal[] => {
    if (!displayData) return []
    return (displayData[tab] as TradeSignal[]).filter(s => {
      if (filter === 'bullish') return s.direction === 'bullish'
      if (filter === 'bearish') return s.direction === 'bearish'
      if (filter === 'high_confidence') return s.score >= 80
      return true
    })
  }

  const getCount = (tab: TabId) => displayData ? (displayData[tab] as TradeSignal[]).length : 0
  const signals = getSignals(activeTab)
  const activeColor = STRATEGY_COLORS[activeTab]
  const matchesFound = displayData ? countSignals(fullScanData) : 0

  // ─────────────────────────────────────────────────────────────────────────

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
                <span style={{ fontSize: 18, fontWeight: 800, color: '#E6EDF3', fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px' }}>
                  Trade Finder
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#3B82F6', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', padding: '2px 7px', fontFamily: 'var(--font-mono)' }}>
                  SCANNER
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                {loading
                  ? 'Scanning NIFTY 100 stocks — fetching intraday + daily data…'
                  : `${displayData?.totalScanned ?? 0} stocks scanned · ${signals.length} match${signals.length !== 1 ? 'es' : ''} in this view`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2, flexShrink: 0 }}>
              {!loading && lastFetch > 0 && <TimeAgo timestamp={lastFetch} />}
              <button
                onClick={fetchDefaultData}
                disabled={loading}
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 600, color: loading ? '#354558' : '#9FB0C0', background: 'transparent', border: '1px solid #263042', padding: '4px 12px', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.05em' }}
              >
                {loading ? '⟳ SCANNING…' : '↻ REFRESH'}
              </button>
            </div>
          </div>

          {/* ── Filters + Full Scan controls ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>

            {/* Filter buttons */}
            {(['all', 'bullish', 'bearish', 'high_confidence'] as Filter[]).map(f => {
              const active = filter === f
              const fc = f === 'bullish' ? '#22C55E' : f === 'bearish' ? '#F43F5E' : '#3B82F6'
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.07em', padding: '3px 10px', border: `1px solid ${active ? fc : '#263042'}`, color: active ? fc : '#6B7A90', background: active ? `${fc}18` : 'transparent', cursor: 'pointer' }}
                >
                  {f === 'all' ? 'ALL' : f === 'bullish' ? '▲ BULLISH' : f === 'bearish' ? '▼ BEARISH' : '★ HIGH CONFIDENCE'}
                </button>
              )
            })}

            {/* Divider */}
            <div style={{ width: 1, height: 18, background: '#263042', margin: '0 4px' }} />

            {/* Segment selector */}
            {(['large', 'mid', 'small'] as FullScanSegment[]).map(seg => {
              const m = SEGMENT_META[seg]
              const active = fullScanSegment === seg
              return (
                <button
                  key={seg}
                  onClick={() => setFullScanSegment(seg)}
                  disabled={fullScanStatus === 'running'}
                  style={{
                    fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.05em',
                    padding: '3px 10px', cursor: fullScanStatus === 'running' ? 'not-allowed' : 'pointer',
                    border: `1px solid ${active ? m.color : '#263042'}`,
                    color: active ? m.color : '#6B7A90',
                    background: active ? `${m.color}15` : 'transparent',
                  }}
                >
                  {m.label.toUpperCase()}
                  <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.7 }}>~{m.approxCount}</span>
                </button>
              )
            })}

            {/* Full Scan / Stop button */}
            {fullScanStatus !== 'running' ? (
              <button
                onClick={() => startFullScan(fullScanSegment)}
                disabled={loading}
                style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.07em',
                  padding: '4px 14px', cursor: loading ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(247,159,22,0.5)',
                  color: loading ? '#354558' : '#F97316',
                  background: loading ? 'transparent' : 'rgba(249,115,22,0.1)',
                }}
              >
                ⚡ FULL SCAN
              </button>
            ) : (
              <button
                onClick={stopFullScan}
                style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.07em', padding: '4px 14px', cursor: 'pointer', border: '1px solid rgba(244,63,94,0.5)', color: '#F43F5E', background: 'rgba(244,63,94,0.1)' }}
              >
                ■ STOP
              </button>
            )}
          </div>

          {/* ── Strategy Tabs ── */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const color = STRATEGY_COLORS[tab.id]
              const count = getCount(tab.id)
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.desc}
                  style={{ padding: '8px 14px', background: 'transparent', cursor: 'pointer', borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  <span style={{ fontSize: 13 }}>{tab.emoji}</span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: isActive ? '#E6EDF3' : '#6B7A90' }}>
                    {tab.label.toUpperCase()}
                  </span>
                  {displayData !== null && (
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '1px 5px', borderRadius: 2, background: isActive ? `${color}20` : '#1A2336', color: isActive ? color : '#6B7A90' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Progress Bar (Full Scan) ── */}
        <ProgressBar
          status={fullScanStatus}
          segment={fullScanSegment}
          processedCount={processedCount}
          totalStocks={totalStocksInScan}
          matchesFound={matchesFound}
          onStop={stopFullScan}
          onRestart={restartFullScan}
        />

        {/* ── Strategy description ── */}
        {!loading && (
          <div style={{ padding: '8px 20px', borderBottom: '1px solid #1A2336', background: '#121A2B', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: activeColor, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
              {TABS.find(t => t.id === activeTab)?.desc}
            </span>
          </div>
        )}

        {/* ── Content area ── */}
        <div>
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchDefaultData} />
          ) : signals.length === 0 ? (
            <EmptyState tabLabel={TABS.find(t => t.id === activeTab)?.label ?? ''} filter={filter} />
          ) : (
            <TradeTable signals={signals} />
          )}
        </div>

        {/* ── Footer ── */}
        {!loading && !error && displayData && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #1A2336', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558' }}>
              NIFTY 100 UNIVERSE · NSE · AUTO-REFRESH 5 MIN · STRICT MATCH ONLY
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558' }}>
              Scanned {new Date(displayData.scannedAt || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
