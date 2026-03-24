'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'

const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  breakout:         { label: 'BREAKOUT',   color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
  volume_spike:     { label: 'VOL SPIKE',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)' },
  gap_up:           { label: 'GAP UP',     color: '#22C55E', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)'  },
  gap_down:         { label: 'GAP DOWN',   color: '#F43F5E', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.25)'  },
  news_correlation: { label: 'NEWS+PRICE', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
}

export default function OpportunityCard() {
  const { opportunities, opportunityTypeFilter, setOpportunityTypeFilter } = useStore()
  const [collapsed, setCollapsed] = useState(false)

  const filtered = opportunityTypeFilter
    ? opportunities.filter(o => o.type === opportunityTypeFilter)
    : opportunities

  const highImpact = filtered.filter(o => o.impact === 'high')
  const others     = filtered.filter(o => o.impact !== 'high').slice(0, 8)

  useEffect(() => {
    if (opportunityTypeFilter) setCollapsed(false)
  }, [opportunityTypeFilter])

  if (opportunities.length === 0) return null

  return (
    <div id="trade-signals" style={{ borderBottom: '1px solid #263042' }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center gap-3 text-left hover:bg-bg-hover transition-colors"
        style={{ height: 44, padding: '0 20px', background: '#121A2B', borderBottom: '1px solid #263042' }}
      >
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#F59E0B', letterSpacing: '0.08em' }}>
          ⚡ TRADE SIGNALS
        </span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
          {filtered.length}{opportunityTypeFilter ? ` ${opportunityTypeFilter.replace('_', ' ')}` : ''} detected
        </span>
        {highImpact.length > 0 && !opportunityTypeFilter && (
          <span
            className="font-mono font-bold uppercase"
            style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(244,63,94,0.15)', color: '#F43F5E', border: '1px solid rgba(244,63,94,0.25)' }}
          >
            {highImpact.length} high
          </span>
        )}
        {opportunityTypeFilter && (
          <button
            onClick={e => { e.stopPropagation(); setOpportunityTypeFilter(null) }}
            className="font-mono hover:text-red transition-colors"
            style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            {opportunityTypeFilter.replace('_', ' ')} ✕
          </button>
        )}
        <div className="flex-1" />
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div>
          {[...highImpact, ...others].map(opp => (
            <OppRow key={opp.id} opp={opp} isHigh={opp.impact === 'high'} />
          ))}
        </div>
      )}
    </div>
  )
}

function OppRow({ opp, isHigh }: { opp: any; isHigh: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[opp.type] || { label: opp.type, color: '#6B7A90', bg: '#1A2336', border: '#263042' }

  return (
    <div
      className="hover:bg-bg-hover cursor-pointer transition-colors"
      style={{
        padding: '10px 20px',
        borderBottom: '1px solid rgba(38,48,66,0.5)',
        borderLeft: `2px solid ${isHigh ? '#F43F5E' : 'transparent'}`,
      }}
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-center gap-3">
        {/* Type badge */}
        <span
          className="font-mono font-bold uppercase shrink-0"
          style={{
            fontSize: 10,
            padding: '2px 7px',
            color: meta.color,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
            letterSpacing: '0.04em',
          }}
        >
          {meta.label}
        </span>
        {/* Symbol */}
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#E6EDF3' }}>
          {opp.symbol}
        </span>
        {/* Reason */}
        <span className="flex-1 truncate" style={{ fontSize: 12, color: '#9FB0C0' }}>
          {opp.reason}
        </span>
        {/* Price + change */}
        <div className="shrink-0 flex items-center gap-2.5">
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90', fontVariantNumeric: 'tabular-nums' }}>
            ₹{opp.price.toFixed(0)}
          </span>
          <span style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            color: opp.changePercent >= 0 ? '#22C55E' : '#F43F5E',
          }}>
            {opp.changePercent >= 0 ? '+' : ''}{opp.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      {expanded && opp.details && (
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.6,
            color: '#9FB0C0',
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(38,48,66,0.5)',
          }}
        >
          {opp.details}
        </p>
      )}
    </div>
  )
}
