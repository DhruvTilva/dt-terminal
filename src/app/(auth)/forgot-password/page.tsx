'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/auth/AuthLayout'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?type=recovery` })
      if (error) setError(error.message)
      else setSuccess(true)
    } catch { setError('Connection failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', marginBottom: 8 }}>Reset link sent</h1>
          <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.6, marginBottom: 4 }}>
            Check your inbox at
          </p>
          <p style={{ fontSize: 14, color: '#E6EDF3', fontWeight: 500, marginBottom: 16 }}>{email}</p>
          <div
            className="rounded-lg px-4 py-3 text-left"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', marginBottom: 16 }}
          >
            <p style={{ fontSize: 12, color: '#CA8A04', lineHeight: 1.6, margin: 0 }}>
              <span style={{ fontWeight: 600 }}>Didn&apos;t receive the email?</span> No worries — check your <strong>Spam</strong> or <strong>Junk</strong> folder. Gmail may show a safety warning for new senders, that&apos;s completely normal 😊 Just click <strong>&quot;Looks safe&quot;</strong> and open the email to continue.
            </p>
          </div>
          <Link href="/login" className="auth-btn-primary">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.4px', marginBottom: 5 }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 13.5, color: '#6B7A90', lineHeight: 1.5 }}>
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-xl px-4 py-3"
            style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.18)' }}
          >
            <span style={{ color: '#F43F5E', fontSize: 13, marginTop: 1 }}>✕</span>
            <span style={{ fontSize: 13, color: '#F43F5E', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 12, fontWeight: 500, color: '#7A8FA8' }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@gmail.com"
            required
            className="auth-input"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: 2 }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="auth-spinner" />
              Sending…
            </span>
          ) : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center" style={{ fontSize: 13, color: '#6B7A90', marginTop: 20 }}>
        <Link href="/login" style={{ color: '#3B82F6' }} className="hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
