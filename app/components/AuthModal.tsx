'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SimpleTrophyIcon } from '@/components/simple-trophy-icon'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface AuthModalProps {
  isOpen:      boolean
  onClose:     () => void
  defaultTab?: 'login' | 'register'
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const { login, register, loading, error, clearError } = useAuth()

  const [tab,     setTab]     = useState<'login' | 'register'>(defaultTab)
  const [success, setSuccess] = useState('')

  // Login form state
  const [loginData, setLoginData] = useState({ identifier: '', password: '' })

  // Register form state
  const [registerData, setRegisterData] = useState({
    username:        '',
    email:           '',
    emailConfirm:    '',
    password:        '',
    passwordConfirm: '',
    acceptTerms:     false,
  })

  // Sync tab when parent changes defaultTab
  useEffect(() => { setTab(defaultTab) }, [defaultTab])

  if (!isOpen) return null

  const switchTab = (t: 'login' | 'register') => {
    setTab(t)
    setSuccess('')
    clearError()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(loginData.identifier, loginData.password)
      onClose()
      // No reload needed — AuthContext updates user state reactively
    } catch {
      // error is already set in context
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (registerData.email !== registerData.emailConfirm)
      return clearError() // handled below with local validation
    if (registerData.password !== registerData.passwordConfirm)
      return clearError()
    if (!registerData.acceptTerms) return

    try {
      await register(registerData.username, registerData.email, registerData.password)
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
      if (!registerData.acceptTerms && registerData.username)
        return 'You must accept the terms of service'
    }
    return null
  }

  const displayError = error || getLocalError()

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />

      <div className="auth-modal">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-logo">
          <span style={{ display: 'flex', justifyContent: 'center', color: '#f0c040', lineHeight: 0 }}>
            <SimpleTrophyIcon size={32} />
          </span>
          <div className="navbar-logo-text" style={{ textAlign: 'center' }}>
            <span className="navbar-logo-text-main">GamerHead</span>
            <span className="navbar-logo-text-sub">Life's A Game</span>
          </div>
        </div>

        <div className="modal-tabs">
          <button className={`modal-tab${tab === 'login'    ? ' active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
          <button className={`modal-tab${tab === 'register' ? ' active' : ''}`} onClick={() => switchTab('register')}>Sign Up</button>
        </div>

        {displayError && <div className="modal-alert modal-alert-error">{displayError}</div>}
        {success      && <div className="modal-alert modal-alert-success">{success}</div>}

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && !success && (
          <form onSubmit={handleLogin} className="modal-form">
            <div className="modal-field-group">
              <p className="modal-subtitle">Welcome back. Sign in to your account.</p>
            </div>

            <div className="modal-field-group">
              <input
                type="text"
                className="modal-input"
                placeholder="Username or Email"
                value={loginData.identifier}
                onChange={e => setLoginData({ ...loginData, identifier: e.target.value })}
                required
              />
            </div>

            <div className="modal-field-group">
              <input
                type="password"
                className="modal-input"
                placeholder="Password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>

            <div className="modal-forgot">
              <a href="/auth/forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 4px' }}>
              <div style={{ flex: 1, height: 1, background: '#2a2a2e' }} />
              <span style={{ color: '#6B7280', fontSize: 12 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: '#2a2a2e' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href={`${API_URL}/auth/oauth/google`}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  padding:        '10px 16px',
                  background:     '#fff',
                  color:          '#111',
                  borderRadius:   8,
                  fontWeight:     600,
                  fontSize:       14,
                  textDecoration: 'none',
                  border:         '1px solid #e0e0e0',
                  transition:     'box-shadow 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </a>

              <a
                href={`${API_URL}/auth/oauth/steam`}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  padding:        '10px 16px',
                  background:     '#1b2838',
                  color:          '#c6d4df',
                  borderRadius:   8,
                  fontWeight:     600,
                  fontSize:       14,
                  textDecoration: 'none',
                  border:         '1px solid #2a475e',
                  transition:     'background 0.15s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><path d="M24 0C10.745 0 0 10.745 0 24c0 11.166 7.63 20.57 18.015 23.196l6.491-13.505A7.5 7.5 0 0 1 24 18a7.5 7.5 0 0 1 7.5 7.5 7.5 7.5 0 0 1-7.5 7.5 7.5 7.5 0 0 1-2.016-.277l-7.338 5.694C17.222 39.87 18 41 18 42a6 6 0 0 0 6 6c3.314 0 6-2.686 6-6a6 6 0 0 0-.235-1.655L42 33.77C45.63 30.71 48 26.12 48 21c0-11.598-9.402-21-24-21z" fill="#00adee"/></svg>
                Continue with Steam
              </a>
            </div>

            <p className="modal-switch-text">
              Don't have an account?{' '}
              <button type="button" className="modal-switch-link" onClick={() => switchTab('register')}>
                Create one
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && !success && (
          <form onSubmit={handleRegister} className="modal-form">
            <div className="modal-field-group">
              <p className="modal-subtitle">Create your account on our platform.</p>
            </div>

            <div className="modal-field-group">
              <input
                type="text"
                className="modal-input"
                placeholder="Username"
                value={registerData.username}
                onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div className="modal-field-group">
              <input
                type="email"
                className="modal-input"
                placeholder="Your email"
                value={registerData.email}
                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </div>

            <div className="modal-field-group">
              <input
                type="email"
                className="modal-input"
                placeholder="Your email again"
                value={registerData.emailConfirm}
                onChange={e => setRegisterData({ ...registerData, emailConfirm: e.target.value })}
                required
              />
            </div>

            <div className="modal-field-group">
              <input
                type="password"
                className="modal-input"
                placeholder="Type your password"
                value={registerData.password}
                onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="modal-field-group">
              <input
                type="password"
                className="modal-input"
                placeholder="Type your password again"
                value={registerData.passwordConfirm}
                onChange={e => setRegisterData({ ...registerData, passwordConfirm: e.target.value })}
                required
              />
            </div>

            <div className="modal-checkbox-row">
              <input
                type="checkbox"
                id="acceptTerms"
                className="modal-checkbox"
                checked={registerData.acceptTerms}
                onChange={e => setRegisterData({ ...registerData, acceptTerms: e.target.checked })}
              />
              <label htmlFor="acceptTerms" className="modal-checkbox-label">
                I accept Empire's <a href="/terms">terms of service</a> and <a href="/privacy">privacy policy</a>
              </label>
            </div>

            <button type="submit" className="modal-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 4px' }}>
              <div style={{ flex: 1, height: 1, background: '#2a2a2e' }} />
              <span style={{ color: '#6B7280', fontSize: 12 }}>or sign up with</span>
              <div style={{ flex: 1, height: 1, background: '#2a2a2e' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href={`${API_URL}/auth/oauth/google`}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  padding:        '10px 16px',
                  background:     '#fff',
                  color:          '#111',
                  borderRadius:   8,
                  fontWeight:     600,
                  fontSize:       14,
                  textDecoration: 'none',
                  border:         '1px solid #e0e0e0',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </a>

              <a
                href={`${API_URL}/auth/oauth/steam`}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                  padding:        '10px 16px',
                  background:     '#1b2838',
                  color:          '#c6d4df',
                  borderRadius:   8,
                  fontWeight:     600,
                  fontSize:       14,
                  textDecoration: 'none',
                  border:         '1px solid #2a475e',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none"><path d="M24 0C10.745 0 0 10.745 0 24c0 11.166 7.63 20.57 18.015 23.196l6.491-13.505A7.5 7.5 0 0 1 24 18a7.5 7.5 0 0 1 7.5 7.5 7.5 7.5 0 0 1-7.5 7.5 7.5 7.5 0 0 1-2.016-.277l-7.338 5.694C17.222 39.87 18 41 18 42a6 6 0 0 0 6 6c3.314 0 6-2.686 6-6a6 6 0 0 0-.235-1.655L42 33.77C45.63 30.71 48 26.12 48 21c0-11.598-9.402-21-24-21z" fill="#00adee"/></svg>
                Continue with Steam
              </a>
            </div>

            <p className="modal-switch-text">
              Already have an account?{' '}
              <button type="button" className="modal-switch-link" onClick={() => switchTab('login')}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* Success state */}
        {success && (
          <div className="modal-success-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', lineHeight: 1.6 }}>
              Check your inbox and click the verification link to activate your account, then sign in.
            </p>
            <button
              className="modal-submit-btn"
              style={{ marginTop: 20 }}
              onClick={() => switchTab('login')}
            >
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </>
  )
}