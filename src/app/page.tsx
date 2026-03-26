import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── Nav bar ─────────────────────────────────────────────────────── */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border-primary">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green live-dot flex-shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.3px' }}>
            DT&apos;s <span style={{ color: '#3B82F6' }}>Terminal</span>
          </span>
        </div>
        <Link
          href="/login"
          className="text-text-muted hover:text-text-primary transition-colors"
          style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}
        >
          Sign In
        </Link>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">

        {/* Live pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-8"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green live-dot" />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#22C55E', letterSpacing: '0.08em' }}>
            LIVE · NSE &amp; BSE
          </span>
        </div>

        {/* Title */}
        <h1
          className="mb-4"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            lineHeight: 1.15,
            color: '#E6EDF3',
          }}
        >
          Real-time Indian Market
          <br />
          <span style={{ color: '#3B82F6' }}>Intelligence for Traders</span>
        </h1>

        {/* Subtext */}
        <p
          className="mb-10 max-w-sm mx-auto"
          style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: '#9FB0C0', lineHeight: 1.7 }}
        >
          Live prices, smart news, and auto-detected trade signals —
          all in one terminal.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center transition-opacity hover:opacity-90"
            style={{
              background: '#22C55E',
              color: '#000',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              fontSize: 13,
              padding: '11px 28px',
              borderRadius: 6,
              letterSpacing: '0.03em',
            }}
          >
            Enter Terminal →
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-center transition-colors hover:text-text-primary"
            style={{
              border: '1px solid #263042',
              color: '#9FB0C0',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              padding: '11px 28px',
              borderRadius: 6,
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Exchanges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-16">
          {['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NSE', 'BSE'].map((tag, i, arr) => (
            <span key={tag} className="flex items-center gap-2">
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.06em' }}>
                {tag}
              </span>
              {i < arr.length - 1 && (
                <span style={{ color: '#263042', fontSize: 12 }}>·</span>
              )}
            </span>
          ))}
        </div>

        {/* ── Feature cards ─────────────────────────────────────────────── */}
        <div
          className="grid gap-5 w-full"
          style={{
            maxWidth: 760,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}
        >
          {[
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
                </svg>
              ),
              label: 'Live Data',
              desc: 'Real-time prices for NSE stocks with fast updates.',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" /><path d="M2 20a2 2 0 0 0 2 2h12" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="12" y2="14" />
                </svg>
              ),
              label: 'Smart News',
              desc: 'Market-moving news filtered and tagged by impact.',
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              ),
              label: 'Trade Signals',
              desc: 'Auto-detected opportunities based on price and volume.',
            },
          ].map(f => (
            <div
              key={f.label}
              className="feature-card text-left rounded-xl p-5"
            >
              <div className="mb-3">{f.icon}</div>
              <div
                className="mb-1.5"
                style={{ fontSize: 13, fontWeight: 600, color: '#E6EDF3' }}
              >
                {f.label}
              </div>
              <div style={{ fontSize: 12, color: '#6B7A90', lineHeight: 1.6 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border-primary"
      >
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
          DT&apos;s Terminal
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
          Built for traders who hate missing opportunities
        </span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#6B7A90' }}>
          NSE · BSE
        </span>
      </footer>

    </div>
  )
}
