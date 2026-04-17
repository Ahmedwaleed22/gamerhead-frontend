'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SimpleTrophyIcon } from '@/components/simple-trophy-icon'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [password,        setPassword]        = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [success,         setSuccess]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) return setError('Invalid reset link. Please request a new one.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== passwordConfirm) return setError('Passwords do not match.')

    setLoading(true)
    try {
      const res  = await fetch('http://localhost:3001/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Reset failed.')
      setSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-0)', padding: 24 }}>
      <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px 40px', maxWidth: 440, width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: '#f0c040', lineHeight: 0 }}>
            <SimpleTrophyIcon size={40} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginTop: 8 }}>GamerHead</div>
        </div>

        {!token ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Invalid Link</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              This reset link is invalid or missing. Please request a new one.
            </p>
            <Link href="/auth/forgot-password" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Request New Link
            </Link>
          </div>
        ) : !success ? (
          <>
            <h2 style={{ color: 'var(--text)', marginBottom: 8, textAlign: 'center' }}>Reset Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
              Enter your new password below.
            </p>

            {error && (
              <div style={{ background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#e8000d', fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="password"
                  className="modal-input"
                  placeholder="New password (min 8 characters)"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <input
                  type="password"
                  className="modal-input"
                  placeholder="Confirm new password"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  required
                  style={{ width: '100%' }}
                />
              </div>

              <button
                type="submit"
                className="modal-submit-btn"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Password Reset!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              Your password has been updated successfully.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
              Redirecting you to sign in...
            </p>
            <Link href="/" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Go to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}