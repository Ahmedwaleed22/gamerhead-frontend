'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

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
          <span style={{ fontSize: 32 }}>🏆</span>
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