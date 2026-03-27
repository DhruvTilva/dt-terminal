'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/auth/AuthLayout'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function SignupPage() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { name },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?type=signup`,
        },
      })
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
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', marginBottom: 8 }}>Check your inbox</h1>
          <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.6, marginBottom: 16 }}>
            We sent a confirmation link to<br />
            <span style={{ color: '#E6EDF3', fontWeight: 500 }}>{email}</span>
          </p>
          <p style={{ fontSize: 13, color: '#6B7A90', lineHeight: 1.6, marginBottom: 16 }}>
            Click the link in the email to activate your account, then sign in.
          </p>
          <div
            className="rounded-lg px-4 py-3 mb-6 text-left"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
          >
            <p style={{ fontSize: 12, color: '#CA8A04', lineHeight: 1.6, margin: 0 }}>
              <span style={{ fontWeight: 600 }}>Didn&apos;t receive the email?</span> No worries — check your <strong>Spam</strong> or <strong>Junk</strong> folder. Gmail may show a safety warning for new senders, that&apos;s completely normal 😊 Just click <strong>&quot;Looks safe&quot;</strong> and open the email to continue.
            </p>
          </div>
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
          Create your account
        </h1>
        <p style={{ fontSize: 13, color: '#6B7A90' }}>
          Join DT&apos;s Terminal — free to get started
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

        {/* Name */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Future Market Legend"
            required
            className="auth-input"
          />
        </div>

        {/* Email */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="next.warren.buffet@gmail.com"
            required
            className="auth-input"
          />
        </div>

        {/* Password */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            Password
            <span style={{ color: '#6B7A90', fontWeight: 400, marginLeft: 6 }}>min 6 characters</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="No ‘123456’, please 😅"
              required
              className="auth-input pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="auth-btn-primary mt-3">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="auth-spinner" />
              Creating account…
            </span>
          ) : 'Create Account →'}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center mt-8" style={{ fontSize: 13, color: '#6B7A90' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#3B82F6' }} className="hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
