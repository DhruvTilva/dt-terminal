import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "DT's Terminal — Free NSE/BSE Stock Scanner & AI Predictions",
  description: "Free stock scanner for Indian traders. Get intraday & swing trade setups, AI-powered NSE/BSE predictions, live Nifty 50 data, and market signals — no subscription needed.",
  openGraph: {
    title: "DT's Terminal — Free NSE/BSE Stock Scanner & AI Predictions",
    description: "Free stock scanner for Indian traders. AI predictions, intraday signals, swing setups — NSE/BSE. No login required.",
    url: '/',
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col overflow-x-hidden" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <header className="w-full px-5 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between border-b border-border-primary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green live-dot flex-shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.3px' }}>
            DT&apos;s <span style={{ color: '#3B82F6' }}>Terminal</span>
          </span>
        </div>
        <Link
          href="/login"
          style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: '#9FB0C0',
            border: '1px solid #1E2A3A',
            padding: '6px 14px',
            borderRadius: 6,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
          className="hover:border-border-secondary hover:text-text-primary transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-6 pt-10 pb-8 sm:py-16 text-center w-full">

        {/* Live pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 sm:mb-8"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green live-dot" />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#22C55E', letterSpacing: '0.08em' }}>
            LIVE · NSE &amp; BSE
          </span>
        </div>

        {/* Title — no forced line break on mobile, natural wrap */}
        <h1
          className="mb-3 sm:mb-4 w-full max-w-[340px] sm:max-w-2xl mx-auto"
          style={{
            fontSize: 'clamp(1.6rem, 8vw, 3.25rem)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
            color: '#E6EDF3',
          }}
        >
          Real-time Indian Market{' '}
          <span className="sm:block" style={{ color: '#3B82F6' }}>Intelligence for Traders</span>
        </h1>

        {/* Subtext */}
        <p
          className="mb-7 sm:mb-10 max-w-[300px] sm:max-w-md mx-auto"
          style={{ fontSize: 14, color: '#9FB0C0', lineHeight: 1.7 }}
        >
          Live prices, smart news, and auto-detected trade signals —
          all in one terminal.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3 mb-5 w-full max-w-[300px] sm:max-w-none sm:w-auto">
          <Link
            href="/dashboard"
            className="text-center transition-all hover:opacity-90"
            style={{
              background: '#22C55E',
              color: '#000',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 13,
              padding: '13px 28px',
              borderRadius: 8,
              letterSpacing: '0.03em',
              display: 'block',
            }}
          >
            Enter Terminal →
          </Link>
          <Link
            href="/login"
            className="text-center transition-all hover:text-text-primary"
            style={{
              border: '1px solid #263042',
              color: '#9FB0C0',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              padding: '13px 28px',
              borderRadius: 8,
              display: 'block',
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Exchanges */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap mb-8 sm:mb-14 max-w-[320px] sm:max-w-none mx-auto">
          {['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NSE', 'BSE'].map((tag, i, arr) => (
            <span key={tag} className="flex items-center gap-1.5">
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.06em' }}>
                {tag}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: '#263042', fontSize: 12 }}>·</span>
              )}
            </span>
          ))}
        </div>

        {/* ── Feature cards ─────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:gap-4 w-full" style={{ maxWidth: 820, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          {[
            {
              icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                </svg>
              ),
              color: '#22C55E',
              label: 'Live Data',
              desc: 'Real-time prices for NSE & BSE stocks with fast updates.',
            },
            {
              icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" /><path d="M2 20a2 2 0 0 0 2 2h12" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
                </svg>
              ),
              color: '#3B82F6',
              label: 'Smart News',
              desc: 'Market-moving news Only with Advance filtered and scored by impact.',
            },
            {
              icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              color: '#F59E0B',
              label: 'Trade Signals',
              desc: 'Scans all stocks through price, volume & breakout filters,surfaces ready-to-act setups instantly.',
            },
            {
              icon: (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2" /><circle cx="18" cy="6" r="3" fill="#A78BFA" stroke="none" /><path d="M16.5 4.5 18 6l1.5-1.5" stroke="#0B1220" strokeWidth="1.5" />
                </svg>
              ),
              color: '#A78BFA',
              label: 'ML Prediction',
              desc: 'Nightly AI predicts next-day direction for signal stocks-with confidence % and auto-graded accuracy.',
            },
          ].map(f => (
            <div key={f.label} className="feature-card text-left rounded-xl p-6 sm:p-7">
              <div
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg mb-4"
                style={{ background: `${f.color}14`, border: `1px solid ${f.color}22` }}
              >
                {f.icon}
              </div>
              <div className="mb-2" style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}>
                {f.label}
              </div>
              <div style={{ fontSize: 12, color: '#6B7A90', lineHeight: 1.7 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-5 sm:px-8 py-3.5 flex items-center justify-between border-t border-border-primary">
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#4A5568' }}>
          DT&apos;s Terminal
        </span>
        <span className="hidden sm:inline" style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#4A5568' }}>
          Built for traders who hate missing opportunities
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#4A5568' }}>
          NSE · BSE
        </span>
      </footer>

    </div>
  )
}
