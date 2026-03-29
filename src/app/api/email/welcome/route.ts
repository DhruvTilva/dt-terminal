import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()
    if (!email) return NextResponse.json({ ok: false }, { status: 400 })

    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) return NextResponse.json({ ok: false }, { status: 500 })

    const displayName = name || 'Trader'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://trade-central.vercel.app'

    const html = `
<div style="background:#0d1117;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#161b22;border:1px solid #30363d;border-radius:12px;overflow:hidden;">

    <div style="padding:32px 32px 24px;">
      <div style="font-size:22px;font-weight:700;color:#f0f6fc;margin-bottom:4px;">🔒 DT's Terminal</div>
      <hr style="border:none;border-top:1px solid #21262d;margin:16px 0;">

      <h2 style="color:#f0f6fc;font-size:18px;font-weight:600;margin:0 0 10px;">
        Welcome, ${displayName} 👋
      </h2>
      <p style="color:#8b949e;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Your account is ready. You now have full access to everything DT's Terminal offers —
        live NSE data, AI-powered signals, and a free stock scanner built for Indian traders.
      </p>

      <div style="background:#0d1117;border:1px solid #21262d;border-radius:8px;padding:16px 18px;margin-bottom:24px;">
        <p style="color:#8b949e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Where to start</p>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:15px;margin-top:1px;">📊</span>
            <div>
              <p style="color:#f0f6fc;font-size:13px;font-weight:600;margin:0 0 2px;">Live Dashboard</p>
              <p style="color:#8b949e;font-size:12px;margin:0;">Real-time Nifty 50, top movers, AI market pulse</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:15px;margin-top:1px;">🔍</span>
            <div>
              <p style="color:#f0f6fc;font-size:13px;font-weight:600;margin:0 0 2px;">Trade Finder</p>
              <p style="color:#8b949e;font-size:12px;margin:0;">Scan NSE stocks for intraday &amp; swing setups</p>
            </div>
          </div>
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:15px;margin-top:1px;">🤖</span>
            <div>
              <p style="color:#f0f6fc;font-size:13px;font-weight:600;margin:0 0 2px;">AI Predictions</p>
              <p style="color:#8b949e;font-size:12px;margin:0;">Nightly ML predictions with confidence scores</p>
            </div>
          </div>
        </div>
      </div>

      <a href="${siteUrl}/dashboard"
         style="display:inline-block;background:#2563eb;color:#ffffff;font-size:15px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Open DT's Terminal →
      </a>

      <p style="color:#6e7681;font-size:13px;margin:24px 0 0;line-height:1.6;">
        Everything is free. No subscription, no hidden limits.<br/>
        If you ever have feedback, just reply to this email.
      </p>
    </div>

    <div style="background:#1c2128;border-top:1px solid #21262d;padding:16px 32px;">
      <p style="color:#f0883e;font-size:12px;font-weight:600;margin:0 0 4px;">📬 Looks like this landed in your Spam folder?</p>
      <p style="color:#8b949e;font-size:12px;margin:0;line-height:1.5;">
        This happens because we're a new sender — not because anything is wrong.
        Please click <strong style="color:#e6edf3;">"Not spam"</strong> so future emails reach you directly.
        We will never send promotional emails. Only account-related emails.
      </p>
    </div>

  </div>
  <p style="text-align:center;color:#484f58;font-size:11px;margin-top:20px;">
    DT's Terminal · trade-central.vercel.app
  </p>
</div>`

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender:      { name: "DT's Terminal", email: process.env.BREVO_SENDER_EMAIL || 'tilvadhruv8@gmail.com' },
        to:          [{ email }],
        subject:     "Welcome to DT's Terminal 🔒",
        htmlContent: html,
      }),
    })

    const body = await res.json().catch(() => ({}))
    console.log('[welcome-email] status:', res.status, 'body:', JSON.stringify(body))
    return NextResponse.json({ ok: res.ok, status: res.status, body })
  } catch (err) {
    console.log('[welcome-email] catch error:', err)
    return NextResponse.json({ ok: false })
  }
}
