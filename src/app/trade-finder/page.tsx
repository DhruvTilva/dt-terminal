'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MLPrediction {
  direction: string
  confidence: number
  accuracy: number
}

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

const FILTER_EXPLAIN: Record<string, { title: string; desc: string }> = {
  strict_morning:  { title: 'Strict Morning Trend',  desc: 'Every 9:30–10:30 candle moved in one direction for 3 straight days. The strongest, most reliable signal.' },
  general_morning: { title: 'General Morning Trend', desc: 'Morning session (9:30–10:30) direction matched the rest-of-day (10:30–3:30) on all 3 of the last 3 trading days — and all in the same direction. Stocks that consistently follow through on their morning bias.' },
  candle_pattern:  { title: 'Candle Signal',         desc: 'Latest candle is a Hammer, Shooting Star, or a strong green/red bar — hints at a reversal or continuation right now.' },
  long_trend:      { title: 'Long Trend',            desc: '20-day MA is above/below 50-day MA for 1+ month = clean trend. Best for swing trades (hold days to weeks).' },
  high_volatility: { title: 'High Volatility Move',  desc: 'Moved 2.2%–4.5% between 9:30–10:30 AM on all 3 recent days, with solid volume. Sweet spot for intraday scalping — not too slow, not overextended.' },
}

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

function MLBadge({ prediction }: { prediction: MLPrediction | undefined }) {
  if (!prediction) return <span />
  const isUp = prediction.direction === 'bullish'
  const color = isUp ? '#22C55E' : '#F43F5E'
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
      color, background: `${color}15`, borderRadius: 4,
      padding: '2px 5px', whiteSpace: 'nowrap',
      display: 'inline-block', textAlign: 'center',
    }}>
      {isUp ? '↑' : '↓'} {Math.round(prediction.confidence)}%
    </span>
  )
}

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
  result, isExpanded, onToggle, mlPrediction,
}: {
  result: TradeResult
  isExpanded: boolean
  onToggle: () => void
  mlPrediction: MLPrediction | undefined
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
        gridTemplateColumns: '28px 90px 1fr 80px 70px 52px 42px 58px',
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
        {/* ML Prediction */}
        <MLBadge prediction={mlPrediction} />
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

function InfoPopup({ strategyKey, onClose }: { strategyKey: string; onClose: () => void }) {
  const info = FILTER_EXPLAIN[strategyKey]
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!info) return null
  const s = STRATEGIES.find(x => x.key === strategyKey)
  const color = s?.color ?? '#3B82F6'

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      className="info-overlay"
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(11,18,32,0.75)', backdropFilter: 'blur(3px)',
        display: 'flex', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        className="info-panel"
        style={{
          background: '#121A2B',
          border: `1px solid ${color}40`,
          boxShadow: `0 0 32px ${color}18, 0 8px 40px rgba(0,0,0,0.5)`,
          width: '100%', maxWidth: 460,
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Sticky header */}
        <div style={{
          padding: '16px 20px 12px', flexShrink: 0,
          borderBottom: `1px solid ${color}25`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
        }}>
          <div>
            <div style={{
              fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
              textTransform: 'uppercase', color, marginBottom: 4,
            }}>Filter Logic</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3' }}>
              {info.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0, marginTop: 2,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B7A90', fontSize: 16, lineHeight: 1,
              padding: '4px 6px', borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E6EDF3')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7A90')}
          >✕</button>
        </div>

        {/* Scrollable body */}
        <div className="info-panel-body" style={{ overflowY: 'auto', padding: '16px 20px 24px', flex: 1 }}>

        {/* Description */}
        <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.7, margin: 0 }}>
          {info.desc}
        </p>

        {/* Entry hint for high volatility */}
        {strategyKey === 'high_volatility' && (
          <div style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
            fontSize: 11, color: '#F97316', fontFamily: 'var(--font-mono)',
          }}>
            Watch for breakout after 10:05 AM · Exit before 3:15 PM
          </div>
        )}
        {strategyKey === 'long_trend' && (
          <div style={{
            marginTop: 14, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            fontSize: 11, color: '#22C55E', fontFamily: 'var(--font-mono)',
          }}>
            Stocks near 20-day MA = better entry · Avoid if &gt;10% extended
          </div>
        )}

        {/* ── Understanding the Data ── */}
        <div style={{ height: 1, background: '#263042', margin: '18px 0 14px' }} />
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#6B7A90', marginBottom: 12,
        }}>Understanding the Data</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Score */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2A3A' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.12)', borderRadius: 4, padding: '1px 6px' }}>SCORE</span>
              Signal strength
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { range: '70–80', label: 'Good setup', color: '#F59E0B' },
                { range: '80–90', label: 'Strong setup', color: '#22C55E' },
                { range: '90+',   label: 'Very high probability', color: '#3B82F6' },
              ].map(r => (
                <div key={r.range} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: r.color, minWidth: 36 }}>{r.range}</span>
                  <span style={{ color: '#6B7A90' }}>→</span>
                  <span style={{ color: '#9FB0C0' }}>{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Change % */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2A3A' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9FB0C0', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px' }}>CHANGE %</span>
              Today&apos;s price move
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ color: '#22C55E', fontWeight: 600 }}>+% up</span>
              <span style={{ color: '#F43F5E', fontWeight: 600 }}>−% down</span>
              <span style={{ color: '#6B7A90' }}>— shows current momentum</span>
            </div>
          </div>

          {/* Direction */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid #1E2A3A' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#9FB0C0', background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 6px' }}>DIRECTION</span>
              Expected move
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ color: '#22C55E', fontWeight: 700 }}>▲ BULL</span>
              <span style={{ color: '#6B7A90' }}>expect upward move</span>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 4 }}>
              <span style={{ color: '#F43F5E', fontWeight: 700 }}>▼ BEAR</span>
              <span style={{ color: '#6B7A90' }}>expect downward move</span>
            </div>
          </div>

          {/* AI Prediction */}
          <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E6EDF3', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3B82F6', background: 'rgba(59,130,246,0.15)', borderRadius: 4, padding: '1px 6px' }}>AI</span>
              ML next-day prediction
            </div>
            <p style={{ fontSize: 11, color: '#9FB0C0', lineHeight: 1.6, margin: '0 0 8px' }}>
              Trained nightly on 30 days of signal history. Predicts whether the stock is likely to move up or down the next day.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { badge: '↑ 85%', color: '#22C55E', label: 'bullish — high confidence' },
                { badge: '↓ 72%', color: '#F43F5E', label: 'bearish — medium confidence' },
                { badge: '—',     color: '#6B7A90', label: 'no prediction yet today' },
              ].map(r => (
                <div key={r.badge} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, color: r.color,
                    background: `${r.color}15`, borderRadius: 4, padding: '1px 5px', minWidth: 42, textAlign: 'center',
                  }}>{r.badge}</span>
                  <span style={{ color: '#6B7A90' }}>→</span>
                  <span style={{ color: '#9FB0C0' }}>{r.label}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 8, fontSize: 10, color: '#3B82F6', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.03em',
            }}>
              Use as a secondary signal — not a trade guarantee.
            </div>
          </div>
        </div>

        </div>{/* end scrollable body */}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }

        /* Mobile — bottom sheet */
        @media (max-width: 600px) {
          .info-overlay { align-items: flex-end; padding: 0; }
          .info-panel   { border-radius: 14px 14px 0 0; max-height: 88dvh; animation: slideUp 0.22s ease; }
        }
        /* Desktop — centered modal */
        @media (min-width: 601px) {
          .info-overlay { align-items: center; padding: 24px; }
          .info-panel   { border-radius: 14px; max-height: 85dvh; animation: scaleIn 0.18s ease; }
        }

        .info-panel-body::-webkit-scrollbar { width: 4px; }
        .info-panel-body::-webkit-scrollbar-track { background: transparent; }
        .info-panel-body::-webkit-scrollbar-thumb { background: #263042; border-radius: 4px; }
      `}</style>
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
  const router = useRouter()
  const [data, setData]                   = useState<ResultsPayload | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState('strict_morning')
  const [direction, setDirection]         = useState<'all' | 'bullish' | 'bearish'>('all')
  const [expanded, setExpanded]           = useState<string | null>(null)
  const [infoOpen, setInfoOpen]           = useState<string | null>(null)
  const [mlPredictions, setMlPredictions] = useState<Record<string, MLPrediction>>({})

  // Auth guard — redirect guests to login
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) router.replace('/login')
    })
  }, [router])

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

  useEffect(() => {
    fetchResults()
    // Fetch ML predictions silently — if table not ready yet, returns {}
    fetch('/api/ml-predictions')
      .then(r => r.json())
      .then((map: Record<string, MLPrediction>) => setMlPredictions(map))
      .catch(() => {/* silent fail */})
  }, [fetchResults])

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
              <div key={s.key} style={{
                display: 'flex', alignItems: 'center', position: 'relative',
                borderBottom: isActive ? `2px solid ${s.color}` : '2px solid transparent',
                borderRadius: '6px 6px 0 0',
                background: isActive ? '#0B1220' : 'transparent',
              }}>
                <button
                  onClick={() => { setActiveTab(s.key); setExpanded(null) }}
                  style={{
                    padding: '8px 4px 8px 16px', fontSize: 12, fontWeight: 600,
                    border: 'none', background: 'transparent',
                    color: isActive ? s.color : '#6B7A90',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {s.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: isActive ? s.color : '#354558',
                      background: isActive ? `${s.color}1A` : '#1A2336',
                      borderRadius: 10, padding: '1px 6px',
                    }}>{count}</span>
                  )}
                </button>
                {/* ⓘ Info button */}
                <button
                  onClick={e => { e.stopPropagation(); setInfoOpen(s.key) }}
                  title="View filter logic"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 10px 4px 2px', fontSize: 12,
                    color: infoOpen === s.key ? s.color : '#354558',
                    lineHeight: 1, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = s.color)}
                  onMouseLeave={e => (e.currentTarget.style.color = infoOpen === s.key ? s.color : '#354558')}
                >ⓘ</button>
              </div>
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
                gridTemplateColumns: '28px 90px 1fr 80px 70px 52px 42px 58px',
                gap: 8, padding: '8px 16px',
                borderBottom: '1px solid #1A2336',
                background: '#121A2B',
              }}>
                {['#', 'Symbol', 'Name / Signal', 'Price', 'Change', 'Dir', 'Score', 'AI'].map((h, i) => (
                  <span key={i} style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: i === 7 ? '#3B82F6' : '#354558', fontFamily: 'var(--font-mono)',
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
                    mlPrediction={mlPredictions[result.stock_symbol]}
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

      {/* ── Filter Explain Popup ────────────────────────────────────────────── */}
      {infoOpen && <InfoPopup strategyKey={infoOpen} onClose={() => setInfoOpen(null)} />}

    </div>
  )
}
