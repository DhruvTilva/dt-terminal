'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type User = {
  id: string
  email: string
  name: string
  is_admin: boolean
  is_blocked: boolean
  created_at: string
}

type Analytics = {
  total: number
  today: number
  activeNow: number
  mobilePct:    number | null
  topBrowser:   string | null
  topCountry:   string | null
  topPage:      string | null
  storageBytes: number
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 36, height: 20, borderRadius: 10,
        background: checked ? '#22C55E' : '#263042',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.4 : 1, flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2,
        left: checked ? 18 : 2, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
        display: 'block',
      }} />
    </button>
  )
}

function StatCard({ label, value, color, loading }: { label: string; value: number; color: string; loading: boolean }) {
  return (
    <div style={{
      background: '#121A2B', border: `1px solid ${color}22`,
      borderRadius: 8, padding: '14px 18px', flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: loading ? '#354558' : color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
        {loading ? '—' : value.toLocaleString()}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'blocked'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Send Notification state
  const [notifTarget, setNotifTarget] = useState<'all' | string>('all')
  const [notifMsg, setNotifMsg] = useState('')
  const [notifSending, setNotifSending] = useState(false)

  // Admin auth check
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) { router.replace('/dashboard'); return }
      setCurrentUserId(data.user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()
      if (!profile?.is_admin) { router.replace('/dashboard'); return }
      setAuthChecking(false)
    })
  }, [router])

  // Fetch analytics once auth is confirmed
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/admin/analytics')
      const data = await res.json()
      if (res.ok) setAnalytics(data)
    } catch { /* silent */ }
    setAnalyticsLoading(false)
  }, [])

  useEffect(() => {
    if (!authChecking) fetchAnalytics()
  }, [authChecking, fetchAnalytics])

  const fetchUsers = useCallback(async (q: string, f: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (f !== 'all') params.set('filter', f)
    try {
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      setUsers([])
    }
    setLoading(false)
  }, [])

  // Debounced fetch on search/filter change
  useEffect(() => {
    if (authChecking) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(search, filter), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, filter, authChecking, fetchUsers])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const toggleField = async (userId: string, field: 'is_admin' | 'is_blocked', value: boolean) => {
    setUpdatingId(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, field, value }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to update', 'error'); return }
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u))
      setHighlightId(userId)
      setTimeout(() => setHighlightId(null), 1200)
      showToast('User updated successfully')
    } catch {
      showToast('Connection failed', 'error')
    }
    setUpdatingId(null)
  }

  const sendNotification = async () => {
    if (!notifMsg.trim()) { showToast('Message cannot be empty', 'error'); return }
    setNotifSending(true)
    try {
      const body: { message: string; user_id?: string } = { message: notifMsg.trim() }
      if (notifTarget !== 'all') body.user_id = notifTarget
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to send', 'error'); return }
      setNotifMsg('')
      setNotifTarget('all')
      showToast(notifTarget === 'all' ? 'Sent to all users ✓' : 'Notification sent ✓')
    } catch {
      showToast('Connection failed', 'error')
    }
    setNotifSending(false)
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return '—' }
  }

  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1220', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#6B7A90', fontSize: 13, fontFamily: 'var(--font-mono)' }}>Verifying access…</span>
      </div>
    )
  }

  function formatBytes(bytes: number): string {
    if (bytes <= 0) return '—'
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0B1220', fontFamily: 'var(--font-sans)', color: '#E6EDF3' }}>

      {/* Header */}
      <div style={{ background: '#121A2B', borderBottom: '1px solid #263042', padding: '0 24px', height: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{ background: 'none', border: 'none', color: '#6B7A90', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-mono)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          ← Dashboard
        </button>
        <span style={{ color: '#354558' }}>|</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#E6EDF3', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>ADMIN PANEL</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Visitor Analytics Cards ── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Visitor Analytics
            </span>
            <button
              onClick={fetchAnalytics}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: '#3B82F6', padding: 0 }}
            >
              ↻ Refresh
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <StatCard label="Total Visitors" value={analytics?.total ?? 0}     color="#3B82F6" loading={analyticsLoading} />
            <StatCard label="Today"          value={analytics?.today ?? 0}     color="#F59E0B" loading={analyticsLoading} />
            <StatCard label="Active Now"     value={analytics?.activeNow ?? 0} color="#22C55E" loading={analyticsLoading} />
          </div>

          {/* Breakdown row */}
          {!analyticsLoading && analytics && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {/* Mobile */}
              <div style={{
                background: '#0B1220', border: '1px solid #263042',
                borderRadius: 6, padding: '7px 12px',
                display: 'flex', alignItems: 'center', gap: 7, minWidth: 120,
              }}>
                <span style={{ fontSize: 13 }}>📱</span>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mobile</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {analytics.mobilePct !== null ? `${analytics.mobilePct}%` : '—'}
                  </div>
                </div>
              </div>

              {/* Storage used */}
              <div style={{
                background: '#0B1220', border: '1px solid #263042',
                borderRadius: 6, padding: '7px 12px',
                display: 'flex', alignItems: 'center', gap: 7, minWidth: 140,
              }}>
                <span style={{ fontSize: 13 }}>🗄️</span>
                <div>
                  <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#354558', letterSpacing: '0.08em', textTransform: 'uppercase' }}>DB Storage</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9FB0C0', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                    {analytics.storageBytes > 0 ? formatBytes(analytics.storageBytes) : '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Send Notification ── */}
        <div style={{ background: '#121A2B', border: '1px solid #263042', borderRadius: 8, padding: '18px 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
            📣 Send Notification
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Recipient selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 220 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.05em' }}>SEND TO</label>
              <select
                value={notifTarget}
                onChange={e => setNotifTarget(e.target.value)}
                style={{
                  background: '#0B1220', border: '1px solid #263042',
                  color: '#E6EDF3', padding: '8px 10px', fontSize: 12,
                  borderRadius: 6, outline: 'none', fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">📢 All Users (Broadcast)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Message textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#6B7A90', letterSpacing: '0.05em' }}>MESSAGE</label>
              <textarea
                value={notifMsg}
                onChange={e => setNotifMsg(e.target.value)}
                placeholder="Type your notification message…"
                rows={2}
                style={{
                  background: '#0B1220', border: '1px solid #263042',
                  color: '#E6EDF3', padding: '8px 10px', fontSize: 13,
                  borderRadius: 6, outline: 'none', fontFamily: 'var(--font-sans)',
                  resize: 'vertical', lineHeight: 1.5,
                }}
              />
            </div>

            {/* Send button */}
            <button
              onClick={sendNotification}
              disabled={notifSending || !notifMsg.trim()}
              style={{
                padding: '10px 20px', fontSize: 12, fontFamily: 'var(--font-mono)',
                background: notifSending || !notifMsg.trim() ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: notifSending || !notifMsg.trim() ? '#354558' : '#3B82F6',
                borderRadius: 6, cursor: notifSending || !notifMsg.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
                whiteSpace: 'nowrap', height: 40,
              }}
            >
              {notifSending ? 'Sending…' : 'Send →'}
            </button>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              flex: 1, minWidth: 200, maxWidth: 320,
              background: '#121A2B', border: '1px solid #263042',
              color: '#E6EDF3', padding: '8px 12px', fontSize: 13,
              borderRadius: 6, outline: 'none', fontFamily: 'var(--font-sans)',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'admin', 'blocked'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', border: '1px solid',
                  borderColor: filter === f ? '#3B82F6' : '#263042',
                  background: filter === f ? 'rgba(59,130,246,0.1)' : 'transparent',
                  color: filter === f ? '#3B82F6' : '#6B7A90',
                  borderRadius: 5, cursor: 'pointer',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#6B7A90', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>
            {users.length} user{users.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Table */}
        <div style={{ background: '#121A2B', border: '1px solid #263042', borderRadius: 8, overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 320px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#121A2B' }}>
              <tr style={{ borderBottom: '1px solid #263042' }}>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Admin', 'Blocked'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 10, fontFamily: 'var(--font-mono)',
                    color: '#6B7A90', letterSpacing: '0.08em',
                    textTransform: 'uppercase', fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7A90', fontSize: 13 }}>
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: '#6B7A90', fontSize: 13 }}>
                    No users found
                  </td>
                </tr>
              ) : users.map(user => {
                const isSelf = user.id === currentUserId
                const isUpdating = updatingId === user.id
                const isHighlighted = highlightId === user.id
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #1A2336',
                      background: isHighlighted ? 'rgba(59,130,246,0.05)' : 'transparent',
                      transition: 'background 0.5s',
                      opacity: isUpdating ? 0.5 : 1,
                    }}
                  >
                    <td style={{ padding: '12px 16px', color: '#E6EDF3', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      {user.name || <span style={{ color: '#6B7A90' }}>—</span>}
                      {isSelf && (
                        <span style={{ marginLeft: 6, fontSize: 9, color: '#3B82F6', fontFamily: 'var(--font-mono)', background: 'rgba(59,130,246,0.1)', padding: '1px 5px', borderRadius: 3 }}>YOU</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#9FB0C0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 4,
                        background: user.is_admin ? 'rgba(139,92,246,0.12)' : 'rgba(107,122,144,0.08)',
                        color: user.is_admin ? '#8B5CF6' : '#6B7A90',
                        border: `1px solid ${user.is_admin ? 'rgba(139,92,246,0.25)' : 'rgba(107,122,144,0.15)'}`,
                      }}>
                        {user.is_admin ? 'ADMIN' : 'USER'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 4,
                        background: user.is_blocked ? 'rgba(244,63,94,0.1)' : 'rgba(34,197,94,0.08)',
                        color: user.is_blocked ? '#F43F5E' : '#22C55E',
                        border: `1px solid ${user.is_blocked ? 'rgba(244,63,94,0.2)' : 'rgba(34,197,94,0.18)'}`,
                      }}>
                        {user.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6B7A90', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Toggle
                        checked={user.is_admin}
                        disabled={isSelf || isUpdating}
                        onChange={() => toggleField(user.id, 'is_admin', !user.is_admin)}
                      />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Toggle
                        checked={user.is_blocked}
                        disabled={isSelf || isUpdating}
                        onChange={() => toggleField(user.id, 'is_blocked', !user.is_blocked)}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          padding: '10px 18px', borderRadius: 8, fontSize: 13,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(244,63,94,0.3)'}`,
          color: toast.type === 'success' ? '#22C55E' : '#F43F5E',
          zIndex: 999, fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
