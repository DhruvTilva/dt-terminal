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
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback` },
    })
  }

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
        <div className="text-center" style={{ paddingTop: 8, paddingBottom: 8 }}>
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', marginBottom: 8 }}>Check your inbox</h1>
          <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.6, marginBottom: 4 }}>
            We sent a confirmation link to
          </p>
          <p style={{ fontSize: 14, color: '#E6EDF3', fontWeight: 500, marginBottom: 12 }}>{email}</p>
          <p style={{ fontSize: 13, color: '#6B7A90', lineHeight: 1.6, marginBottom: 14 }}>
            Click the link in the email to activate your account, then sign in.
          </p>
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
          Create your account
        </h1>
        <p style={{ fontSize: 13.5, color: '#6B7A90', lineHeight: 1.5 }}>
          Join DT&apos;s Terminal — free to get started
        </p>
      </div>

      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="auth-google-btn"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="auth-divider" style={{ margin: '14px 0' }}>
        <div className="auth-divider-line" />
        <span className="auth-divider-text">or sign up with email</span>
        <div className="auth-divider-line" />
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

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 12, fontWeight: 500, color: '#7A8FA8' }}>
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your Good Name"
            required
            className="auth-input"
          />
        </div>

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

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label style={{ fontSize: 12, fontWeight: 500, color: '#7A8FA8' }}>
            Password <span style={{ color: '#4A5568', fontWeight: 400 }}>— min 6 characters</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="No 123456 please 😅"
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
        <button type="submit" disabled={loading} className="auth-btn-primary" style={{ marginTop: 2 }}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="auth-spinner" />
              Creating account…
            </span>
          ) : 'Create Account →'}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center" style={{ fontSize: 13, color: '#6B7A90', marginTop: 20 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#3B82F6' }} className="hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
