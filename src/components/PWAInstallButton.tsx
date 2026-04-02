'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

declare global {
  interface Navigator { standalone?: boolean }
}

export default function PWAInstallButton({ variant = 'icon', onClose }: { variant?: 'icon' | 'menuItem'; onClose?: () => void } = {}) {
  const [show, setShow]               = useState(false)
  const [isIOS, setIsIOS]             = useState(false)
  const [showIOSModal, setShowIOSModal] = useState(false)
  const [toast, setToast]             = useState('')
  const promptRef  = useRef<BeforeInstallPromptEvent | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(''), 3500)
  }, [])

  useEffect(() => {
    // Register service worker (required for PWA installability)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Only show install UI on mobile
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    // Detect if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigator.standalone === true

    // iOS detection
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // If running in standalone — already installed, hide button
    if (isStandalone) {
      // Show welcome toast once for iOS (can't detect install event natively)
      if (ios && !localStorage.getItem('pwa-welcome-shown')) {
        localStorage.setItem('pwa-welcome-shown', '1')
        showToast("✅ DT's Terminal added to your home screen")
      }
      return
    }

    // iOS: no install prompt API — show button so user can see instructions
    if (ios) {
      setShow(true)
      return
    }

    // Android: check if prompt was already captured before React mounted
    const earlyPrompt = (window as { __pwaPrompt?: BeforeInstallPromptEvent }).__pwaPrompt
    if (earlyPrompt) {
      promptRef.current = earlyPrompt
      setShow(true)
    }

    // Android: also listen for future events (in case not yet fired)
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', beforeInstallHandler)

    // Android: app was installed successfully
    const appInstalledHandler = () => {
      setShow(false)
      promptRef.current = null
      showToast('✅ Added to home screen')
    }
    window.addEventListener('appinstalled', appInstalledHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [showToast])

  const handleClick = async () => {
    onClose?.()
    if (isIOS) {
      setShowIOSModal(true)
      return
    }
    if (!promptRef.current) return
    await promptRef.current.prompt()
    const { outcome } = await promptRef.current.userChoice
    promptRef.current = null
    setShow(false)
    if (outcome === 'accepted') {
      showToast('✅ App installed successfully')
    }
  }

  // Don't render anything on desktop or when not applicable
  if (!show) return null

  return (
    <>
      {/* Install button — icon or menu item */}
      {variant === 'menuItem' ? (
        <button
          onClick={handleClick}
          className="w-full text-left text-[12px] font-mono transition-colors flex items-center gap-2"
          style={{ padding: '10px 16px', color: '#9FB0C0', background: 'transparent', borderLeft: '2px solid transparent' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          DOWNLOAD APP
        </button>
      ) : (
        <button
          onClick={handleClick}
          title="Install App"
          aria-label="Install DT's Terminal"
          className="flex items-center justify-center w-8 h-8 transition-colors hover:bg-bg-hover rounded"
          style={{ color: '#6B7A90', flexShrink: 0 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </button>
      )}

      {/* iOS instruction modal */}
      {showIOSModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            zIndex: 9999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 16px 32px',
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              background: '#121A2B',
              border: '1px solid #1E2A3B',
              borderRadius: 16,
              padding: '24px 20px',
              width: '100%',
              maxWidth: 400,
              boxShadow: '0 -4px 40px rgba(0,0,0,0.6)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>📲</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#E6EDF3' }}>Install DT&apos;s Terminal</span>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                style={{ color: '#6B7A90', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { num: '1', text: 'Tap the Share icon (⎙) at the bottom of Safari' },
                { num: '2', text: 'Scroll down and tap "Add to Home Screen"' },
                { num: '3', text: 'Tap "Add" to confirm installation' },
              ].map(step => (
                <div key={step.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
                    color: '#3B82F6', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {step.num}
                  </span>
                  <p style={{ fontSize: 13, color: '#9FB0C0', lineHeight: 1.55, margin: 0, paddingTop: 4 }}>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                marginTop: 22, width: '100%', padding: '12px',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 8, color: '#3B82F6', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-mono)',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Success toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: '#121A2B', border: '1px solid #22C55E',
          borderRadius: 8, padding: '10px 20px',
          fontSize: 13, color: '#22C55E', fontFamily: 'var(--font-mono)',
          zIndex: 9999, whiteSpace: 'nowrap',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
