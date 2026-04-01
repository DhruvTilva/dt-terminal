'use client'

import Header from '@/components/layout/Header'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function CreatorPage() {
  const [copied, setCopied] = useState(false)

  const copyUPI = () => {
    navigator.clipboard?.writeText('tilvadhruv8-2@okaxis')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto bg-bg-primary" style={{ fontFamily: 'var(--font-sans)' }}>
      <Header />

      <main className="flex justify-center px-4 py-10 md:py-16">
        <div className="w-full" style={{ maxWidth: 560 }}>

          {/* ── Page title ── */}
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 10 }}>ABOUT</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
              Meet the Creator
            </h1>
          </div>

          {/* ── Creator card ── */}
          <div
            style={{
              background: '#121A2B', border: '1px solid #1E2A3B',
              borderRadius: 12, padding: '20px',
              display: 'flex', alignItems: 'center', gap: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                flexShrink: 0, width: 52, height: 52,
                borderRadius: '50%', fontSize: 20, fontWeight: 800,
                background: 'linear-gradient(135deg, #1E3A5F 0%, #1E2E4A 100%)',
                border: '2px solid #263042', color: '#3B82F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              D
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.2px' }}>Dhruv Tilva</p>
              <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                DT · Founder, DT&apos;s Terminal
              </p>
              <p style={{ fontSize: 13, color: '#9FB0C0', marginTop: 8, lineHeight: 1.6 }}>
                Built with passion for traders who hate missing opportunities.
              </p>
            </div>
          </div>

          {/* ── About the project ── */}
          <div
            style={{
              background: '#121A2B', border: '1px solid #1E2A3B',
              borderRadius: 12, padding: '20px',
              marginBottom: 12,
            }}
          >
            <p className="section-label" style={{ marginBottom: 10 }}>ABOUT THE PROJECT</p>
            <p style={{ fontSize: 14, color: '#9FB0C0', lineHeight: 1.75 }}>
              DT&apos;s Terminal is built to help traders find the right information at the right time.
            </p>
            <p style={{ fontSize: 14, color: '#9FB0C0', lineHeight: 1.75, marginTop: 10 }}>
              It&apos;s an independent project focused on making trading decisions clearer and faster — no subscriptions, no paywalls.
            </p>
          </div>

          {/* ── Links ── */}
          <div
            style={{
              background: '#121A2B', border: '1px solid #1E2A3B',
              borderRadius: 12, padding: '20px',
              marginBottom: 12,
            }}
          >
            <p className="section-label" style={{ marginBottom: 12 }}>LINKS</p>
            <Link
              href="https://github.com/DhruvTilva/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 transition-colors hover:bg-bg-hover"
              style={{
                padding: '10px 14px', borderRadius: 8,
                border: '1px solid #263042', color: '#E6EDF3',
                fontSize: 13, fontWeight: 500,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              github.com/DhruvTilva
            </Link>
          </div>

          {/* ── Support ── */}
          <div
            style={{
              background: '#121A2B', border: '1px solid #1E2A3B',
              borderRadius: 12, padding: '20px',
              marginBottom: 24,
            }}
          >
            <p className="section-label" style={{ marginBottom: 8 }}>SUPPORT THE PROJECT</p>
            <p style={{ fontSize: 12, color: '#6B7A90', lineHeight: 1.65, marginBottom: 18 }}>
              DT&apos;s Terminal is free to use. If it helps you, supporting the project keeps it growing — completely optional.
            </p>

            {/* GitHub Sponsor */}
            <Link
              href="https://github.com/sponsors/DhruvTilva"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 8,
                background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
                color: '#3B82F6', fontSize: 13, fontWeight: 600,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Sponsor on GitHub
            </Link>

            {/* Divider */}
            <div className="flex items-center gap-3" style={{ margin: '18px 0' }}>
              <div className="flex-1 h-px" style={{ background: '#1E2A3B' }} />
              <span style={{ fontSize: 10, color: '#354558', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: '#1E2A3B' }} />
            </div>

            {/* UPI section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <p style={{ fontSize: 11, color: '#6B7A90', fontFamily: 'var(--font-mono)' }}>UPI · Scan to support</p>

              {/* QR */}
              <div
                style={{
                  background: '#fff', padding: 10, borderRadius: 10,
                  border: '1px solid #263042', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <Image
                  src="/qr-upi.png"
                  alt="UPI QR Code"
                  width={160}
                  height={160}
                  style={{ display: 'block', borderRadius: 4 }}
                />
              </div>

              {/* UPI ID copy */}
              <button
                onClick={copyUPI}
                className="flex items-center gap-2 transition-colors hover:bg-bg-hover"
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: '#0F1828', border: '1px solid #263042',
                }}
              >
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#9FB0C0' }}>
                  tilvadhruv8-2@okaxis
                </span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: copied ? '#22C55E' : '#354558' }}>
                  {copied ? '✓ copied' : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </span>
              </button>

              <p style={{ fontSize: 11, color: '#354558', fontFamily: 'var(--font-mono)' }}>
                Any amount is appreciated · No pressure
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 24 }}>
            <p style={{ fontSize: 11, color: '#354558', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
              Built in India · For Indian traders · By DT
            </p>
            <p style={{ fontSize: 11, color: '#354558', fontFamily: 'var(--font-mono)', textAlign: 'center', lineHeight: 1.6 }}>
              ⚠️ Built to assist decisions, not make them for you. Always trade at your own risk.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
