'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter }  from 'next/navigation'
import { authApi }    from '@/lib/api'
import { useAuth }    from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import {
  AuthStyles, AuthBrandPanel, AuthHeading, Field, UserIcon, CalendarIcon, submitStyle,
} from '@/app/components/auth-ui'

// Maximum date allowed (must be at least 16 years old)
function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 16)
  return d.toISOString().split('T')[0]
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 11,
  letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 7px 2px',
}

function OnboardingContent() {
  const router      = useRouter()
  const { user, loading: authLoading, refresh } = useAuth()

  const [username, setUsername] = useState('')
  const [dob,      setDob]      = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (authLoading) return
    // Not logged in → send home
    if (!user) { router.replace('/'); return }
    // Already completed onboarding → send home
    if (user.onboardingDone) router.replace('/')
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side age check
    const dobDate  = new Date(dob)
    const cutoff   = new Date()
    cutoff.setFullYear(cutoff.getFullYear() - 16)
    if (dobDate > cutoff) {
      setError('You must be at least 16 years old to create an account.')
      return
    }

    setLoading(true)
    try {
      await authApi.onboarding({ username, dob })
      await refresh()
      trackEvent('onboarding_complete')
      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <AuthStyles />

      <div className="gha-card">

        {/* ── LEFT BRAND PANEL ── */}
        <AuthBrandPanel />

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{ flex: 1, position: 'relative', padding: '40px 38px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <AuthHeading>Almost There!</AuthHeading>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
            Pick a username and confirm your date of birth to finish creating your account.
          </p>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.4)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '11px 13px', marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a63" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#ff7079' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Username</label>
              <Field icon={UserIcon}>
                <input
                  className="gha-input"
                  type="text"
                  placeholder="Choose a username (3–20 chars)"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={20}
                  pattern="[a-zA-Z0-9_\-]+"
                  title="Letters, numbers, underscores and hyphens only"
                  required
                  autoFocus
                />
              </Field>
              <p style={{ margin: '7px 0 0 2px', fontSize: 11.5, color: 'var(--text-dim)' }}>
                Letters, numbers, _ and - only. Cannot be changed easily later.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Date of Birth</label>
              <Field icon={CalendarIcon}>
                <input
                  className="gha-input"
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  max={maxDob()}
                  required
                />
              </Field>
            </div>

            <button type="submit" disabled={loading} style={submitStyle(loading)}>
              {loading ? 'Saving…' : 'Complete Setup →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}
