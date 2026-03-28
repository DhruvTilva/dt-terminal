'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SESSION_KEY   = 'visitor_session_id'
const LAST_TRACK_KEY = 'visitor_last_track'
const HEARTBEAT_INTERVAL = 5 * 60 * 1000 // 5 minutes

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function getDeviceType(ua: string): 'mobile' | 'desktop' {
  return /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop'
}

function getBrowser(ua: string): string {
  if (ua.includes('Edg/'))                               return 'Edge'
  if (ua.includes('Chrome/') && !ua.includes('Edg/'))   return 'Chrome'
  if (ua.includes('Firefox/'))                           return 'Firefox'
  if (ua.includes('Safari/') && ua.includes('Version/')) return 'Safari'
  return 'Other'
}

export default function VisitorTracker() {
  useEffect(() => {
    async function track() {
      try {
        // Get or create session_id
        let sessionId = localStorage.getItem(SESSION_KEY)
        const isNewSession = !sessionId
        if (!sessionId) {
          sessionId = generateUUID()
          localStorage.setItem(SESSION_KEY, sessionId)
        }

        // Debounce: skip if last track was < 5 minutes ago (avoids 60s refresh spam)
        if (!isNewSession) {
          const lastTrack = localStorage.getItem(LAST_TRACK_KEY)
          if (lastTrack && Date.now() - parseInt(lastTrack) < HEARTBEAT_INTERVAL) {
            return
          }
        }

        // Get user_id if logged in
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const ua = navigator.userAgent

        await fetch('/api/visitor/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id:  sessionId,
            user_id:     user?.id ?? null,
            device_type: getDeviceType(ua),
            browser:     getBrowser(ua),
            page_path:   window.location.pathname,
            referrer:    document.referrer || null,
          }),
        })

        localStorage.setItem(LAST_TRACK_KEY, Date.now().toString())
      } catch {
        // Silently fail — tracking should never break the app
      }
    }

    track()
  }, [])

  return null
}
