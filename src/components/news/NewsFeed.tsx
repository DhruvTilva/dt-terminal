'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { formatDistanceToNow } from 'date-fns'
import type { NewsItem } from '@/types'

type Filter = 'all' | 'high_impact' | 'bullish' | 'bearish' | 'actionable'

function isActionable(item: NewsItem): boolean {
  const ageH = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000
  return item.impact !== 'low' && item.timing !== 'informational' && ageH < 6
}

function ageLabel(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }) }
  catch { return '' }
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4 border-b border-border-primary border-l-2 border-l-transparent">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-20" />
        <div className="flex-1" />
        <div className="skeleton h-3.5 w-32" />
      </div>
      <div className="skeleton h-5 w-full mb-2" />
      <div className="skeleton h-4 w-3/4" />
    </div>
  )
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'actionable',  label: '⚡ Actionable' },
  { key: 'high_impact', label: '🔥 High Impact' },
  { key: 'bullish',     label: '▲ Bullish' },
  { key: 'bearish',     label: '▼ Bearish' },
]

export default function NewsFeed() {
  const { news, searchQuery, selectedNews, setSelectedNews, newItemIds } = useStore()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = news.filter(item => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!item.title.toLowerCase().includes(q) &&
          !item.summary.toLowerCase().includes(q) &&
          !item.relatedStocks.some(s => s.toLowerCase().includes(q))) return false
    }
    switch (filter) {
      case 'high_impact': return item.impact === 'high'
      case 'bullish':     return item.sentiment === 'bullish'
      case 'bearish':     return item.sentiment === 'bearish'
      case 'actionable':  return isActionable(item)
      default:            return true
    }
  })

  return (
    <div>
      {/* ── Toolbar — sticky ── */}
      <div className="sticky top-0 z-10 border-b border-border-primary" style={{ background: '#121A2B' }}>
        {/* Filter tabs */}
        <div className="flex items-center px-3 h-11 gap-0.5 overflow-x-auto">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 h-8 px-3.5 text-[12px] font-mono transition-all ${
                filter === f.key
                  ? 'bg-blue/15 text-blue font-semibold'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-1" />
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="shrink-0 h-7 px-2.5 text-[11px] font-mono text-text-muted hover:text-text-primary border border-border-primary hover:border-border-secondary transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="px-5 h-6 flex items-center border-t border-border-primary/50 gap-2">
          <span className="text-[11px] font-mono text-text-muted">
            {news.length === 0
              ? 'Loading feed…'
              : `${filtered.length} stories`}
          </span>
          {news.length > 0 && (
            <>
              <span style={{ color: '#263042', fontSize: 10 }}>·</span>
              <span className="text-[11px] font-mono text-text-muted">ranked by impact & freshness</span>
            </>
          )}
        </div>
      </div>

      {/* ── Feed ── */}
      <div>
        {news.length === 0
          ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
          : filtered.length === 0
            ? (
              <div className="flex flex-col items-center justify-center h-52 gap-3">
                <span className="text-[32px] opacity-15">◎</span>
                <span className="text-[13px] font-mono text-text-muted">No stories match this filter</span>
                <button onClick={() => setFilter('all')} className="text-[12px] font-mono text-blue hover:text-cyan transition-colors">
                  View all stories →
                </button>
              </div>
            )
            : filtered.map(item => (
              <FeedRow
                key={item.id}
                item={item}
                selected={selectedNews?.id === item.id}
                isNew={newItemIds.includes(item.id)}
                onClick={() => setSelectedNews(selectedNews?.id === item.id ? null : item)}
              />
            ))
        }
      </div>
    </div>
  )
}

// ─── Feed Row ──────────────────────────────────────────────────────────────

function FeedRow({ item, selected, isNew, onClick }: {
  item: NewsItem
  selected: boolean
  isNew: boolean
  onClick: () => void
}) {
  const actionable = isActionable(item)
  const isHigh = item.impact === 'high'
  const isMed  = item.impact === 'medium'
  const isLow  = item.impact === 'low'

  const impactClass = isHigh ? 'high-impact' : isMed ? 'medium-impact' : 'low-impact'

  return (
    <div
      className={`feed-row ${impactClass} ${selected ? 'selected' : ''} ${isLow ? 'opacity-60' : ''} ${isNew ? 'animate-fade' : ''}`}
      onClick={onClick}
      style={isNew ? { background: 'rgba(34,211,238,0.07)', borderLeft: '2px solid rgba(34,211,238,0.5)' } : undefined}
    >
      <div className="px-5 py-4">

        {/* ── Row 1: badges + source/time ── */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          {/* NEW badge */}
          {isNew && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wide animate-fade" style={{ background: 'rgba(34,211,238,0.15)', color: '#22D3EE', border: '1px solid rgba(34,211,238,0.35)' }}>
              ● NEW
            </span>
          )}

          {/* Impact */}
          {isHigh && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-red/15 text-red border border-red/25 uppercase tracking-wide">
              🔥 HIGH
            </span>
          )}
          {isMed && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-yellow/10 text-yellow border border-yellow/25 uppercase tracking-wide">
              ◆ MED
            </span>
          )}

          {/* Actionable */}
          {actionable && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue/10 text-blue border border-blue/25 uppercase tracking-wide">
              ⚡ ACT
            </span>
          )}

          {/* Sentiment — only show bullish/bearish, skip neutral to reduce clutter */}
          {item.sentiment === 'bullish' && (
            <span className="text-[10px] font-mono font-semibold text-green">▲ Bull</span>
          )}
          {item.sentiment === 'bearish' && (
            <span className="text-[10px] font-mono font-semibold text-red">▼ Bear</span>
          )}

          {/* Timing */}
          {item.timing === 'immediate' && (
            <span className="text-[10px] font-mono font-semibold text-red uppercase" title="Price impact expected within hours">
              Immediate
            </span>
          )}
          {item.timing === 'short-term' && (
            <span className="text-[10px] font-mono font-semibold text-yellow uppercase" title="Price impact expected in 1–3 days">
              Short-term
            </span>
          )}

          <div className="flex-1" />

          {/* Source + time */}
          <span className="text-[11px] font-mono text-text-muted whitespace-nowrap">
            {item.source} · {ageLabel(item.publishedAt)}
          </span>
        </div>

        {/* ── Row 2: Title ── */}
        <p
          className="mb-2 text-text-primary font-semibold"
          style={{
            fontSize: isHigh ? 16 : isMed ? 15 : 14,
            lineHeight: 1.5,
            fontWeight: isHigh ? 600 : isMed ? 500 : 400,
            color: isLow ? '#9FB0C0' : '#E6EDF3',
          }}
        >
          {item.title}
        </p>

        {/* ── Row 3: Summary — high + medium only, 2 lines ── */}
        {!isLow && item.summary && item.summary !== item.title && (
          <p
            className="mb-3 line-clamp-2"
            style={{ fontSize: 13, lineHeight: 1.6, color: '#9FB0C0' }}
          >
            {item.summary}
          </p>
        )}

        {/* ── Row 4: Stock tags + Read link ── */}
        <div className="flex items-center gap-1.5">
          {item.relatedStocks.slice(0, 3).map(s => (
            <span
              key={s}
              className="font-mono font-semibold bg-bg-tertiary text-text-secondary border border-border-primary"
              style={{ fontSize: 10, padding: '2px 6px' }}
            >
              {s}
            </span>
          ))}
          <div className="flex-1" />
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] font-mono text-text-muted hover:text-blue transition-colors"
          >
            Read →
          </a>
        </div>

      </div>
    </div>
  )
}
