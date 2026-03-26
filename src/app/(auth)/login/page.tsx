'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); return }

      // Check if user is blocked
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', authData.user.id)
        .single()

      if (profile?.is_blocked) {
        await supabase.auth.signOut()
        setError('Your account has been suspended. Contact support for assistance.')
        return
      }

      router.push('/dashboard'); router.refresh()
    } catch { setError('Connection failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 13, color: '#6B7A90' }}>
          Sign in to your DT&apos;s Terminal account
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
            placeholder="you@gmail.com"
            required
            className="auth-input"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0' }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 12, color: '#3B82F6' }} className="hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
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
        <button
          type="submit"
          disabled={loading}
          className="auth-btn-primary"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="auth-spinner" />
              Signing in…
            </span>
          ) : 'Sign In →'}
        </button>
      </form>

      {/* Demo */}
      <button
        onClick={() => router.push('/dashboard')}
        className="auth-btn-secondary mt-3"
      >
        Guest Mode — no login required
      </button>

      {/* Footer link */}
      <p className="text-center mt-8" style={{ fontSize: 13, color: '#6B7A90' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" style={{ color: '#3B82F6' }} className="hover:underline font-medium">
          Create account
        </Link>
      </p>
    </AuthLayout>
  )
}
