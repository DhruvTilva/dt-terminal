'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'

interface AccuracyRow {
  prediction_date: string
  total_predictions: number
  correct_predictions: number
  accuracy_pct: number
}

interface AccuracyData {
  rows: AccuracyRow[]
  avg7: number | null
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function AccuracyBar({ pct }: { pct: number }) {
  const color = pct >= 65 ? '#22C55E' : pct >= 55 ? '#F59E0B' : '#F43F5E'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#1E2A3A', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, minWidth: 40, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}

export default function MLAccuracyPage() {
  const router = useRouter()
  const [data, setData] = useState<AccuracyData | null>(null)
  const [loading, setLoading] = useState(true)

  // Auth guard
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) router.replace('/login')
    })
  }, [router])

  useEffect(() => {
    fetch('/api/ml-accuracy')
      .then(r => r.json())
      .then((d: AccuracyData) => setData(d))
      .catch(() => setData({ rows: [], avg7: null }))
      .finally(() => setLoading(false))
  }, [])

  const avg7 = data?.avg7 ?? null
  const avg7Color = avg7 === null ? '#6B7A90' : avg7 >= 65 ? '#22C55E' : avg7 >= 55 ? '#F59E0B' : '#F43F5E'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0B1220' }}>

      {/* Shared header */}
      <Header />

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>

        {/* Back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => router.push('/trade-finder')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid #263042',
              color: '#9FB0C0', cursor: 'pointer', borderRadius: 6,
              fontSize: 12, padding: '5px 10px', fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B82F6')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#263042')}
          >
            ← Trade Finder
          </button>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 2 }}>
              AI / ML
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E6EDF3' }}>
              Prediction Accuracy
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7A90', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            Loading accuracy data…
          </div>
        )}

        {!loading && (
          <>
            {/* 7-day avg stat card */}
            <div style={{
              background: '#121A2B', border: `1px solid ${avg7Color}30`,
              borderRadius: 12, padding: '20px 24px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 20,
              maxWidth: 480,
            }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7A90', marginBottom: 6 }}>
                  7-Day Rolling Accuracy
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: avg7Color, lineHeight: 1 }}>
                  {avg7 !== null ? `${avg7}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#6B7A90', marginTop: 6 }}>
                  {avg7 === null
                    ? 'Not enough data yet — needs 7+ graded days'
                    : avg7 >= 65
                      ? 'Strong — AI signals are reliable'
                      : avg7 >= 55
                        ? 'Moderate — use with other signals'
                        : 'Weak — treat AI badge as supplementary only'}
                </div>
              </div>
              <div style={{
                flexShrink: 0, width: 48, height: 48, borderRadius: '50%',
                background: `${avg7Color}15`, border: `2px solid ${avg7Color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {avg7 === null ? '◎' : avg7 >= 65 ? '✦' : avg7 >= 55 ? '◈' : '◇'}
              </div>
            </div>

            {/* Table */}
            {data?.rows && data.rows.length > 0 ? (
              <div style={{ background: '#121A2B', border: '1px solid #1E2A3A', borderRadius: 12, overflow: 'hidden', maxWidth: 640 }}>
                {/* Table header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '130px 90px 90px 1fr',
                  padding: '10px 16px', borderBottom: '1px solid #1E2A3A',
                  background: '#0F1828',
                }}>
                  {['Date', 'Predicted', 'Correct', 'Accuracy'].map((h, i) => (
                    <span key={i} style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#354558',
                      fontFamily: 'var(--font-mono)',
                      textAlign: i >= 1 ? 'right' : 'left',
                    }}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                {data.rows.map((row, i) => {
                  const color = row.accuracy_pct >= 65 ? '#22C55E' : row.accuracy_pct >= 55 ? '#F59E0B' : '#F43F5E'
                  return (
                    <div key={row.prediction_date} style={{
                      display: 'grid', gridTemplateColumns: '130px 90px 90px 1fr',
                      padding: '12px 16px', alignItems: 'center',
                      borderBottom: i < data.rows.length - 1 ? '1px solid #1A2336' : 'none',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#9FB0C0' }}>
                        {fmtDate(row.prediction_date)}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#6B7A90', textAlign: 'right' }}>
                        {row.total_predictions}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color, textAlign: 'right', fontWeight: 600 }}>
                        {row.correct_predictions}
                      </span>
                      <div style={{ paddingLeft: 16 }}>
                        <AccuracyBar pct={Number(row.accuracy_pct)} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{
                background: '#121A2B', border: '1px solid #1E2A3A', borderRadius: 12,
                padding: '48px 24px', textAlign: 'center', maxWidth: 640,
              }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>◎</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E6EDF3', marginBottom: 8 }}>
                  No accuracy data yet
                </div>
                <div style={{ fontSize: 12, color: '#6B7A90', lineHeight: 1.6 }}>
                  Accuracy is graded nightly after the daily market scan.<br />
                  Data will appear here once the ML script has run for at least 2 days.
                </div>
              </div>
            )}

            {/* Legend */}
            <div style={{
              marginTop: 20, display: 'flex', gap: 16, flexWrap: 'wrap',
              maxWidth: 640,
            }}>
              {[
                { color: '#22C55E', label: '≥ 65% — Strong' },
                { color: '#F59E0B', label: '55–64% — Moderate' },
                { color: '#F43F5E', label: '< 55% — Weak' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7A90' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
