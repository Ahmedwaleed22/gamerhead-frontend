'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter }  from 'next/navigation'
import { authApi }    from '@/lib/api'
import { useAuth }    from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import Logo           from '@/components/Logo'

// Maximum date allowed (must be at least 16 years old)
function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 16)
  return d.toISOString().split('T')[0]
}

const INPUT: React.CSSProperties = {
  width:        '100%',
  padding:      '11px 14px',
  background:   '#1a1a1f',
  border:       '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color:        '#fff',
  fontSize:     14,
  outline:      'none',
  boxSizing:    'border-box',
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
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#0f0f11',
      padding:        24,
    }}>
      <div style={{
        width:        '100%',
        maxWidth:     400,
        background:   '#141418',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding:      '36px 32px',
        display:      'flex',
        flexDirection:'column',
        gap:          20,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <Logo className="justify-center" />
        </div>

        {/* Heading */}
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'sans-serif' }}>
            Almost there!
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF', fontFamily: 'sans-serif', lineHeight: 1.5 }}>
            Pick a username and confirm your date of birth to finish creating your account.
          </p>
        </div>

        {error && (
          <div style={{
            background:   'rgba(239,68,68,0.12)',
            border:       '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            padding:      '10px 14px',
            fontSize:     13,
            color:        '#F87171',
            fontFamily:   'sans-serif',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6, fontFamily: 'sans-serif' }}>
              Username
            </label>
            <input
              style={INPUT}
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
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4B5563', fontFamily: 'sans-serif' }}>
              Letters, numbers, _ and - only. Cannot be changed easily later.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9CA3AF', marginBottom: 6, fontFamily: 'sans-serif' }}>
              Date of Birth
            </label>
            <input
              style={INPUT}
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={maxDob()}
              required
            />
            {/* <p style={{ margin: '4px 0 0', fontSize: 11, color: '#4B5563', fontFamily: 'sans-serif' }}>
              You must be at least 16 years old.
            </p> */}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop:    4,
              padding:      '12px 0',
              background:   loading ? '#555' : '#E74C3C',
              color:        '#fff',
              border:       'none',
              borderRadius: 8,
              fontSize:     15,
              fontWeight:   700,
              cursor:       loading ? 'not-allowed' : 'pointer',
              fontFamily:   'sans-serif',
              transition:   'background 0.15s',
            }}
          >
            {loading ? 'Saving…' : 'Complete Setup'}
          </button>
        </form>
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
