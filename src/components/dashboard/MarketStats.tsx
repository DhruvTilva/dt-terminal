'use client'

import { useStore } from '@/store/useStore'

function scrollToSignals() {
  document.getElementById('trade-signals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function MarketStats() {
  const { stocks, opportunities, indices, setOpportunityTypeFilter, opportunityTypeFilter } = useStore()

  const gainers = [...stocks].filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent).slice(0, 5)
  const losers = [...stocks].filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent).slice(0, 5)
  const adv    = stocks.filter(s => s.changePercent > 0).length
  const dec    = stocks.filter(s => s.changePercent < 0).length
  const advPct = stocks.length > 0 ? (adv / stocks.length) * 100 : 50
  const loading = stocks.length === 0

  const signals = [
    { label: 'Breakouts',  type: 'breakout',    count: opportunities.filter(o => o.type === 'breakout').length,    tooltip: 'Price broke above resistance' },
    { label: 'Vol Spikes', type: 'volume_spike', count: opportunities.filter(o => o.type === 'volume_spike').length, tooltip: 'Sudden surge in trading volume' },
    { label: 'Gap Ups',    type: 'gap_up',       count: opportunities.filter(o => o.type === 'gap_up').length,       tooltip: 'Opened >2% above prev close' },
    { label: 'Gap Downs',  type: 'gap_down',     count: opportunities.filter(o => o.type === 'gap_down').length,     tooltip: 'Opened >2% below prev close' },
  ]

  const ROW = 'flex items-center justify-between py-2.5 px-2 -mx-2 hover:bg-bg-hover transition-colors'

  return (
    <div>

      {/* ── Indices ── */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #263042' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Indices</p>
        {loading
          ? [1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))
          : indices.map(idx => (
            <div key={idx.name} className={ROW}>
              <span style={{ fontSize: 13, color: '#9FB0C0', fontFamily: 'var(--font-mono)' }}>{idx.name}</span>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 14, fontWeight: 600, color: '#E6EDF3', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                  {idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: idx.change >= 0 ? '#22C55E' : '#F43F5E', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', minWidth: 60, textAlign: 'right' }}>
                  {idx.change >= 0 ? '▲' : '▼'}{Math.abs(idx.changePercent).toFixed(2)}%
                </span>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Market Breadth ── */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #263042' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Market Breadth</p>
        <div style={{ height: 6, background: '#1A2336', border: '1px solid #263042', overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ height: '100%', background: '#22C55E', width: `${advPct}%`, transition: 'width 0.7s' }} />
        </div>
        <div className="flex justify-between">
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#22C55E' }}>▲ {adv} adv</span>
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>{advPct.toFixed(0)}% advancing</span>
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#F43F5E' }}>▼ {dec} dec</span>
        </div>
      </div>

      {/* ── Signals Today ── */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #263042' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Signals Today</p>
        <div className="grid grid-cols-2 gap-2">
          {signals.map(s => {
            const isActive = opportunityTypeFilter === s.type
            return (
              <button
                key={s.type}
                title={s.tooltip}
                disabled={s.count === 0}
                onClick={() => { setOpportunityTypeFilter(isActive ? null : s.type); scrollToSignals() }}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: isActive ? 'rgba(59,130,246,0.12)' : '#1A2336',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.3)' : '#263042'}`,
                  opacity: s.count === 0 ? 0.35 : 1,
                  cursor: s.count === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.12s',
                }}
                className={s.count > 0 && !isActive ? 'hover:bg-bg-hover' : ''}
              >
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', marginBottom: 6, letterSpacing: '0.04em' }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: 22,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                  color: s.count === 0 ? '#6B7A90' : isActive ? '#3B82F6' : s.type === 'gap_down' ? '#F43F5E' : '#22C55E',
                }}>
                  {s.count}
                </div>
              </button>
            )
          })}
        </div>
        {opportunityTypeFilter && (
          <button
            onClick={() => setOpportunityTypeFilter(null)}
            className="mt-2.5 w-full font-mono text-blue hover:bg-blue/5 transition-colors"
            style={{ fontSize: 11, border: '1px solid rgba(59,130,246,0.2)', padding: '6px' }}
          >
            ✕ Clear filter: {opportunityTypeFilter.replace('_', ' ')}
          </button>
        )}
      </div>

      {/* ── Top Gainers ── */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid #263042' }}>
        <p className="section-label" style={{ marginBottom: 12, color: '#22C55E' }}>▲ Top Gainers</p>
        {loading
          ? [1, 2, 3].map(i => (
            <div key={i} className="flex justify-between py-2.5">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))
          : gainers.length > 0
            ? gainers.map(s => (
              <div key={s.symbol} className={ROW}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#E6EDF3' }}>{s.symbol}</span>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90', fontVariantNumeric: 'tabular-nums' }}>₹{s.price.toFixed(0)}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#22C55E', fontVariantNumeric: 'tabular-nums', minWidth: 55, textAlign: 'right' }}>+{s.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))
            : <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>—</p>
        }
      </div>

      {/* ── Top Losers ── */}
      <div className="px-5 py-4">
        <p className="section-label" style={{ marginBottom: 12, color: '#F43F5E' }}>▼ Top Losers</p>
        {loading
          ? [1, 2, 3].map(i => (
            <div key={i} className="flex justify-between py-2.5">
              <div className="skeleton h-4 w-16" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))
          : losers.length > 0
            ? losers.map(s => (
              <div key={s.symbol} className={ROW}>
                <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#E6EDF3' }}>{s.symbol}</span>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90', fontVariantNumeric: 'tabular-nums' }}>₹{s.price.toFixed(0)}</span>
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#F43F5E', fontVariantNumeric: 'tabular-nums', minWidth: 55, textAlign: 'right' }}>{s.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            ))
            : <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>—</p>
        }
      </div>

    </div>
  )
}
