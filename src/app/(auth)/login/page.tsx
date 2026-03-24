'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/dashboard'); router.refresh() }
    } catch { setError('Connection failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-text-primary mb-0.5">Sign In</h1>
          <p className="text-xs font-[family-name:var(--font-mono)] text-text-muted">DT&apos;s Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-xs font-[family-name:var(--font-mono)] text-red bg-red-dim px-3 py-2 rounded">{error}</div>
          )}

          <div>
            <label className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted uppercase tracking-wider block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue font-[family-name:var(--font-mono)]"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted uppercase tracking-wider block mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 pr-12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-blue font-[family-name:var(--font-mono)]"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-[family-name:var(--font-mono)] text-text-muted hover:text-text-secondary">
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          <div className="text-right">
            <Link href="/forgot-password" className="text-[10px] font-[family-name:var(--font-mono)] text-blue hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-black rounded py-2 text-sm font-[family-name:var(--font-mono)] font-semibold hover:bg-green/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'CONNECTING...' : 'SIGN IN →'}
          </button>
        </form>

        <button
          onClick={() => router.push('/dashboard')}
          className="w-full mt-2 border border-border-secondary text-text-muted rounded py-2 text-xs font-[family-name:var(--font-mono)] hover:text-text-secondary hover:border-text-muted transition-colors"
        >
          DEMO MODE (No login)
        </button>

        <p className="text-center text-xs font-[family-name:var(--font-mono)] text-text-muted mt-6">
          No account?{' '}
          <Link href="/signup" className="text-blue hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
