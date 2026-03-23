'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion } from "motion/react"
import { Icon } from "@iconify/react"
import { usePathname } from 'next/navigation'
import Logo from './Logo'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Header({
  user,
  notifs,
  unreadCount,
  handleMarkAllRead,
  handleNotifClick,
  openLogin,
  openRegister,
  handleSignOut,
}: any) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

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

  const initials    = user ? user.username.slice(0, 2).toUpperCase() : ''
  const cashDisplay = user ? `$${(user.cashBalance / 100).toFixed(2)}` : '$0.00'

  const pathname = usePathname()

  const isNavActive = (base: string) => {
    if (!pathname) return false
    if (base === '/') return pathname === '/'
    return pathname === base || pathname.startsWith(base + '/')
  }

  return (
    <header className="header-modern">
      <style dangerouslySetInnerHTML={{__html: `
        .header-modern {
          position: sticky;
          top: 0;
          z-index: 200;
          background: rgba(9, 9, 11, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          width: 100vw;
        }
        
        .header-modern::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,0,13,0.3), transparent);
          pointer-events: none;
        }

        .header-modern .navbar {
          border-bottom: none;
          padding: 18px 0;
        }

        .header-modern .nav-link {
          position: relative;
          color: #9CA3AF;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .header-modern .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0px; left: 50%; width: 0; height: 2px;
          background: var(--red);
          transform: translateX(-50%);
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .header-modern .nav-link:hover, .header-modern .nav-link.active {
          color: #fff;
          // background: rgba(255,255,255,0.03);
        }

        .header-modern .nav-link:hover::after, .header-modern .nav-link.active::after {
          width: calc(100% - 28px);
        }
        
        .header-modern .navbar-logo-text-main {
          text-shadow: 0 0 16px rgba(255,255,255,0.3);
          transition: color 0.3s, text-shadow 0.3s;
        }
        .header-modern .navbar-brand:hover .navbar-logo-text-main {
          color: var(--red);
          text-shadow: 0 0 24px rgba(232,0,13,0.5);
        }
        
        .header-modern .navbar-logo-text-sub {
          text-shadow: 0 0 12px rgba(232,0,13,0.4);
        }

        /* Nav dropdown overrides for glassmorphism */
        .glass-dropdown {
          background: rgba(15, 15, 20, 0.85) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          overflow: hidden;
        }

        .header-modern .btn-signin {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #fff;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .header-modern .btn-signin:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-1px);
        }

        .header-modern .btn-signup {
          background: var(--red);
          border: none;
          color: #fff;
          border-radius: 8px;
          box-shadow: 0 8px 16px -4px rgba(232,0,13,0.4);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .header-modern .btn-signup:hover {
          background: var(--red-dark);
          box-shadow: 0 10px 20px -2px rgba(232,0,13,0.6);
          transform: translateY(-1px);
        }
        
        .header-modern .nav-wallet-pill {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s;
        }
        .header-modern .nav-wallet-pill:hover {
          background: rgba(255,255,255,0.06);
          border-color: rgba(232,0,13,0.3);
        }
      `}} />

      <div style={{ width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
        <nav className="navbar">
          
          <Link href="/" className="navbar-brand" style={{ textDecoration: 'none' }}>
            <motion.span 
              style={{ fontSize: 28 }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Logo />
            </motion.span>
          </Link>

          <ul className="navbar-nav">
            <li><Link href="/"            className={`nav-link${isNavActive('/') ? ' active' : ''}`}>Home</Link></li>
            <li><Link href="/tournaments" className={`nav-link${isNavActive('/tournaments') ? ' active' : ''}`}>Tournaments</Link></li>
            <li><Link href="/games"       className={`nav-link${isNavActive('/games') ? ' active' : ''}`}>Games</Link></li>
            <li><Link href="/coaching"    className={`nav-link${isNavActive('/coaching') ? ' active' : ''}`}>Coaching</Link></li>
            <li><Link href="/forum"       className={`nav-link${isNavActive('/forum') ? ' active' : ''}`}>Forum</Link></li>
            <li><Link href="/store"       className={`nav-link${isNavActive('/store') ? ' active' : ''}`}>Store</Link></li>
            <li className="nav-dropdown-wrapper" ref={moreRef}>
              <button
                className={`nav-link nav-dropdown-trigger${moreOpen ? ' active' : ''}`}
                onClick={() => setMoreOpen(!moreOpen)}
              >
                More <Icon icon={moreOpen ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"} className="nav-dropdown-chevron" />
              </button>
              {moreOpen && (
                <div className="nav-dropdown-menu glass-dropdown">
                  <Link href="/leaderboards" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                    <Icon icon="ri:medal-fill" className="nav-dropdown-item-icon" />
                    <div>
                      <div className="nav-dropdown-item-title">Leaderboards</div>
                      <div className="nav-dropdown-item-sub">Top players & teams</div>
                    </div>
                  </Link>
                  <Link href="/premium" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                    <Icon icon="ri:vip-crown-fill" className="nav-dropdown-item-icon" />
                    <div>
                      <div className="nav-dropdown-item-title">Premium</div>
                      <div className="nav-dropdown-item-sub">Unlock exclusive perks</div>
                    </div>
                  </Link>
                  <Link href="/rules" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                    <Icon icon="ri:file-list-3-fill" className="nav-dropdown-item-icon" />
                    <div>
                      <div className="nav-dropdown-item-title">Rules & Legal</div>
                      <div className="nav-dropdown-item-sub">Platform rules & policies</div>
                    </div>
                  </Link>
                  <Link href="/about" className="nav-dropdown-item" onClick={() => setMoreOpen(false)}>
                    <Icon icon="ri:building-2-fill" className="nav-dropdown-item-icon" />
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
                  <span className="nav-wallet-credits" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon icon="ri:coin-line" style={{ color: '#FCD34D', fontSize: 16 }} /> {user.credits}
                  </span>
                  <span className="nav-wallet-divider" />
                  <span className="nav-wallet-cash">{cashDisplay}</span>
                </Link>

                <div className="nav-notif-wrap" ref={notifRef}>
                  <button
                    className={`nav-notif-btn${notifOpen ? ' active' : ''}`}
                    onClick={() => setNotifOpen(!notifOpen)}
                  >
                    <Icon icon="ri:notification-3-fill" style={{ fontSize: 18 }} />
                    {unreadCount > 0 && <span className="nav-notif-badge">{unreadCount}</span>}
                  </button>
                  {notifOpen && (
                    <div className="nav-notif-dropdown glass-dropdown">
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
                          <div key={n._id} className={`nav-notif-item${!n.read ? ' unread' : ''}`} onClick={() => { handleNotifClick(n); setNotifOpen(false); }} style={{ cursor: n.link ? 'pointer' : 'default' }}>
                            <Icon icon="ri:notification-3-fill" className="nav-notif-icon" />
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
                    <Icon icon={userOpen ? "ri:arrow-up-s-line" : "ri:arrow-down-s-line"} className="nav-user-chevron" />
                  </button>

                  {userOpen && (
                    <div className="nav-user-dropdown glass-dropdown">
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
    </header>
  )
}
