'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter }    from 'next/navigation'
import { authApi, ApiError }             from '@/lib/api'
import { AuthStyles, AuthBrandPanel }    from '@/app/components/auth-ui'

type Status = 'loading' | 'success' | 'error'

const buttonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '13px 30px',
  background: 'var(--red)', color: '#fff', borderRadius: 9, textDecoration: 'none',
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14,
  letterSpacing: '.06em', textTransform: 'uppercase',
  boxShadow: '0 4px 14px rgba(232,0,13,.4)',
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status,  setStatus]  = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found in the URL.')
      return
    }

    const verify = async () => {
      try {
        const data = await authApi.verifyEmail(token)
        setStatus('success')
        setMessage(data.message)
        setTimeout(() => router.push('/'), 3000)
      } catch (err) {
        setStatus('error')
        setMessage(err instanceof ApiError ? (err.message || 'Verification failed.') : 'Could not connect to the server. Please try again.')
      }
    }

    verify()
  }, [token])

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
                Verifying Your Email
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: 0, animation: 'ghaPulse 1.6s ease-in-out infinite' }}>
                Please wait a moment…
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ position: 'relative', width: 76, height: 76, marginBottom: 26, animation: 'ghaPop .3s ease both' }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, var(--red-glow), transparent 70%)', filter: 'blur(4px)' }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
              </div>
              <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, lineHeight: 1, textTransform: 'uppercase', color: '#fff', margin: '0 0 8px' }}>
                Email Verified
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '0 0 6px', maxWidth: 320, lineHeight: 1.5 }}>
                {message}
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px', animation: 'ghaPulse 1.6s ease-in-out infinite' }}>
                Taking you to GamerHead…
              </p>
              <a href="/" style={buttonStyle}>
                Go to Sign In
              </a>
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
                Verification Failed
              </h1>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 14, color: 'var(--text-muted)', margin: '0 0 10px', maxWidth: 320, lineHeight: 1.5 }}>
                {message}
              </p>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px', maxWidth: 320, lineHeight: 1.5 }}>
                The link may have expired. Links are valid for 24 hours.
              </p>
              <a href="/" style={buttonStyle}>
                Return to Home
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
