'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SimpleTrophyIcon } from '@/components/simple-trophy-icon'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res  = await fetch('http://localhost:3001/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong')
      setSuccess(true)
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

        {!success ? (
          <>
            <h2 style={{ color: 'var(--text)', marginBottom: 8, textAlign: 'center' }}>Forgot Password</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{ background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#e8000d', fontSize: 14 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="email"
                  className="modal-input"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
              Remember your password?{' '}
              <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={{ color: 'var(--text)', marginBottom: 8 }}>Check Your Email</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              If an account with <strong style={{ color: 'var(--text)' }}>{email}</strong> exists,
              we've sent a password reset link. Check your inbox and spam folder.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
              The link expires in 1 hour.
            </p>
            <Link href="/" style={{ display: 'inline-block', background: 'var(--accent)', color: 'white', padding: '12px 28px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
              Back to Home
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}