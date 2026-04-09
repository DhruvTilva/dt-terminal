'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const FEATURES = [
  {
    icon: '⚡',
    label: 'Trade Finder',
    desc: 'Smart latest opportunities across 7000+ stocks',
    highlight: true,
  },
  {
    icon: '📊',
    label: 'Long-Term Engine',
    desc: 'Deep stock analysis like mutual fund managers — fundamentals, risk & future growth insights',
    highlight: true,
  },
  {
    icon: '🤖',
    label: 'AI Prediction',
    desc: 'Nightly ML predicts next-day direction with confidence score',
  },
  {
    icon: '📌',
    label: 'Personal Watchlist',
    desc: 'Track your favorite stocks with live prices',
  },
  {
    icon: '🔔',
    label: 'Alerts & Bookmarks',
    desc: 'Save news and never miss a signal',
  },
]

export default function GuestLoginPopup() {
  const [show, setShow] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    let timer: ReturnType<typeof setTimeout>

    const startTimer = (delay: number) => {
      timer = setTimeout(() => {
        const attempts = Number(sessionStorage.getItem('popup_attempts') || '0')
        const done = sessionStorage.getItem('popup_done') === 'true'

        if (!done && attempts < 2) {
          setShow(true)
        }
      }, delay)
    }

    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) {
        sessionStorage.setItem('popup_done', 'true')
        return
      }

      const done = sessionStorage.getItem('popup_done') === 'true'
      const attempts = Number(sessionStorage.getItem('popup_attempts') || '0')

      if (done || attempts >= 2) return

      startTimer(60000)
    })

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])


  const dismiss = () => {
    setShow(false)

    let attempts = Number(sessionStorage.getItem('popup_attempts') || '0')
    attempts += 1

    sessionStorage.setItem('popup_attempts', String(attempts))

    if (attempts >= 2) {
      sessionStorage.setItem('popup_done', 'true')
    } else {
      // schedule second popup after 60 sec
      setTimeout(() => {
        const done = sessionStorage.getItem('popup_done') === 'true'
        if (!done) setShow(true)
      }, 60000)
    }
  }

  const handleLogin = () => {
    sessionStorage.setItem('popup_done', 'true')
    router.push('/login')
  }

  if (!show) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={dismiss}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-sm animate-slide-up"
        style={{
          background: 'linear-gradient(180deg, #151F32 0%, #0F1828 100%)',
          border: '1px solid #263042',
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute flex items-center justify-center rounded-full transition-colors hover:bg-bg-hover"
          style={{
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            color: '#6B7A90',
            fontSize: 13,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid #263042',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <div style={{ padding: '28px 24px 24px' }}>

          {/* Icon badge */}
          <div className="flex justify-center mb-5">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(59,130,246,0.12) 100%)',
                border: '1px solid rgba(59,130,246,0.2)',
                fontSize: 28,
              }}
            >
              🚀
            </div>
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#E6EDF3',
              letterSpacing: '-0.4px',
              textAlign: 'center',
              marginBottom: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Unlock Full Power
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 13,
              color: '#9FB0C0',
              textAlign: 'center',
              lineHeight: 1.6,
              marginBottom: 20,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Login to access powerful features<br />
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            {FEATURES.map((f) => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: (f as { highlight?: boolean }).highlight ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.025)',
                  border: (f as { highlight?: boolean }).highlight ? '1px solid rgba(167,139,250,0.25)' : '1px solid #263042',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#E6EDF3',
                      marginBottom: 2,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {f.label}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#6B7A90',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: 1.4,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleLogin}
            className="w-full transition-all"
            style={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              padding: '13px 20px',
              borderRadius: 10,
              fontFamily: 'var(--font-sans)',
              letterSpacing: '-0.1px',
              boxShadow: '0 4px 16px rgba(34,197,94,0.25)',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.92'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Login Now →
          </button>

          {/* Secondary dismiss */}
          <button
            onClick={dismiss}
            className="w-full transition-colors"
            style={{
              marginTop: 10,
              fontSize: 12,
              color: '#6B7A90',
              fontFamily: 'var(--font-mono)',
              background: 'transparent',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#9FB0C0' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6B7A90' }}
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}
