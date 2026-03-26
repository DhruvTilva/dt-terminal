'use client'

import Link from 'next/link'
import AuthLayout from '@/components/auth/AuthLayout'

export default function ResetSuccessPage() {
  return (
    <AuthLayout>
      <div className="text-center py-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#E6EDF3', marginBottom: 8 }}>
          Password updated successfully
        </h1>
        <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.6, marginBottom: 28 }}>
          Your password has been changed. Sign in with your new password.
        </p>
        <Link href="/login" className="auth-btn-primary inline-block text-center">
          Login
        </Link>
      </div>
    </AuthLayout>
  )
}
