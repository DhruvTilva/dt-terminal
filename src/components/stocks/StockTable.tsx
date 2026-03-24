'use client'

import { useState } from 'react'
import { useStore } from '@/store/useStore'

type View = 'all' | 'gainers' | 'losers' | 'volume'
type Sort = 'changePercent' | 'price' | 'volume' | 'symbol'

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid rgba(38,48,66,0.4)' }}>
      <td style={{ padding: '10px 20px' }}><div className="skeleton h-4 w-20" /></td>
      <td style={{ padding: '10px 20px', textAlign: 'right' }}><div className="skeleton h-4 w-20 ml-auto" /></td>
      <td style={{ padding: '10px 20px', textAlign: 'right' }}><div className="skeleton h-4 w-16 ml-auto" /></td>
      <td style={{ padding: '10px 20px', textAlign: 'right' }} className="hidden sm:table-cell"><div className="skeleton h-4 w-16 ml-auto" /></td>
    </tr>
  )
}

export default function StockTable() {
  const { stocks } = useStore()
  const [view, setView] = useState<View>('all')
  const [sort, setSort] = useState<Sort>('changePercent')
  const [dir,  setDir]  = useState<'asc' | 'desc'>('desc')

  const toggle = (key: Sort) => {
    if (sort === key) setDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSort(key); setDir('desc') }
  }

  let rows = [...stocks]
  if (view === 'gainers') rows = rows.filter(s => s.changePercent > 0)
  if (view === 'losers')  rows = rows.filter(s => s.changePercent < 0)
  if (view === 'volume')  rows = rows.filter(s => s.avgVolume && s.volume > s.avgVolume * 1.5)

  rows.sort((a, b) => {
    const m = dir === 'asc' ? 1 : -1
    if (sort === 'symbol') return m * a.symbol.localeCompare(b.symbol)
    if (sort === 'price')  return m * (a.price - b.price)
    if (sort === 'volume') return m * (a.volume - b.volume)
    return m * (a.changePercent - b.changePercent)
  })

  const fmtVol = (v: number) => {
    if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`
    if (v >= 100000)   return `${(v / 100000).toFixed(1)}L`
    if (v >= 1000)     return `${(v / 1000).toFixed(0)}K`
    return `${v}`
  }

  const SortBtn = ({ col, label }: { col: Sort; label: string }) => (
    <button
      onClick={() => toggle(col)}
      className="flex items-center gap-0.5 hover:text-text-secondary transition-colors"
      style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', textTransform: 'uppercase', letterSpacing: '0.06em' }}
    >
      {label}{sort === col ? (dir === 'desc' ? ' ↓' : ' ↑') : ''}
    </button>
  )

  const VIEW_TABS: { key: View; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'gainers', label: '▲ Gainers' },
    { key: 'losers',  label: '▼ Losers' },
    { key: 'volume',  label: 'VOL↑' },
  ]

  return (
    <div style={{ borderTop: '1px solid #263042' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3"
        style={{ height: 44, padding: '0 20px', background: '#121A2B', borderBottom: '1px solid #263042' }}
      >
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#6B7A90', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Stocks
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>{rows.length}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {VIEW_TABS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="transition-colors"
              style={{
                height: 28,
                padding: '0 10px',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: view === v.key
                  ? v.key === 'gainers' ? '#22C55E' : v.key === 'losers' ? '#F43F5E' : '#3B82F6'
                  : '#6B7A90',
                background: view === v.key
                  ? v.key === 'gainers' ? 'rgba(34,197,94,0.1)' : v.key === 'losers' ? 'rgba(244,63,94,0.1)' : 'rgba(59,130,246,0.1)'
                  : 'transparent',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table style={{ width: '100%', minWidth: 360 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #263042', background: 'rgba(18,26,43,0.5)' }}>
              <th style={{ textAlign: 'left',  padding: '8px 20px' }}><SortBtn col="symbol"        label="Symbol" /></th>
              <th style={{ textAlign: 'right', padding: '8px 20px' }}><SortBtn col="price"         label="LTP"    /></th>
              <th style={{ textAlign: 'right', padding: '8px 20px' }}><SortBtn col="changePercent" label="Chg%"   /></th>
              <th style={{ textAlign: 'right', padding: '8px 20px' }} className="hidden sm:table-cell"><SortBtn col="volume" label="Volume" /></th>
            </tr>
          </thead>
          <tbody>
            {stocks.length === 0
              ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
              : rows.map(s => {
                const spike    = s.avgVolume && s.volume > s.avgVolume * 1.5
                const isGainer = s.changePercent > 0
                const isLoser  = s.changePercent < 0
                return (
                  <tr
                    key={s.symbol}
                    className="hover:bg-bg-hover transition-colors"
                    style={{ borderBottom: '1px solid rgba(38,48,66,0.4)' }}
                  >
                    <td style={{ padding: '10px 20px' }}>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#E6EDF3' }}>
                        {s.symbol}
                      </span>
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#E6EDF3' }}>
                        ₹{s.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color: isGainer ? '#22C55E' : isLoser ? '#F43F5E' : '#6B7A90',
                      }}>
                        {isGainer ? '+' : ''}{s.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 20px', textAlign: 'right' }} className="hidden sm:table-cell">
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: '#6B7A90' }}>
                        {fmtVol(s.volume)}
                      </span>
                      {spike && (
                        <span
                          className="font-mono"
                          style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}
                        >
                          {(s.volume / s.avgVolume!).toFixed(1)}x
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
        {stocks.length > 0 && rows.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
            No stocks match filter
          </div>
        )}
      </div>
    </div>
  )
}
