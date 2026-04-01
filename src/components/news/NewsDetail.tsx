'use client'

import { useStore } from '@/store/useStore'
import { formatDistanceToNow } from 'date-fns'
import type { NewsItem } from '@/types'
import MarketStats from '@/components/dashboard/MarketStats'

function whyItMatters(item: NewsItem): string {
  const stocks = item.relatedStocks.length > 0 ? item.relatedStocks.join(', ') : 'related stocks'
  if (item.timing === 'immediate' && item.impact === 'high')
    return `High-priority catalyst. Expect significant price movement in ${stocks} within hours. Suitable for intraday traders — watch for entry/exit around key levels.`
  if (item.timing === 'immediate' && item.impact === 'medium')
    return `Moderate catalyst for ${stocks}. Price impact possible today but may be short-lived. Watch for reaction at market open or after the news spreads.`
  if (item.timing === 'short-term')
    return `This development is likely to play out over 1–3 trading sessions for ${stocks}. Suitable for swing traders. Watch for volume confirmation.`
  if (item.impact === 'high')
    return `High-impact event for ${stocks}. While not immediately tradeable, this changes the fundamental picture and could affect price for several sessions.`
  return `Background context for ${stocks}. No immediate price impact expected — useful for understanding sector and market sentiment.`
}

function impactExplanation(item: NewsItem): string {
  if (item.impact === 'high')   return 'Likely to cause >2% price move. High volatility expected.'
  if (item.impact === 'medium') return 'May cause 0.5–2% price move. Watch for confirmation before acting.'
  return 'Minimal direct price impact. Monitor for sector-wide sentiment shift.'
}

export default function NewsDetail() {
  const { selectedNews, setSelectedNews, opportunities } = useStore()

  if (!selectedNews) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 h-11 border-b border-border-primary flex items-center px-5" style={{ background: '#121A2B' }}>
          <span className="section-label">Market Overview</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <MarketStats />
        </div>
      </div>
    )
  }

  const item = selectedNews
  const isHigh = item.impact === 'high'
  const isMed  = item.impact === 'medium'
  const relatedOpps = opportunities.filter(o => item.relatedStocks.includes(o.symbol))

  const ageStr = (() => {
    try { return formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true }) }
    catch { return '' }
  })()

  return (
    <div className="flex flex-col h-full animate-fade">
      {/* ── Panel header ── */}
      <div className="shrink-0 h-11 border-b border-border-primary flex items-center gap-2 px-5" style={{ background: '#121A2B' }}>
        <span className="section-label">Story Detail</span>
        <div className="flex-1" />
        <button
          onClick={() => setSelectedNews(null)}
          className="text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors px-2 py-1 hover:bg-bg-hover"
        >
          ✕ Close
        </button>
      </div>

      {/* ── Impact bar ── */}
      <div
        className="h-[3px] w-full shrink-0"
        style={{ background: isHigh ? '#F43F5E' : isMed ? '#F59E0B' : '#263042' }}
      />

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isHigh && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-red/15 text-red border border-red/25 uppercase tracking-wide">
                🔥 High Impact
              </span>
            )}
            {isMed && (
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-yellow/10 text-yellow border border-yellow/25 uppercase tracking-wide">
                ◆ Medium
              </span>
            )}
            <span className={`text-[10px] font-mono px-2.5 py-1 uppercase tracking-wide border ${
              item.sentiment === 'bullish' ? 'bg-green/10 text-green border-green/25' :
              item.sentiment === 'bearish' ? 'bg-red/10 text-red border-red/25' :
              'bg-bg-tertiary text-text-muted border-border-primary'
            }`}>
              {item.sentiment === 'bullish' ? '▲ Bullish' : item.sentiment === 'bearish' ? '▼ Bearish' : '● Neutral'}
            </span>
            {item.timing === 'immediate' && (
              <span className="text-[10px] font-mono px-2.5 py-1 uppercase tracking-wide bg-red/10 text-red border border-red/25" title="Impact expected within hours">
                Immediate
              </span>
            )}
            {item.timing === 'short-term' && (
              <span className="text-[10px] font-mono px-2.5 py-1 uppercase tracking-wide bg-yellow/10 text-yellow border border-yellow/25" title="Impact expected in 1–3 days">
                Short-term
              </span>
            )}
          </div>

          {/* Title + meta */}
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.5, color: '#E6EDF3', marginBottom: 8 }}>
              {item.title}
            </h2>
            <p style={{ fontSize: 12, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>
              {item.source} · {ageStr}
            </p>
          </div>

          {/* Summary */}
          {item.summary && item.summary !== item.title && (
            <div style={{ background: '#1A2336', border: '1px solid #263042', padding: '12px 14px' }}>
              <p className="section-label" style={{ marginBottom: 8 }}>Summary</p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9FB0C0' }}>
                {item.summary}
              </p>
            </div>
          )}

          {/* Why it matters */}
          <div style={{ borderTop: '1px solid #263042', paddingTop: 16 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Why It Matters</p>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: '#9FB0C0' }}>
              {whyItMatters(item)}
            </p>
          </div>

          {/* Price impact */}
          <div style={{ borderTop: '1px solid #263042', paddingTop: 16 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>Price Impact</p>
            <div
              className="flex items-start gap-2.5"
              style={{
                padding: '10px 12px',
                background: isHigh ? 'rgba(244,63,94,0.06)' : isMed ? 'rgba(245,158,11,0.06)' : '#1A2336',
                border: `1px solid ${isHigh ? 'rgba(244,63,94,0.2)' : isMed ? 'rgba(245,158,11,0.2)' : '#263042'}`,
              }}
            >
              <span style={{ fontSize: 15, marginTop: 1, color: isHigh ? '#F43F5E' : isMed ? '#F59E0B' : '#6B7A90' }}>
                {isHigh ? '⚠' : isMed ? '◆' : '●'}
              </span>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: isHigh ? '#F43F5E' : isMed ? '#F59E0B' : '#6B7A90', fontFamily: 'var(--font-mono)' }}>
                {impactExplanation(item)}
              </p>
            </div>
          </div>

          {/* Affected stocks */}
          {item.relatedStocks.length > 0 && (
            <div style={{ borderTop: '1px solid #263042', paddingTop: 16 }}>
              <p className="section-label" style={{ marginBottom: 10 }}>Affected Stocks</p>
              <div className="flex flex-wrap gap-2">
                {item.relatedStocks.map(s => (
                  <span
                    key={s}
                    className="font-mono font-semibold bg-bg-tertiary text-text-primary border border-border-secondary"
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Active signals */}
          {relatedOpps.length > 0 && (
            <div style={{ borderTop: '1px solid #263042', paddingTop: 16 }}>
              <p className="section-label" style={{ marginBottom: 10 }}>Active Signals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {relatedOpps.slice(0, 4).map(opp => (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between bg-bg-tertiary border border-border-primary"
                    style={{ padding: '8px 12px' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="font-mono font-bold bg-bg-active border border-border-secondary text-text-secondary uppercase"
                        style={{ fontSize: 10, padding: '2px 6px', letterSpacing: '0.05em' }}
                      >
                        {opp.type.replace('_', ' ')}
                      </span>
                      <span className="font-mono font-semibold text-text-primary" style={{ fontSize: 13 }}>
                        {opp.symbol}
                      </span>
                    </div>
                    <span
                      className={`font-mono font-semibold tabular-nums ${opp.changePercent >= 0 ? 'text-green' : 'text-red'}`}
                      style={{ fontSize: 13 }}
                    >
                      {opp.changePercent >= 0 ? '+' : ''}{opp.changePercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5" style={{ borderTop: '1px solid #263042', paddingTop: 16 }}>
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:text-blue transition-colors"
              style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #354558', color: '#6B7A90' }}
            >
              Read Full Article →
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
