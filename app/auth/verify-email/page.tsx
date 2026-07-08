'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SimpleTrophyIcon } from '@/components/simple-trophy-icon'
import { authApi, ApiError } from '@/lib/api'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status,  setStatus]  = useState<'loading' | 'success' | 'error'>('loading')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 24 }}>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: '#f0c040', lineHeight: 0 }}>
            <SimpleTrophyIcon size={40} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginTop: 8 }}>GamerHead</div>
        </div>

        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Verifying your email...</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Email Verified!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>{message}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Redirecting you in 3 seconds...</p>
            <Link href="/" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Go to Sign In
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Verification Failed</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              The link may have expired. Links are valid for 24 hours.
            </p>
            <Link href="/" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Back to Home
            </Link>
          </>
        )}

      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}