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
        <div className="text-center py-6">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', marginBottom: 8 }}>Reset link sent</h1>
          <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.6, marginBottom: 24 }}>
            Check your inbox at<br />
            <span style={{ color: '#E6EDF3', fontWeight: 500 }}>{email}</span>
          </p>
          <Link href="/login" className="auth-btn-primary inline-block text-center">
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 13, color: '#6B7A90' }}>
          Enter your email and we&apos;ll send a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg px-4 py-3"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <span style={{ color: '#F43F5E', fontSize: 13, marginTop: 1 }}>✕</span>
            <span style={{ fontSize: 13, color: '#F43F5E', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="yourmail@gmail.com"
            required
            className="auth-input"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="auth-spinner" />
              Sending…
            </span>
          ) : 'Send Reset Link'}
        </button>
      </form>

      <p className="text-center mt-8" style={{ fontSize: 13, color: '#6B7A90' }}>
        <Link href="/login" style={{ color: '#3B82F6' }} className="hover:underline">
          ← Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
