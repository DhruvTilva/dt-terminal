'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthLayout from '@/components/auth/AuthLayout'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) setError(error.message)
      else router.push('/auth/reset-success')
    } catch { setError('Connection failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#E6EDF3', letterSpacing: '-0.3px', marginBottom: 6 }}>
          Set new password
        </h1>
        <p style={{ fontSize: 13, color: '#6B7A90' }}>
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div
            className="flex items-start gap-2.5 rounded-lg px-4 py-3"
            style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
          >
            <span style={{ color: '#F43F5E', fontSize: 13, marginTop: 1 }}>✕</span>
            <span style={{ fontSize: 13, color: '#F43F5E', lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            New password
            <span style={{ color: '#6B7A90', fontWeight: 400, marginLeft: 6 }}>min 6 characters</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="auth-input"
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: '#9FB0C0', display: 'block', marginBottom: 6 }}>
            Confirm password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="auth-input"
          />
        </div>

        <button type="submit" disabled={loading} className="auth-btn-primary">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="auth-spinner" />
              Updating…
            </span>
          ) : 'Update Password →'}
        </button>
      </form>
    </AuthLayout>
  )
}
