'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import {
  AuthStyles, AuthBrandPanel, AuthHeading, Field,
  MailIcon, LockIcon, UserIcon, CalendarIcon,
  submitStyle, socialStyle, switchLinkStyle,
} from './auth-ui'

const emptyForgot = { email: '', loading: false, error: '', success: false }

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

function maxDob(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 16)
  return d.toISOString().split('T')[0]
}

interface AuthModalProps {
  isOpen:      boolean
  onClose:     () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { login, register, loading, error, clearError } = useAuth()

  const [tab,        setTab]        = useState<'login' | 'register'>(defaultTab)
  const [view,       setView]       = useState<'auth' | 'forgot'>('auth')
  const [success,    setSuccess]    = useState('')
  const [attempted,  setAttempted]  = useState(false)
  const [prevTab,    setPrevTab]    = useState(defaultTab)
  const [forgot,     setForgot]     = useState(emptyForgot)
  const [closing,    setClosing]    = useState(false)

  // Sync the active tab when the parent changes defaultTab (React's
  // "adjust state during render" pattern — no effect needed).
  if (defaultTab !== prevTab) {
    setPrevTab(defaultTab)
    setTab(defaultTab)
    setView('auth')
    setForgot(emptyForgot)
    setAttempted(false)
  }

  // Login form state
  const [loginData, setLoginData] = useState({ identifier: '', password: '' })

  // Register form state
  const [registerData, setRegisterData] = useState({
    username:        '',
    email:           '',
    emailConfirm:    '',
    password:        '',
    passwordConfirm: '',
    dob:             '',
    acceptTerms:     false,
  })

  if (!isOpen) return null

  const isLogin = tab === 'login'

  // Play the exit animation, then reset all transient state and unmount so
  // the modal always reopens fresh on the requested tab.
  const handleClose = () => {
    if (closing) return
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      setTab(defaultTab)
      setView('auth')
      setForgot(emptyForgot)
      setSuccess('')
      setAttempted(false)
      clearError()
      onClose()
    }, 260) // keep in sync with the .gha-closing animation duration
  }

  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    setView('auth')
    setSuccess('')
    setForgot(emptyForgot)
    setAttempted(false)
    clearError()
  }

  const openForgot = () => {
    clearError()
    setForgot(emptyForgot)
    setView('forgot')
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgot(f => ({ ...f, loading: true, error: '' }))
    try {
      const res  = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: forgot.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Something went wrong')
      setForgot(f => ({ ...f, loading: false, success: true }))
    } catch (err) {
      setForgot(f => ({ ...f, loading: false, error: err instanceof Error ? err.message : 'Something went wrong' }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(loginData.identifier, loginData.password)
      handleClose()
      // No reload needed — AuthContext updates user state reactively
    } catch {
      // error is already set in context
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttempted(true)
    clearError()
    if (registerData.email !== registerData.emailConfirm)
      return clearError() // handled below with local validation
    if (registerData.password !== registerData.passwordConfirm)
      return clearError()
    if (!registerData.dob) return
    if (!registerData.acceptTerms) return

    try {
      await register(registerData.username, registerData.email, registerData.password, registerData.dob)
      setSuccess('Account created! Check your email to verify your account.')
    } catch {
      // error is already set in context
    }
  }

  // Local validation errors (before hitting API)
  const getLocalError = () => {
    if (tab === 'register') {
      if (registerData.email && registerData.emailConfirm && registerData.email !== registerData.emailConfirm)
        return 'Emails do not match'
      if (registerData.password && registerData.passwordConfirm && registerData.password !== registerData.passwordConfirm)
        return 'Passwords do not match'
      if (registerData.dob) {
        const dob    = new Date(registerData.dob)
        const cutoff = new Date()
        cutoff.setFullYear(cutoff.getFullYear() - 16)
        if (dob > cutoff) return 'You must be at least 16 years old to sign up'
      }
      if (!registerData.acceptTerms && attempted)
        return 'You must accept the terms of service'
    }
    return null
  }

  const displayError = error || getLocalError()

  return (
    <div className={`gha-backdrop${closing ? ' gha-closing' : ''}`} onClick={handleClose}>
      <AuthStyles />

      <div className="gha-card" onClick={e => e.stopPropagation()}>

        {/* ── LEFT BRAND PANEL ── */}
        <AuthBrandPanel />

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{ flex: 1, position: 'relative', padding: '34px 38px 30px', overflowY: 'auto' }}>
          <button className="gha-close" onClick={handleClose} aria-label="Close" style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderRadius: 8, background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>

          {/* ── FORGOT PASSWORD VIEW ── */}
          {view === 'forgot' ? (
            forgot.success ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>Check Your Email</div>
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.6 }}>
                  If an account with <strong style={{ color: '#fff' }}>{forgot.email}</strong> exists, we&apos;ve sent a password reset link. Check your inbox and spam folder — the link expires in 1 hour.
                </p>
                <button onClick={() => switchTab('login')} style={{ ...submitStyle(false), width: 'auto', padding: '13px 30px', marginTop: 22 }}>Back to Sign In</button>
              </div>
            ) : (
              <div style={{ marginTop: 6 }}>
                <AuthHeading>Forgot Password</AuthHeading>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>

                {forgot.error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.4)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '11px 13px', marginBottom: 16 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a63" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ff7079' }}>{forgot.error}</span>
                  </div>
                )}

                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Field icon={MailIcon}>
                    <input type="email" className="gha-input" placeholder="Email address" value={forgot.email} onChange={e => setForgot(f => ({ ...f, email: e.target.value }))} required />
                  </Field>
                  <button type="submit" disabled={forgot.loading} style={submitStyle(forgot.loading)}>
                    {forgot.loading ? 'Sending…' : 'Send Reset Link →'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-muted)' }}>
                  Remember your password?{' '}
                  <button type="button" className="gha-switch-link" onClick={() => switchTab('login')} style={switchLinkStyle}>Sign In</button>
                </div>
              </div>
            )
          ) : (
          <>
          {/* SEGMENTED TABS */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#0d1017', border: '1px solid var(--border)', borderRadius: 11, padding: 5, margin: '6px 0 24px', width: 248 }}>
            <div style={{ position: 'absolute', top: 5, bottom: 5, left: 5, width: 'calc(50% - 5px)', background: 'var(--red)', borderRadius: 8, boxShadow: '0 4px 14px rgba(232,0,13,.4)', transition: 'transform .26s cubic-bezier(.4,0,.2,1)', transform: `translateX(${isLogin ? '0%' : '100%'})` }} />
            <button onClick={() => switchTab('login')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 0, padding: '9px 0', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color .2s', color: isLogin ? '#fff' : 'var(--text-muted)' }}>Sign In</button>
            <button onClick={() => switchTab('register')} style={{ position: 'relative', zIndex: 1, background: 'transparent', border: 0, padding: '9px 0', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'color .2s', color: !isLogin ? '#fff' : 'var(--text-muted)' }}>Sign Up</button>
          </div>

          {/* SUCCESS STATE */}
          {success ? (
            <div style={{ textAlign: 'center', padding: '36px 0 30px' }}>
              <div style={{ width: 64, height: 64, margin: '0 auto 18px', borderRadius: '50%', background: 'rgba(232,0,13,.14)', border: '1px solid rgba(232,0,13,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 28, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>You&apos;re In!</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.6 }}>Check your inbox to verify your email and claim your welcome bonus.</p>
              <button onClick={() => switchTab('login')} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', padding: '13px 30px', marginTop: 22, background: 'var(--red)', color: '#fff', border: 0, borderRadius: 9, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', cursor: 'pointer' }}>Go to Sign In</button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {isLogin
                  ? 'Welcome back. Sign in to jump back into the action.'
                  : 'Create your free account — no buy-in, real cash on the line.'}
              </p>

              {displayError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.4)', borderLeft: '3px solid var(--red)', borderRadius: 8, padding: '11px 13px', marginBottom: 16 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff5a63" strokeWidth={2.2} strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.01" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#ff7079' }}>{displayError}</span>
                </div>
              )}

              {/* ── LOGIN FORM ── */}
              {isLogin && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Field icon={MailIcon}>
                    <input type="text" className="gha-input" placeholder="Username or email" value={loginData.identifier} onChange={e => setLoginData({ ...loginData, identifier: e.target.value })} required />
                  </Field>
                  <Field icon={LockIcon}>
                    <input type="password" className="gha-input" placeholder="Password" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required />
                  </Field>
                  <div style={{ textAlign: 'right', marginTop: -2 }}>
                    <button type="button" className="gha-forgot" onClick={openForgot} style={{ background: 'none', border: 0, padding: 0, fontSize: 12.5, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'color .15s' }}>Forgot password?</button>
                  </div>
                  <button type="submit" disabled={loading} style={submitStyle(loading)}>
                    {loading ? 'Signing in…' : 'Sign In →'}
                  </button>
                </form>
              )}

              {/* ── REGISTER FORM ── */}
              {!isLogin && (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Field icon={UserIcon}>
                    <input type="text" className="gha-input" placeholder="Username" value={registerData.username} onChange={e => setRegisterData({ ...registerData, username: e.target.value })} required minLength={3} maxLength={20} />
                  </Field>
                  <Field icon={MailIcon}>
                    <input type="email" className="gha-input" placeholder="Email address" value={registerData.email} onChange={e => setRegisterData({ ...registerData, email: e.target.value })} required />
                  </Field>
                  <Field icon={MailIcon}>
                    <input type="email" className="gha-input" placeholder="Confirm email" value={registerData.emailConfirm} onChange={e => setRegisterData({ ...registerData, emailConfirm: e.target.value })} required />
                  </Field>
                  <Field icon={LockIcon}>
                    <input type="password" className="gha-input" placeholder="Password" value={registerData.password} onChange={e => setRegisterData({ ...registerData, password: e.target.value })} required minLength={8} />
                  </Field>
                  <Field icon={LockIcon}>
                    <input type="password" className="gha-input" placeholder="Confirm password" value={registerData.passwordConfirm} onChange={e => setRegisterData({ ...registerData, passwordConfirm: e.target.value })} required />
                  </Field>
                  <div>
                    <label style={{ display: 'block', fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '2px 0 7px 2px' }}>Date of Birth</label>
                    <Field icon={CalendarIcon}>
                      <input type="date" className="gha-input" value={registerData.dob} onChange={e => setRegisterData({ ...registerData, dob: e.target.value })} max={maxDob()} required />
                    </Field>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 2 }}>
                    <input type="checkbox" checked={registerData.acceptTerms} onChange={e => setRegisterData({ ...registerData, acceptTerms: e.target.checked })} style={{ width: 18, height: 18, marginTop: 1, accentColor: 'var(--red)', cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>I&apos;m 18+ and agree to GamerHead&apos;s <a href="/terms" style={{ color: 'var(--red)', fontWeight: 600 }}>Terms of Service</a> and <a href="/privacy" style={{ color: 'var(--red)', fontWeight: 600 }}>Privacy Policy</a>.</span>
                  </label>
                  <button type="submit" disabled={loading} style={submitStyle(loading)}>
                    {loading ? 'Creating account…' : 'Create Account →'}
                  </button>
                </form>
              )}

              {/* ── DIVIDER + SOCIAL ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '20px 0 16px' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>{isLogin ? 'or continue with' : 'or sign up with'}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
                <a className="gha-social" href={`${API_URL}/auth/oauth/google`} onClick={() => trackEvent(isLogin ? 'login' : 'sign_up', { method: 'google' })} style={socialStyle}>
                  <svg width="17" height="17" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C36 8.1 30.3 6 24 6 12.9 6 4 14.9 4 26s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C36 8.1 30.3 6 24 6 16.3 6 9.7 10.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 46c6.2 0 11.8-2.4 16-6.3l-7.4-6.2C30.3 35 27.3 36 24 36c-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.6 41.6 16.2 46 24 46z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l7.4 6.2C42.1 36.9 44 31.8 44 26c0-1.3-.1-2.7-.4-3.5z" /></svg>
                  Google
                </a>
                <a className="gha-social" href={`${API_URL}/auth/oauth/steam`} onClick={() => trackEvent(isLogin ? 'login' : 'sign_up', { method: 'steam' })} style={socialStyle}>
                  <img src="/images/logos/steam.svg" style={{ width: 17, height: 17 }} alt="Steam" />
                  Steam
                </a>
              </div>

              {/* ── FOOTER SWITCH ── */}
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
                {isLogin ? (
                  <span>New to GamerHead? <button type="button" className="gha-switch-link" onClick={() => switchTab('register')} style={switchLinkStyle}>Create an account</button></span>
                ) : (
                  <span>Already have an account? <button type="button" className="gha-switch-link" onClick={() => switchTab('login')} style={switchLinkStyle}>Sign in</button></span>
                )}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  )
}
