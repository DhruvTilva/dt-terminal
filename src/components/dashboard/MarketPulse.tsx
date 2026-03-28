'use client'

import { useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { generateMarketPulse } from '@/lib/marketPulse'

export default function MarketPulse() {
  const { stocks, indices, news } = useStore()

  const pulse = useMemo(
    () => generateMarketPulse(stocks, indices, news),
    [stocks, indices, news]
  )

  if (!pulse) return null

  const accentColor =
    pulse.sentiment === 'bullish' ? '#22C55E'
    : pulse.sentiment === 'bearish' ? '#F43F5E'
    : '#3B82F6'

  const bgColor =
    pulse.sentiment === 'bullish' ? 'rgba(34,197,94,0.04)'
    : pulse.sentiment === 'bearish' ? 'rgba(244,63,94,0.04)'
    : 'rgba(59,130,246,0.04)'

  const sentimentIcon =
    pulse.sentiment === 'bullish' ? '▲'
    : pulse.sentiment === 'bearish' ? '▼'
    : '◆'

  return (
    <div
      style={{
        margin: '10px 12px 4px',
        padding: '10px 14px',
        background: bgColor,
        border: `1px solid ${accentColor}22`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{
          fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700,
          letterSpacing: '0.12em', color: accentColor,
          background: `${accentColor}18`, border: `1px solid ${accentColor}30`,
          padding: '1px 6px', borderRadius: 4,
        }}>
          AI PULSE
        </span>
        <span style={{ fontSize: 9, color: accentColor, fontWeight: 700 }}>
          {sentimentIcon}
        </span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558',
          marginLeft: 'auto',
        }}>
          {pulse.sentiment.toUpperCase()}
        </span>
      </div>

      {/* Pulse text */}
      <p style={{
        fontSize: 11.5,
        color: '#9FB0C0',
        lineHeight: 1.65,
        margin: 0,
        fontFamily: 'var(--font-sans)',
      }}>
        {pulse.text}
      </p>
    </div>
  )
}
