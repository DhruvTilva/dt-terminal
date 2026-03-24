import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-1">
            DT&apos;s Terminal
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green live-dot" />
            <span className="text-xs font-[family-name:var(--font-mono)] text-text-muted uppercase tracking-widest">
              Indian Market Intelligence
            </span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm text-text-secondary mb-8 leading-relaxed font-[family-name:var(--font-mono)]">
          Real-time data · Smart news · Trade signals
          <br />
          <span className="text-text-muted">NSE · BSE · NIFTY · SENSEX · BANKNIFTY</span>
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <Link
            href="/dashboard"
            className="bg-green text-black px-6 py-2 rounded text-sm font-[family-name:var(--font-mono)] font-semibold hover:bg-green/90 transition-colors"
          >
            ENTER TERMINAL →
          </Link>
          <Link
            href="/login"
            className="border border-border-secondary text-text-secondary px-6 py-2 rounded text-sm font-[family-name:var(--font-mono)] hover:text-text-primary hover:border-text-muted transition-colors"
          >
            SIGN IN
          </Link>
        </div>

        {/* Features grid — minimal */}
        <div className="grid grid-cols-3 gap-4 text-left">
          {[
            { label: 'LIVE DATA', desc: '30+ NSE stocks, indices' },
            { label: 'SMART NEWS', desc: 'Sentiment tagged, filtered' },
            { label: 'SIGNALS', desc: 'Breakouts, volume, gaps' },
          ].map(f => (
            <div key={f.label}>
              <div className="text-[9px] font-[family-name:var(--font-mono)] text-green uppercase tracking-widest mb-0.5">
                {f.label}
              </div>
              <div className="text-[11px] font-[family-name:var(--font-mono)] text-text-muted">
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-6 bg-bg-secondary border-t border-border-primary flex items-center justify-center">
        <span className="text-[9px] font-[family-name:var(--font-mono)] text-text-muted">
          Built for traders who hate missing opportunities
        </span>
      </div>
    </div>
  )
}
