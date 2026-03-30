import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary flex" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* ── Left branding panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[380px] xl:w-[420px] flex-col shrink-0"
        style={{
          background: 'linear-gradient(160deg, #0F1A2E 0%, #0B1220 60%, #0D1829 100%)',
          borderRight: '1px solid #1E2A3A',
          padding: '44px 40px',
        }}
      >
        {/* Logo — pinned to top */}
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green live-dot shrink-0" />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.4px' }}>
            DT&apos;s <span style={{ color: '#3B82F6' }}>Terminal</span>
          </span>
        </Link>

        {/* Centered content block */}
        <div className="flex-1 flex flex-col justify-center gap-8">

          {/* Tagline */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', lineHeight: 1.35, letterSpacing: '-0.4px', marginBottom: 12 }}>
              Real-time Indian<br />Market Intelligence
            </h2>
            <p style={{ fontSize: 13.5, color: '#7A8FA8', lineHeight: 1.7 }}>
              Live prices, smart news, and auto-detected trade signals — all in one terminal.
            </p>
          </div>

          {/* Decorative chart SVG */}
          <div style={{ opacity: 0.2 }}>
            <svg viewBox="0 0 380 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              {[0, 30, 60, 90, 120].map(y => (
                <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#263042" strokeWidth="1" />
              ))}
              <path d="M0 90 L40 75 L80 80 L120 55 L160 60 L200 35 L240 45 L280 20 L320 30 L360 10 L380 15 L380 120 L0 120Z" fill="url(#areaGrad)" opacity="0.4"/>
              <path d="M0 90 L40 75 L80 80 L120 55 L160 60 L200 35 L240 45 L280 20 L320 30 L360 10 L380 15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M0 100 L40 88 L80 92 L120 72 L160 78 L200 58 L240 65 L280 45 L320 52 L360 35 L380 40" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" fill="none"/>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-4">
            {[
              { icon: '▲', color: '#22C55E', text: 'Live NSE & BSE prices, refreshed every 60s' },
              { icon: '◈', color: '#3B82F6', text: 'Smart news scored by market impact' },
              { icon: '⚡', color: '#F59E0B', text: 'Auto-detected breakouts & trade signals' },
            ].map(f => (
              <div key={f.text} className="flex items-start gap-3">
                <span style={{ fontSize: 11, color: f.color, marginTop: 3, flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: 13, color: '#6B7A90', lineHeight: 1.6 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Exchange tags */}
          <div style={{ fontSize: 10.5, color: '#2D3E52', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            NSE · BSE · NIFTY · SENSEX · BANKNIFTY
          </div>
          <div style={{ fontSize: 10.5, color: '#2D3E52', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
            ⚠️ Built to assist decisions, not make them for you. Always trade at your own risk.
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-start lg:justify-center px-6 pt-12 pb-10 sm:px-10 lg:py-10">
        {/* Mobile-only logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-8">
          <span className="w-2.5 h-2.5 rounded-full bg-green live-dot" />
          <span style={{ fontSize: 24, fontWeight: 800, color: '#E6EDF3', letterSpacing: '-0.4px' }}>
            DT&apos;s <span style={{ color: '#3B82F6' }}>Terminal</span>
          </span>
        </Link>

        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>

    </div>
  )
}
