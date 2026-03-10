'use client'

import './globals.css'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { notificationsApi, supportApi } from '@/lib/api'
import { connectSocket, disconnectSocket, sendHeartbeat } from '@/lib/socket'
import AuthModal from './components/AuthModal'

// ─── Inner layout — has access to useAuth() ───────────────────────────────────
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()

  const [chatOpen,  setChatOpen]  = useState(false)
  const [authOpen,  setAuthOpen]  = useState(false)
  const [authTab,   setAuthTab]   = useState<'login' | 'register'>('login')
  const [moreOpen,  setMoreOpen]  = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // ── Real notification state ──
  const [notifs, setNotifs]           = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ── Support chat state ──
  const [supportStep, setSupportStep]       = useState<'form' | 'chat' | 'closed'>('form')
  const [supportDept, setSupportDept]       = useState('')
  const [supportDesc, setSupportDesc]       = useState('')
  const [activeSession, setActiveSession]   = useState<any>(null)
  const [supportMsgs, setSupportMsgs]       = useState<any[]>([])
  const [supportInput, setSupportInput]     = useState('')
  const [supportLoading, setSupportLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isMatchPage = pathname.startsWith('/matches/') || /\/tournaments\/.*\/matches\//.test(pathname)
  const isAdminPage = pathname.startsWith('/admin')

  const moreRef  = useRef<HTMLLIElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current  && !moreRef.current.contains(e.target as Node))  setMoreOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Fetch notifications ──
  const fetchNotifs = useCallback(() => {
    if (!user) return
    notificationsApi.getAll().then((res: any) => {
      setNotifs(Array.isArray(res) ? res : [])
    }).catch(() => {})
    notificationsApi.getUnreadCount().then((res: any) => {
      setUnreadCount(typeof res === 'number' ? res : res?.count || 0)
    }).catch(() => {})
  }, [user])

  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // ── WebSocket: real-time notification push ──
  useEffect(() => {
    if (!user) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('ce_token') : null
    if (!token) return

    const sock = connectSocket(token)

    const handleNotification = (notif: any) => {
      setNotifs(prev => [notif, ...prev])
      setUnreadCount(prev => prev + 1)
    }

    sock.on('notification', handleNotification)

    return () => {
      sock.off('notification', handleNotification)
      disconnectSocket()
    }
  }, [user])

  // ── Heartbeat interval + idle detection ──
  useEffect(() => {
    if (!user) return

    // Send heartbeat every 60s
    const heartbeatIv = setInterval(() => sendHeartbeat('online'), 60000)

    // Idle detection via visibilitychange
    let idleTimeout: ReturnType<typeof setTimeout> | null = null

    const handleVisibility = () => {
      if (document.hidden) {
        // Start 5-min idle timer
        idleTimeout = setTimeout(() => sendHeartbeat('idle'), 5 * 60 * 1000)
      } else {
        // Tab visible again — cancel idle timer, send online
        if (idleTimeout) { clearTimeout(idleTimeout); idleTimeout = null }
        sendHeartbeat('online')
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(heartbeatIv)
      if (idleTimeout) clearTimeout(idleTimeout)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])

  // ── Check for existing open live chat session on mount ──
  useEffect(() => {
    if (!user) return
    supportApi.getMyLiveChat().then((session: any) => {
      if (session && (session.status === 'queued' || session.status === 'active')) {
        setActiveSession(session)
        setSupportMsgs(session.messages || [])
        setSupportStep('chat')
      }
    }).catch(() => {})
  }, [user])

  // ── Poll live chat session every 5s when chat is open ──
  useEffect(() => {
    if (supportStep !== 'chat' || !activeSession?.sessionId || !chatOpen) return
    const iv = setInterval(() => {
      supportApi.getMyLiveChat().then((s: any) => {
        if (!s) { setSupportStep('closed'); return }
        setActiveSession(s)
        setSupportMsgs(s.messages || [])
        if (s.status === 'closed') setSupportStep('closed')
      }).catch(() => {})
    }, 5000)
    return () => clearInterval(iv)
  }, [supportStep, activeSession?.sessionId, chatOpen])

  // ── Auto-scroll chat ──
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [supportMsgs])

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotifClick = async (n: any) => {
    if (!n.read) {
      notificationsApi.markRead(n._id).catch(() => {})
      setNotifs(prev => prev.map(x => x._id === n._id ? { ...x, read: true } : x))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifOpen(false)
    if (n.link) router.push(n.link)
  }

  const DEPT_TO_CATEGORY: Record<string, string> = { 'Tournament Support': 'tournament', 'Technical Issue': 'technical', 'General': 'general' }

  const handleStartSupport = async () => {
    if (!supportDept || !supportDesc.trim()) return
    setSupportLoading(true)
    try {
      const category = DEPT_TO_CATEGORY[supportDept] || 'general'
      const res = await supportApi.requestStaff({ category, message: supportDesc.trim() })
      // Fetch the session we just created
      const session = await supportApi.getMyLiveChat()
      if (session) {
        setActiveSession(session)
        setSupportMsgs(session.messages || [])
        setSupportStep('chat')
      }
    } catch { /* error */ }
    setSupportLoading(false)
  }

  const handleSendSupport = async () => {
    if (!supportInput.trim() || !activeSession?.sessionId) return
    const text = supportInput.trim()
    setSupportInput('')
    try {
      const updated = await supportApi.sendLiveChatMessage(activeSession.sessionId, { text })
      setSupportMsgs(updated.messages || [])
    } catch { /* error */ }
  }

  const handleCloseChat = () => {
    setSupportStep('closed')
  }

  const handleNewChat = () => {
    setActiveSession(null)
    setSupportMsgs([])
    setSupportDept('')
    setSupportDesc('')
    setSupportStep('form')
  }

  const openLogin    = () => { setAuthTab('login');    setAuthOpen(true) }
  const openRegister = () => { setAuthTab('register'); setAuthOpen(true) }

  const handleSignOut = () => {
    logout()
    setUserOpen(false)
    window.location.href = '/'
  }

  const initials    = user ? user.username.slice(0, 2).toUpperCase() : ''
  const cashDisplay = user ? `$${(user.cashBalance / 100).toFixed(2)}` : '$0.00'

  return (
    <>
      {/* ── NAVBAR (hidden on admin pages) ── */}
      {!isAdminPage && <header style={{
        width: '100vw',
        position: 'relative',
        left: '50%',
        marginLeft: '-50vw',
        background: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        zIndex: 200,
      }}>
        <div style={{ width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
          <nav className="navbar">

            <div className="navbar-brand">
              <span style={{ fontSize: 28 }}>🏆</span>
              <div className="navbar-logo-text">
                <span className="navbar-logo-text-main">GamerHead</span>
                <span className="navbar-logo-text-sub">Life's A Game</span>
              </div>
            </div>

            <ul className="navbar-nav">
              <li><Link href="/"            className="nav-link">Home</Link></li>
              <li><Link href="/tournaments" className="nav-link">Tournaments</Link></li>
              <li><Link href="/games"       className="nav-link">Games</Link></li>
              <li><Link href="/coaching"    className="nav-link">Coaching</Link></li>
              <li><Link href="/forum"       className="nav-link">Forum</Link></li>
              <li><Link href="/store"       className="nav-link">Store</Link></li>
              <li className="nav-dropdown-wrapper" ref={moreRef}>
                <button
                  className={`nav-link nav-dropdown-trigger${moreOpen ? ' active' : ''}`}
                  onClick={() => setMoreOpen(!moreOpen)}
                >
                  More <span className="nav-dropdown-chevron">{moreOpen ? '▲' : '▼'}</span>
                </button>
                {moreOpen && (
                  <div className="nav-dropdown-menu">
                    <Link href="/leaderboards" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                      <span className="nav-dropdown-item-icon">🏅</span>
                      <div>
                        <div className="nav-dropdown-item-title">Leaderboards</div>
                        <div className="nav-dropdown-item-sub">Top players & teams</div>
                      </div>
                    </Link>
                    <Link href="/premium" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                      <span className="nav-dropdown-item-icon">⭐</span>
                      <div>
                        <div className="nav-dropdown-item-title">Premium</div>
                        <div className="nav-dropdown-item-sub">Unlock exclusive perks</div>
                      </div>
                    </Link>
                    <Link href="/rules" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                      <span className="nav-dropdown-item-icon">📋</span>
                      <div>
                        <div className="nav-dropdown-item-title">Rules & Legal</div>
                        <div className="nav-dropdown-item-sub">Platform rules & policies</div>
                      </div>
                    </Link>
                    <Link href="/about" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                      <span className="nav-dropdown-item-icon">🏢</span>
                      <div>
                        <div className="nav-dropdown-item-title">About Us</div>
                        <div className="nav-dropdown-item-sub">Our story and team</div>
                      </div>
                    </Link>
                  </div>
                )}
              </li>
            </ul>

            <div className="navbar-right">
              {user ? (
                <>
                  <Link href="/store" className="nav-wallet-pill">
                    <span className="nav-wallet-credits">🪙 {user.credits}</span>
                    <span className="nav-wallet-divider" />
                    <span className="nav-wallet-cash">{cashDisplay}</span>
                  </Link>

                  <div className="nav-notif-wrap" ref={notifRef}>
                    <button
                      className={`nav-notif-btn${notifOpen ? ' active' : ''}`}
                      onClick={() => setNotifOpen(!notifOpen)}
                    >
                      🔔
                      {unreadCount > 0 && <span className="nav-notif-badge">{unreadCount}</span>}
                    </button>
                    {notifOpen && (
                      <div className="nav-notif-dropdown">
                        <div className="nav-notif-header">
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <button className="nav-notif-mark-read" onClick={handleMarkAllRead}>Mark all read</button>
                          )}
                        </div>
                        <div className="nav-notif-list">
                          {notifs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px 12px', color: 'var(--text-muted)', fontSize: 12 }}>No notifications yet</div>
                          ) : notifs.map((n: any) => (
                            <div key={n._id} className={`nav-notif-item${!n.read ? ' unread' : ''}`} onClick={() => handleNotifClick(n)} style={{ cursor: n.link ? 'pointer' : 'default' }}>
                              <span className="nav-notif-icon">{n.icon || '🔔'}</span>
                              <div className="nav-notif-body">
                                <div className="nav-notif-text">{n.text}</div>
                                <div className="nav-notif-time">{n.createdAt ? timeAgo(n.createdAt) : ''}</div>
                              </div>
                              {!n.read && <span className="nav-notif-dot" />}
                            </div>
                          ))}
                        </div>
                        <Link href="/mailbox" className="nav-notif-footer" onClick={() => setNotifOpen(false)}>
                          View Mailbox →
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="nav-user-wrap" ref={userRef}>
                    <button
                      className={`nav-user-btn${userOpen ? ' active' : ''}`}
                      onClick={() => setUserOpen(!userOpen)}
                    >
                      <div className="nav-user-avatar">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span className="nav-user-initials">{initials}</span>
                        )}
                        <span className="nav-user-online-dot" />
                      </div>
                      <div className="nav-user-info">
                        <span className="nav-user-name" style={{ color: user.usernameColor || '#E74C3C' }}>
                          {user.username}
                        </span>
                        <span className="nav-user-level">Lv.{user.level}</span>
                      </div>
                      <span className="nav-user-chevron">{userOpen ? '▲' : '▼'}</span>
                    </button>

                    {userOpen && (
                      <div className="nav-user-dropdown">
                        <div className="nav-user-dd-header">
                          <div className="nav-user-dd-avatar">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : initials}
                          </div>
                          <div>
                            <div className="nav-user-dd-name" style={{ color: user.usernameColor || '#E74C3C' }}>
                              {user.username}
                            </div>
                            <div className="nav-user-dd-sub">
                              Level {user.level} · {user.credits} Tickets · {cashDisplay}
                            </div>
                          </div>
                        </div>
                        <div className="nav-user-dd-divider" />
                        <Link href={`/profile/${user.slug}`} className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          My Profile
                        </Link>
                        <Link href="/mailbox" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          Mailbox
                          {unreadCount > 0 && <span className="nav-user-dd-badge">{unreadCount}</span>}
                        </Link>
                        <Link href="/teams" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          My Teams
                        </Link>
                        <Link href="/dashboard" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          Account Dashboard
                        </Link>
                        <Link href="/settings" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          Account Settings
                        </Link>
                        {user.isCoach && (
                          <Link href="/coaching/dashboard" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                            Coach Dashboard
                          </Link>
                        )}
                        {(user as any).role === 'admin' && (
                          <Link href="/admin" className="nav-user-dd-item" onClick={() => setUserOpen(false)} style={{ color: '#e8000d' }}>
                            Admin Dashboard
                          </Link>
                        )}
                        <div className="nav-user-dd-divider" />
                        {!user.isPremium && (
                          <Link href="/premium" className="nav-user-dd-item premium" onClick={() => setUserOpen(false)}>
                            Upgrade to Premium
                          </Link>
                        )}
                        <button className="nav-user-dd-item danger" onClick={handleSignOut}>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button className="btn-signin" onClick={openLogin}>Sign In</button>
                  <button className="btn-signup" onClick={openRegister}>Sign Up</button>
                </>
              )}
            </div>

          </nav>
        </div>
      </header>}

      <main>{children}</main>

      {/* ── FOOTER (hidden on admin pages) ── */}
      {!isAdminPage && <footer>
        <div className="container">
          <div className="footer-sponsor-strip">
            <span className="footer-sponsor-label">OFFICIAL PARTNERS</span>
            <div className="footer-sponsor-logos">
              {[
                { name: 'Razer', logo: <svg width="80" height="20" viewBox="0 0 512 107" fill="#44D62C"><path d="M207.3 12.5h29.2v82.1h51.3v24.8H207.3V12.5zm-42.4 0h-82V36h52.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2h-52.8v56.9h29.2V87.2h13.6l25.1 32.2h35.8L157 82.7c13.6-7.3 22.9-21.6 22.9-37.8 0-17.8-14.5-32.4-32.4-32.4h-82.6zm246.8 0l-44.1 106.9h30.8l8.1-21.3h47.6l8.3 21.3h30.8L448.9 12.5h-37.2zm-0.6 62.3l15.8-41.7 16 41.7h-31.8zM493.1 12.5h-82v24.8h82V12.5zm0 82.1h-82v24.8h82V94.6zm0-41h-82v24.8h82V53.6zM0 12.5h82v24.8H29.2v17.3h52.8v24.8H29.2v17.3H82v22.7H0V12.5z"/></svg> },
                { name: 'SteelSeries', logo: <svg width="80" height="22" viewBox="0 0 24 24" fill="#FF5200"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.787c-1.137.744-2.467 1.138-3.893 1.138-2.344 0-4.467-1.15-5.756-2.913l2.072-1.442c.855 1.172 2.205 1.93 3.684 1.93.83 0 1.612-.244 2.263-.66l1.63 1.947zm1.32-4.42c-.084 1.076-.373 2.095-.855 3.018l-1.947-1.63c.297-.586.486-1.233.555-1.918l2.247.53zm-2.486-5.58c.744 1.137 1.138 2.467 1.138 3.894 0 .384-.029.76-.084 1.13l-2.247-.53c.029-.196.049-.397.049-.6 0-1.48-.758-2.83-1.93-3.685l1.442-2.072c.635.47 1.19 1.035 1.632 1.682v.181zm-7.022-2.32l-.53 2.247c.196-.029.397-.049.6-.049 1.48 0 2.83.758 3.685 1.93l2.072-1.442c-1.172-1.605-3.044-2.686-5.147-2.686-.234 0-.462.014-.68.037v-.037zm-5.143 4.24c.084-1.076.373-2.095.855-3.018l1.947 1.63c-.297.586-.486 1.233-.555 1.918l-2.247-.53zm.53 2.08l2.247.53c-.029.196-.049.397-.049.6 0 1.48.758 2.83 1.93 3.685l-1.442 2.072c-1.605-1.172-2.686-3.044-2.686-5.147 0-.604.078-1.188.217-1.74h-.217z"/></svg> },
                { name: 'HyperX', logo: <svg width="70" height="20" viewBox="0 0 120 32" fill="#E8000D"><path d="M0 0h8.5l7.7 12.3L24 0h8.5L21.2 16 32.5 32H24l-7.8-12.5L8.5 32H0l11.3-16L0 0zm40 0h8v12.5L60.5 0H70L55 16l15 16h-9.5L48 19.5V32h-8V0zm80 0h-8.5L99 16l12.5 16h-9.5L92 19.5 82 32h-9.5L85 16 72.5 0H82l10 12.5L102 0h8l10 0z"/></svg> },
                { name: 'Corsair', logo: <svg width="70" height="22" viewBox="0 0 24 24" fill="#F3F3F3"><path d="M12.004.945c-3.467 0-5.457.924-5.968 1.063C3.27 2.97.945 5.773.945 12.004c0 6.23 2.326 9.034 5.091 9.996.511.139 2.501 1.063 5.968 1.063s5.457-.924 5.968-1.063c2.765-.962 5.091-3.766 5.091-9.996 0-6.231-2.326-9.034-5.091-9.996-.511-.139-2.501-1.063-5.968-1.063zm6.84 8.217c.006.055.006.114.006.174 0 3.78-2.79 8.14-8.14 8.14a8.092 8.092 0 01-4.388-1.286 5.767 5.767 0 004.248-1.188c-1.253-.023-2.31-.851-2.674-1.988.175.034.355.052.54.052.262 0 .515-.035.756-.1-1.31-.263-2.296-1.42-2.296-2.806v-.024c.386.215.828.344 1.297.359a2.866 2.866 0 01-.889-3.834 8.159 8.159 0 005.922 3.002 2.871 2.871 0 014.883-2.615 5.756 5.756 0 001.819-.695 2.877 2.877 0 01-1.26 1.587 5.734 5.734 0 001.646-.451 5.833 5.833 0 01-1.434 1.487l.264.186z"/></svg> },
                { name: 'Elgato', logo: <svg width="70" height="20" viewBox="0 0 24 24" fill="#1A9FFF"><circle cx="12" cy="12" r="10" fill="none" stroke="#1A9FFF" strokeWidth="2"/><polygon points="10,7 17,12 10,17" fill="#1A9FFF"/></svg> },
              ].map((s, i) => (
                <div key={i} className="footer-sponsor-slot" style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                  {s.logo}
                </div>
              ))}
              <Link href="/contact" className="footer-sponsor-cta">Become a Partner →</Link>
            </div>
          </div>

          <div className="footer-body">
            <div className="footer-brand-col">
              <div className="footer-brand navbar-brand" style={{ marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>🏆</span>
                <div className="navbar-logo-text">
                  <span className="navbar-logo-text-main">GamerHead</span>
                  <span className="navbar-logo-text-sub">Life's A Game</span>
                </div>
              </div>
              <p className="footer-about">
                The premier destination for competitive gaming. Wager matches, tournaments, coaching, and ladder play across the biggest titles — all in one place.
              </p>
              <div className="footer-socials" style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <a href="#" aria-label="Twitter" style={{ color: '#9CA3AF', transition: 'color .15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" style={{ color: '#9CA3AF', transition: 'color .15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="#" aria-label="YouTube" style={{ color: '#9CA3AF', transition: 'color .15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" style={{ color: '#9CA3AF', transition: 'color .15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/></svg>
                </a>
                <a href="#" aria-label="Discord" style={{ color: '#9CA3AF', transition: 'color .15s' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </a>
              </div>
              <div className="footer-trust-row">
                <span className="footer-trust-badge">🔒 SSL Secured</span>
                <span className="footer-trust-badge">✓ Verified Platform</span>
                <span className="footer-trust-badge">🛡️ Fair Play</span>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-col">
                <h4 className="footer-title">Compete</h4>
                <ul className="footer-links">
                  <li><Link href="/tournaments"  className="footer-link">Tournaments</Link></li>
                  <li><Link href="/games"        className="footer-link">Games</Link></li>
                  <li><Link href="/leaderboards" className="footer-link">Leaderboards</Link></li>
                  <li><Link href="/coaching"     className="footer-link">Coaching</Link></li>
                  <li><Link href="/store"        className="footer-link">Store</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4 className="footer-title">Support</h4>
                <ul className="footer-links">
                  <li><Link href="/dashboard?tab=tickets" className="footer-link">Ticket Center</Link></li>
                  <li><Link href="/rules"                 className="footer-link">FAQ</Link></li>
                  <li><Link href="/rules"                 className="footer-link">Rules & Legal</Link></li>
                  <li><Link href="/contact"               className="footer-link">Contact Us</Link></li>
                </ul>
              </div>
              <div className="footer-col">
                <h4 className="footer-title">Company</h4>
                <ul className="footer-links">
                  <li><Link href="/about"   className="footer-link">About Us</Link></li>
                  <li><Link href="/contact" className="footer-link">Press & Media</Link></li>
                  <li><Link href="/rules"   className="footer-link">Privacy Policy</Link></li>
                  <li><Link href="/rules"   className="footer-link">Terms of Service</Link></li>
                  <li><Link href="/contact" className="footer-link">Advertise With Us</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <span>© {new Date().getFullYear()} GamerHead LLC. All rights reserved.</span>
              <span className="footer-bottom-sep">·</span>
              <span className="footer-bottom-fine">All game titles, trade names and associated imagery are trademarks of their respective owners.</span>
            </div>
            <div className="footer-bottom-right">
              <Link href="/rules"   className="footer-bottom-link">Privacy</Link>
              <Link href="/rules"   className="footer-bottom-link">Terms</Link>
              <Link href="/contact" className="footer-bottom-link">Contact</Link>
            </div>
          </div>
        </div>
      </footer>}

      {/* Live Support — hidden on match & admin pages */}
      {!isMatchPage && !isAdminPage && (
        <>
          <button className="livechat-icon" onClick={() => setChatOpen(!chatOpen)}>
            {chatOpen ? '✕' : '💬'}
          </button>
          {chatOpen && (
            <div className="livechat-popup" style={{ width: 340, maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
              {/* ── FORM STEP ── */}
              {supportStep === 'form' && (
                <>
                  <div className="livechat-header">
                    Live Support
                    <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>Connect with a staff member in real-time.</div>
                  </div>
                  <div className="livechat-body" style={{ flex: 1, overflow: 'auto' }}>
                    <select className="site-input" value={supportDept} onChange={e => setSupportDept(e.target.value)}>
                      <option value="">Select Department *</option>
                      <option>Tournament Support</option>
                      <option>Technical Issue</option>
                      <option>General</option>
                    </select>
                    <textarea className="site-input" placeholder="How can we help? *" value={supportDesc} onChange={e => setSupportDesc(e.target.value)} style={{ height: 80, resize: 'vertical', paddingTop: 8 }} />
                    <button
                      className="btn-chat-start"
                      onClick={handleStartSupport}
                      disabled={!supportDept || !supportDesc.trim() || supportLoading || !user}
                      style={{ opacity: (!supportDept || !supportDesc.trim() || !user) ? 0.5 : 1 }}
                    >
                      {!user ? '🔒 Sign in to start' : supportLoading ? 'Connecting...' : '💬 Start Live Chat'}
                    </button>
                  </div>
                </>
              )}

              {/* ── CHAT STEP ── */}
              {supportStep === 'chat' && activeSession && (
                <>
                  <div className="livechat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div>Live Support</div>
                      <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                        {activeSession.status === 'active' ? 'Agent connected' : 'Waiting for agent...'}
                      </div>
                    </div>
                    <button onClick={handleCloseChat} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '4px 10px', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Close</button>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200, maxHeight: 320 }}>
                    {supportMsgs.map((m: any, i: number) => {
                      const isMine = m.senderId?.toString() === (user as any)?._id || m.senderId?.toString() === (user as any)?.id || m.senderName === user?.username
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                          {m.isSystem ? (
                            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#A78BFA', maxWidth: '90%', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{m.text}</div>
                          ) : (
                            <div style={{ background: isMine ? 'rgba(178,45,45,0.2)' : 'var(--bg-4)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#e0e0e0', maxWidth: '80%' }}>
                              {!isMine && <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 2, fontWeight: 600 }}>{m.senderName}</div>}
                              {m.text}
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>{m.sentAt ? timeAgo(m.sentAt) : ''}</div>
                        </div>
                      )
                    })}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <input
                      className="site-input"
                      placeholder="Type a message..."
                      value={supportInput}
                      onChange={e => setSupportInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendSupport()}
                      style={{ flex: 1, margin: 0 }}
                    />
                    <button onClick={handleSendSupport} style={{ background: 'var(--red)', border: 'none', borderRadius: 4, padding: '0 14px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>Send</button>
                  </div>
                </>
              )}

              {/* ── CLOSED STEP ── */}
              {supportStep === 'closed' && (
                <>
                  <div className="livechat-header">Chat Ended</div>
                  <div className="livechat-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                    <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Your chat session has ended. Thank you for contacting us!</div>
                    <button className="btn-chat-start" onClick={handleNewChat}>Start New Chat</button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} />
    </>
  )
}

// ─── Root layout — wraps everything with AuthProvider ─────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <InnerLayout>{children}</InnerLayout>
        </AuthProvider>
      </body>
    </html>
  )
}