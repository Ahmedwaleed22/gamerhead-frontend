'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter }    from 'next/navigation'
import { authApi }                       from '@/lib/api'
import { AuthStyles, AuthBrandPanel }    from '@/app/components/auth-ui'

type Status = 'loading' | 'done' | 'error'

function OAuthCompleteContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const error        = searchParams.get('error')

  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (error) {
      setStatus('error')
      setMessage(decodeURIComponent(error))
      return
    }

    const complete = async () => {
      try {
        // The OAuth callback already set the HttpOnly session cookie; confirm it.
        const { user } = await authApi.me()
        setStatus('done')
        // New OAuth users who haven't set a username/dob go to onboarding
        if (!user.onboardingDone) {
          window.location.href = '/auth/onboarding'
        } else {
          window.location.href = '/'
        }
      } catch {
        setStatus('error')
        setMessage('Sign-in failed. Please try signing in again.')
      }
    }

    complete()
  }, [error, router])

  return (
    <div className="gha-backdrop" style={{ animation: 'none' }}>
      <AuthStyles />
      <style>{`
        @keyframes ghaSpin { to { transform: rotate(360deg); } }
        @keyframes ghaPulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
        @keyframes ghaPop { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="gha-card" style={{ minHeight: 0 }}>
        {/* Left brand panel — identical to the login popup */}
        <AuthBrandPanel />

        {/* Right status panel */}
        <div style={{ flex: 1, position: 'relative', padding: '34px 38px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 360 }}>

          {status === 'loading' && (
            <>
              <div style={{ position: 'relative', width: 76, height: 76, marginBottom: 26 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, var(--red-glow), transparent 70%)', filter: 'blur(4px)' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  border: '3px solid rgba(255,255,255,.08)',
                  borderTopColor: 'var(--red)',
                  borderRadius: '50%',
                  animation: 'ghaSpin .8s linear infinite',
                }} />
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>
                Signing You In
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0, animation: 'ghaPulse 1.6s ease-in-out infinite' }}>
                Verifying your account…
              </p>
            </>
          )}

          {status === 'done' && (
            <>
              <div style={{ position: 'relative', width: 76, height: 76, marginBottom: 26, animation: 'ghaPop .3s ease both' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, var(--red-glow), transparent 70%)', filter: 'blur(4px)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>
                You&apos;re In
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Taking you to GamerHead…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ position: 'relative', width: 76, height: 76, marginBottom: 26, animation: 'ghaPop .3s ease both' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(232,0,13,.12)', border: '1px solid rgba(232,0,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.01" /></svg>
                </div>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: 'uppercase', color: '#fff', margin: '0 0 10px' }}>
                Sign-In Failed
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px', maxWidth: 320, lineHeight: 1.5 }}>
                {message}
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '13px 30px',
                  background: 'var(--red)', color: '#fff', borderRadius: 9, textDecoration: 'none',
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14,
                  letterSpacing: '.06em', textTransform: 'uppercase',
                  boxShadow: '0 4px 14px rgba(232,0,13,.4)',
                }}
              >
                Return to Home
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OAuthCompletePage() {
  return (
    <Suspense>
      <OAuthCompleteContent />
    </Suspense>
  )
}
