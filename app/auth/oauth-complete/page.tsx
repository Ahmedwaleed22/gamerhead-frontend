'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter }    from 'next/navigation'
import { authApi }                       from '@/lib/api'
import { SimpleTrophyIcon }              from '@/components/simple-trophy-icon'

function OAuthCompleteContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')
  const error        = searchParams.get('error')

  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (error) {
      setStatus('error')
      setMessage(decodeURIComponent(error))
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('No token received. Please try signing in again.')
      return
    }

    const complete = async () => {
      try {
        localStorage.setItem('ce_token', token)
        // Validate token — if this throws the token is bad
        await authApi.me()
        setStatus('done')
        // Full page navigation so AuthProvider re-mounts and picks up the new token
        window.location.href = '/'
      } catch {
        localStorage.removeItem('ce_token')
        setStatus('error')
        setMessage('Sign-in failed. The session token is invalid or expired.')
      }
    }

    complete()
  }, [token, error, router])

  return (
    <div style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      background:     '#0f0f11',
      color:          '#fff',
      fontFamily:     'sans-serif',
      gap:            16,
      padding:        24,
      textAlign:      'center',
    }}>
      <div style={{ color: '#f0c040', lineHeight: 0 }}>
        <SimpleTrophyIcon size={40} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>GamerHead</h1>

      {status === 'loading' && (
        <>
          <div style={{
            width:           32,
            height:          32,
            border:          '3px solid #333',
            borderTop:       '3px solid #E74C3C',
            borderRadius:    '50%',
            animation:       'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#9CA3AF', margin: 0 }}>Completing sign-in…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}

      {status === 'done' && (
        <p style={{ color: '#34D399', margin: 0 }}>Signed in! Redirecting…</p>
      )}

      {status === 'error' && (
        <>
          <p style={{ color: '#F87171', margin: 0, maxWidth: 360 }}>{message}</p>
          <a
            href="/"
            style={{
              marginTop:       8,
              color:           '#E74C3C',
              textDecoration:  'underline',
              cursor:          'pointer',
              fontSize:        14,
            }}
          >
            Return to home
          </a>
        </>
      )}
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
