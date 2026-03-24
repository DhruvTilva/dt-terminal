'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setSuccess(true)
    } catch { setError('Connection failed') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <h1 className="text-lg font-bold text-text-primary mb-2">Check your email</h1>
          <p className="text-xs font-[family-name:var(--font-mono)] text-text-muted mb-4">Reset link sent to {email}</p>
          <Link href="/login" className="text-xs font-[family-name:var(--font-mono)] text-blue hover:underline">← Back to login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-text-primary mb-0.5">Reset Password</h1>
          <p className="text-xs font-[family-name:var(--font-mono)] text-text-muted">Enter your email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-xs font-[family-name:var(--font-mono)] text-red bg-red-dim px-3 py-2 rounded">{error}</div>
          )}

          <div>
            <label className="text-[10px] font-[family-name:var(--font-mono)] text-text-muted uppercase tracking-wider block mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-tertiary border border-border-primary rounded px-3 py-2 text-sm text-text-primary font-[family-name:var(--font-mono)] focus:outline-none focus:border-blue" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue text-white rounded py-2 text-sm font-[family-name:var(--font-mono)] font-medium hover:bg-blue/90 transition-colors disabled:opacity-50">
            {loading ? 'SENDING...' : 'SEND RESET LINK'}
          </button>
        </form>

        <p className="text-center text-xs font-[family-name:var(--font-mono)] text-text-muted mt-6">
          <Link href="/login" className="text-blue hover:underline">← Back to login</Link>
        </p>
      </div>
    </div>
  )
}
