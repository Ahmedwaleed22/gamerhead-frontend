'use client'

import './globals.css'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { notificationsApi, supportApi } from '@/lib/api'
import { connectSocket, disconnectSocket, sendHeartbeat } from '@/lib/socket'
import AuthModal from './components/AuthModal'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { Solar } from "@/lib/solar-duotone";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


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
    window.location.href = '/'
  }

  return (
    <>
      {/* ── NAVBAR (hidden on admin pages) ── */}
      {!isAdminPage && (
        <Header 
          user={user}
          notifs={notifs}
          unreadCount={unreadCount}
          handleMarkAllRead={handleMarkAllRead}
          handleNotifClick={handleNotifClick}
          openLogin={openLogin}
          openRegister={openRegister}
          handleSignOut={handleSignOut}
        />
      )}

      <main>{children}</main>

      {/* ── FOOTER (hidden on admin pages) ── */}
      {!isAdminPage && <Footer />}

      {/* Live Support — hidden on match & admin pages */}
      {!isMatchPage && !isAdminPage && (
        <>
          <button className="livechat-icon" onClick={() => setChatOpen(!chatOpen)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={chatOpen ? Solar.close : Solar.chat} width={22} height={22} />
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
                      {!user ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Icon icon={Solar.lock} width={16} height={16} /> Sign in to start
                        </span>
                      ) : supportLoading ? (
                        'Connecting...'
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Icon icon={Solar.chat} width={16} height={16} /> Start Live Chat
                        </span>
                      )}
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
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                      <Icon icon={Solar.check} width={40} height={40} />
                    </div>
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
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <AuthProvider>
          <InnerLayout>{children}</InnerLayout>
        </AuthProvider>
      </body>
    </html>
  )
}