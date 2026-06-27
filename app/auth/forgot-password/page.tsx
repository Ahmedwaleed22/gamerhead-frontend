'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  AuthStyles, AuthBrandPanel, AuthHeading, Field, MailIcon, submitStyle, switchLinkStyle,
} from '@/app/components/auth-ui'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
      const res  = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
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

          {!success ? (
            <div>
              <AuthHeading>Forgot Password</AuthHeading>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.4)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '11px 13px', marginBottom: 16 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a63" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ff7079' }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <Field icon={MailIcon}>
                  <input type="email" className="gha-input" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                </Field>
                <button type="submit" disabled={loading} style={submitStyle(loading)}>
                  {loading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-muted)' }}>
                Remember your password?{' '}
                <Link href="/" className="gha-switch-link" style={switchLinkStyle}>Sign In</Link>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>Check Your Email</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                If an account with <strong style={{ color: '#fff' }}>{email}</strong> exists, we&apos;ve sent a password reset link. Check your inbox and spam folder — the link expires in 1 hour.
              </p>
              <Link href="/" style={{ ...submitStyle(false), display: 'inline-flex', width: 'auto', padding: '13px 30px', marginTop: 22, textDecoration: 'none' }}>
                Back to Home →
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
