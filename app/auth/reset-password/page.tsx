'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { authApi, ApiError } from '@/lib/api'
import {
  AuthStyles, AuthBrandPanel, AuthHeading, Field, LockIcon, submitStyle,
} from '@/app/components/auth-ui'

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
      await authApi.resetPassword({ token, password })
      setSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed.')
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

          {!token ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(232,0,13,.12)', border: '1px solid rgba(232,0,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.01" /></svg>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>Invalid Link</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                This reset link is invalid or missing. Please request a new one.
              </p>
              <Link href="/auth/forgot-password" style={{ ...submitStyle(false), display: 'inline-flex', width: 'auto', padding: '13px 30px', marginTop: 22, textDecoration: 'none' }}>
                Request New Link →
              </Link>
            </div>
          ) : !success ? (
            <div>
              <AuthHeading>Reset Password</AuthHeading>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
                Enter your new password below.
              </p>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.4)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '11px 13px', marginBottom: 16 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a63" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ff7079' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Field icon={LockIcon}>
                  <input type="password" className="gha-input" placeholder="New password (min 8 characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                </Field>
                <Field icon={LockIcon}>
                  <input type="password" className="gha-input" placeholder="Confirm new password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} required />
                </Field>
                <button type="submit" disabled={loading} style={submitStyle(loading)}>
                  {loading ? 'Resetting…' : 'Reset Password →'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>Password Reset</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                Your password has been updated successfully. Redirecting you to sign in…
              </p>
              <Link href="/" style={{ ...submitStyle(false), display: 'inline-flex', width: 'auto', padding: '13px 30px', marginTop: 22, textDecoration: 'none' }}>
                Go to Sign In →
              </Link>
            </div>
          )}

        </div>
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
