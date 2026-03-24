'use client'

import { useStore } from '@/store/useStore'
import { getMarketStatus } from '@/lib/stocks'

export default function MarketTicker() {
  const { indices } = useStore()
  const status = getMarketStatus()

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-bg-secondary border-b border-border-primary">
      {/* Market status */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${status.isOpen ? 'bg-green live-dot' : 'bg-text-muted'}`} />
        <span className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted uppercase tracking-wider">
          {status.isOpen ? 'Live' : 'Closed'}
        </span>
      </div>

      {/* Index quick view */}
      {indices.map(idx => (
        <div key={idx.name} className="flex items-center gap-2 text-[11px] font-[family-name:var(--font-mono)] tabular-nums">
          <span className="text-text-muted">{idx.name}</span>
          <span className="text-text-primary font-medium">
            {idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className={idx.change >= 0 ? 'text-green' : 'text-red'}>
            {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}
