'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { motion } from "motion/react"
import { Icon } from "@iconify/react"
import { usePathname } from 'next/navigation'
import Logo from './Logo'
import { loadCart, saveCart, subscribeCart, type StoredCartItem } from '@/lib/cart'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Featured games shown in the Tournaments mega-menu ─────────────────────────
const FEATURED_GAMES: { name: string; slug: string; icon: string; color: string; tag: string }[] = [
  { name: 'Call of Duty',  slug: 'call-of-duty', icon: 'ri:crosshair-2-fill', color: '#4A9EFF', tag: 'FPS' },
  { name: 'Warzone',       slug: 'warzone',      icon: 'ri:sword-fill',       color: '#FF6B35', tag: 'Battle Royale' },
  { name: 'Fortnite',      slug: 'fortnite',     icon: 'ri:hammer-fill',      color: '#7B68EE', tag: 'Battle Royale' },
  { name: 'EA FC / FIFA',  slug: 'fifa-ea-fc',   icon: 'ri:football-fill',    color: '#22C55E', tag: 'Sports' },
  { name: 'Rocket League', slug: 'rocket-league',icon: 'ri:car-fill',         color: '#A855F7', tag: 'Sports' },
  { name: 'Apex Legends',  slug: 'apex-legends', icon: 'ri:focus-3-fill',     color: '#EF4444', tag: 'Battle Royale' },
  { name: 'Valorant',      slug: 'valorant',     icon: 'ri:crosshair-fill',   color: '#FF4655', tag: 'FPS' },
  { name: 'NBA 2K',        slug: 'nba-2k',       icon: 'ri:basketball-fill',  color: '#F97316', tag: 'Sports' },
]

const TOURNEY_LINKS: { label: string; sub: string; href: string; icon: string }[] = [
  { label: 'Browse All',      sub: 'Every open bracket',      href: '/tournaments',        icon: 'ri:trophy-fill' },
  { label: 'Host a Tourney',  sub: 'Create your own event',   href: '/tournaments/create', icon: 'ri:add-circle-fill' },
  { label: 'Leaderboards',    sub: 'Top earners & teams',     href: '/leaderboards',       icon: 'ri:bar-chart-box-fill' },
  { label: 'How Payouts Work',sub: 'Rules & prize payouts',   href: '/rules',              icon: 'ri:money-dollar-circle-fill' },
]

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
  const [tourneyOpen, setTourneyOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [cartItems, setCartItems] = useState<StoredCartItem[]>([])

  const moreRef    = useRef<HTMLLIElement>(null)
  const tourneyRef = useRef<HTMLLIElement>(null)
  const userRef    = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)
  const cartRef    = useRef<HTMLDivElement>(null)
  const tourneyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current  && !moreRef.current.contains(e.target as Node))  setMoreOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (cartRef.current  && !cartRef.current.contains(e.target as Node))  setCartOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setAvatarFailed(false)
  }, [user?.avatarUrl])

  // ── Live cart (badge + dropdown), synced with the Store page ──
  useEffect(() => {
    const sync = () => setCartItems(loadCart())
    sync()
    return subscribeCart(sync)
  }, [])

  const cartQty   = cartItems.reduce((s, i) => s + (i.qty || 0), 0)
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0)
  const money     = (usd: number) => `$${usd.toFixed(2)}`  // cart prices are stored in USD
  const removeCartItem = (id: string) => saveCart(loadCart().filter(i => i.id !== id))

  // Hover-intent for the Tournaments mega-menu.
  const openTourney = () => {
    if (tourneyTimer.current) clearTimeout(tourneyTimer.current)
    setTourneyOpen(true)
  }
  const closeTourney = () => {
    if (tourneyTimer.current) clearTimeout(tourneyTimer.current)
    tourneyTimer.current = setTimeout(() => setTourneyOpen(false), 140)
  }

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
          background: rgba(15, 15, 20, 0.9) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1) !important;
          border-radius: 14px !important;
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
            <li><Link href="/"      className={`nav-link${isNavActive('/') ? ' active' : ''}`}>Home</Link></li>

            {/* Tournaments — mega menu */}
            <li
              className="nav-mega-wrapper"
              ref={tourneyRef}
              onMouseEnter={openTourney}
              onMouseLeave={closeTourney}
            >
              <Link
                href="/tournaments"
                className={`nav-link nav-mega-trigger${isNavActive('/tournaments') || tourneyOpen ? ' active' : ''}`}
                onClick={() => setTourneyOpen(false)}
              >
                Tournaments <Icon icon="ri:arrow-down-s-line" className={`nav-dropdown-chevron nav-mega-chevron${tourneyOpen ? ' open' : ''}`} />
              </Link>

              {tourneyOpen && (
                <div className="nav-mega-menu glass-dropdown" onMouseEnter={openTourney} onMouseLeave={closeTourney}>
                  <div className="nav-mega-grid">
                    {/* Games column */}
                    <div className="nav-mega-games-col">
                      <div className="nav-mega-heading">
                        <Icon icon="ri:gamepad-fill" /> Compete by Game
                      </div>
                      <div className="nav-mega-games">
                        {FEATURED_GAMES.map(g => (
                          <Link
                            key={g.slug}
                            href={`/games/${g.slug}`}
                            className="nav-mega-game"
                            onClick={() => setTourneyOpen(false)}
                          >
                            <span className="nav-mega-game-icon" style={{ color: g.color, background: `${g.color}1f`, borderColor: `${g.color}55` }}>
                              <Icon icon={g.icon} />
                            </span>
                            <span className="nav-mega-game-text">
                              <span className="nav-mega-game-name">{g.name}</span>
                              <span className="nav-mega-game-tag">{g.tag}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Quick links column */}
                    <div className="nav-mega-links-col">
                      <div className="nav-mega-heading"><Icon icon="ri:flashlight-fill" /> Quick Links</div>
                      <div className="nav-mega-links">
                        {TOURNEY_LINKS.map(l => (
                          <Link key={l.href} href={l.href} className="nav-mega-link" onClick={() => setTourneyOpen(false)}>
                            <Icon icon={l.icon} className="nav-mega-link-icon" />
                            <span className="nav-mega-link-text">
                              <span className="nav-mega-link-label">{l.label}</span>
                              <span className="nav-mega-link-sub">{l.sub}</span>
                            </span>
                          </Link>
                        ))}
                      </div>

                      <Link href="/tournaments" className="nav-mega-cta" onClick={() => setTourneyOpen(false)}>
                        <div className="nav-mega-cta-text">
                          <span className="nav-mega-cta-title">Live &amp; Upcoming</span>
                          <span className="nav-mega-cta-sub">Jump into a cash tournament now</span>
                        </div>
                        <Icon icon="ri:arrow-right-line" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>

            <li><Link href="/games"    className={`nav-link${isNavActive('/games') ? ' active' : ''}`}>Games</Link></li>
            <li><Link href="/coaching" className={`nav-link${isNavActive('/coaching') ? ' active' : ''}`}>Coaching</Link></li>
            <li><Link href="/forum"    className={`nav-link${isNavActive('/forum') ? ' active' : ''}`}>Forum</Link></li>
            <li><Link href="/store"    className={`nav-link${isNavActive('/store') ? ' active' : ''}`}>Store</Link></li>
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

                {/* Cart */}
                <div className="nav-cart-wrap" ref={cartRef}>
                  <button
                    className={`nav-cart-btn${cartQty > 0 ? ' has-items' : ''}${cartOpen ? ' active' : ''}`}
                    onClick={() => setCartOpen(!cartOpen)}
                    aria-label={`Cart${cartQty > 0 ? ` (${cartQty} item${cartQty === 1 ? '' : 's'})` : ''}`}
                  >
                    <Icon icon="ri:shopping-cart-2-fill" style={{ fontSize: 18 }} />
                    {cartQty > 0 && <span className="nav-cart-badge">{cartQty > 99 ? '99+' : cartQty}</span>}
                  </button>

                  {cartOpen && (
                    <div className="nav-cart-dropdown glass-dropdown">
                      <div className="nav-cart-dd-header">
                        <span className="nav-cart-dd-title">
                          <Icon icon="ri:shopping-cart-2-fill" />
                          Cart
                          {cartQty > 0 && <span className="nav-cart-dd-count">{cartQty}</span>}
                        </span>
                        {cartItems.length > 0 && (
                          <button className="nav-cart-dd-clear" onClick={() => saveCart([])}>Clear</button>
                        )}
                      </div>

                      {cartItems.length === 0 ? (
                        <div className="nav-cart-empty">
                          <Icon icon="ri:shopping-cart-line" />
                          <span>Your cart is empty</span>
                          <Link href="/store" className="nav-cart-empty-link" onClick={() => setCartOpen(false)}>
                            Browse the Store <Icon icon="ri:arrow-right-line" />
                          </Link>
                        </div>
                      ) : (
                        <>
                          <div className="nav-cart-list">
                            {cartItems.map(item => (
                              <div key={item.id} className="nav-cart-item">
                                <div className="nav-cart-item-img">
                                  {item.image
                                    ? <img src={item.image} alt={item.name} />
                                    : <Icon icon="ri:shopping-bag-3-fill" />}
                                </div>
                                <div className="nav-cart-item-body">
                                  <div className="nav-cart-item-name">{item.name}</div>
                                  <div className="nav-cart-item-meta">
                                    <span className="nav-cart-item-qty">{item.qty} ×</span>
                                    {money(item.price)}
                                  </div>
                                </div>
                                <div className="nav-cart-item-right">
                                  <span className="nav-cart-item-line">{money(item.price * item.qty)}</span>
                                  <button
                                    className="nav-cart-item-remove"
                                    onClick={() => removeCartItem(item.id)}
                                    aria-label={`Remove ${item.name}`}
                                  >
                                    <Icon icon="ri:close-line" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="nav-cart-footer">
                            <div className="nav-cart-subtotal">
                              <span>Subtotal</span>
                              <strong>{money(cartTotal)}</strong>
                            </div>
                            <Link href="/checkout" className="nav-cart-checkout" onClick={() => setCartOpen(false)}>
                              <Icon icon="ri:shopping-cart-2-fill" /> View Shopping Cart
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

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
                        <span className="nav-notif-title">
                          <Icon icon="ri:notification-3-fill" />
                          Notifications
                          {unreadCount > 0 && <span className="nav-notif-count">{unreadCount}</span>}
                        </span>
                        {unreadCount > 0 && (
                          <button className="nav-notif-mark-read" onClick={handleMarkAllRead}>Mark all read</button>
                        )}
                      </div>
                      <div className="nav-notif-list">
                        {notifs.length === 0 ? (
                          <div className="nav-notif-empty">
                            <Icon icon="ri:notification-off-line" />
                            <span>You&apos;re all caught up</span>
                          </div>
                        ) : notifs.map((n: any) => (
                          <div key={n.id} className={`nav-notif-item${!n.read ? ' unread' : ''}`} onClick={() => { handleNotifClick(n); setNotifOpen(false); }} style={{ cursor: n.link ? 'pointer' : 'default' }}>
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
                        View Mailbox <Icon icon="ri:arrow-right-line" />
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
                      {user.avatarUrl && !avatarFailed ? (
                        <img src={user.avatarUrl} alt={user.username} onError={() => setAvatarFailed(true)} />
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
                    <Icon icon="ri:arrow-down-s-line" className={`nav-user-chevron${userOpen ? ' open' : ''}`} />
                  </button>

                  {userOpen && (
                    <div className="nav-user-dropdown glass-dropdown">
                      <div className="nav-user-dd-header">
                        <div className="nav-user-dd-avatar">
                          {user.avatarUrl && !avatarFailed ? (
                            <img src={user.avatarUrl} alt={user.username} onError={() => setAvatarFailed(true)} />
                          ) : initials}
                          <span className="nav-user-dd-avatar-dot" />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="nav-user-dd-name" style={{ color: user.usernameColor || '#E74C3C' }}>
                            {user.username}
                          </div>
                          <div className="nav-user-dd-sub">
                            <span className="nav-user-dd-level">Lv.{user.level}</span>
                            {user.isPremium && <span className="nav-user-dd-premium"><Icon icon="ri:vip-crown-fill" /> Premium</span>}
                          </div>
                        </div>
                      </div>

                      {/* Balances */}
                      <div className="nav-user-dd-stats">
                        <Link href="/store" className="nav-user-dd-stat" onClick={() => setUserOpen(false)}>
                          <span className="nav-user-dd-stat-label"><Icon icon="ri:coin-fill" style={{ color: '#FCD34D' }} /> Tickets</span>
                          <span className="nav-user-dd-stat-val">{user.credits}</span>
                        </Link>
                        <Link href="/wallet" className="nav-user-dd-stat" onClick={() => setUserOpen(false)}>
                          <span className="nav-user-dd-stat-label"><Icon icon="ri:wallet-3-fill" style={{ color: '#4ade80' }} /> Balance</span>
                          <span className="nav-user-dd-stat-val" style={{ color: '#4ade80' }}>{cashDisplay}</span>
                        </Link>
                      </div>

                      <div className="nav-user-dd-section">
                        <Link href={`/profile/${user.slug}`} className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:user-3-fill" className="nav-user-dd-item-icon" /> My Profile
                        </Link>
                        <Link href="/dashboard" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:dashboard-3-fill" className="nav-user-dd-item-icon" /> Dashboard
                        </Link>
                        <Link href="/teams" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:team-fill" className="nav-user-dd-item-icon" /> My Teams
                        </Link>
                        <Link href="/mailbox" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:mail-fill" className="nav-user-dd-item-icon" /> Mailbox
                          {unreadCount > 0 && <span className="nav-user-dd-badge">{unreadCount}</span>}
                        </Link>
                      </div>

                      <div className="nav-user-dd-divider" />

                      <div className="nav-user-dd-section">
                        <Link href="/health" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:shield-check-fill" className="nav-user-dd-item-icon" /> Account Health
                        </Link>
                        <Link href="/settings" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                          <Icon icon="ri:settings-3-fill" className="nav-user-dd-item-icon" /> Settings
                        </Link>
                        {user.isCoach && (
                          <Link href="/coaching/dashboard" className="nav-user-dd-item" onClick={() => setUserOpen(false)}>
                            <Icon icon="ri:graduation-cap-fill" className="nav-user-dd-item-icon" /> Coach Dashboard
                          </Link>
                        )}
                        {(user as any).role === 'admin' && (
                          <a href={process.env.NEXT_PUBLIC_BACKEND_URL + '/admin'} className="nav-user-dd-item admin" onClick={() => setUserOpen(false)}>
                            <Icon icon="ri:shield-star-fill" className="nav-user-dd-item-icon" /> Admin Dashboard
                          </a>
                        )}
                      </div>

                      {!user.isPremium && (
                        <>
                          <div className="nav-user-dd-divider" />
                          <Link href="/premium" className="nav-user-dd-item premium" onClick={() => setUserOpen(false)}>
                            <Icon icon="ri:vip-crown-2-fill" className="nav-user-dd-item-icon" /> Upgrade to Premium
                          </Link>
                        </>
                      )}

                      <div className="nav-user-dd-divider" />
                      <button className="nav-user-dd-item danger" onClick={handleSignOut}>
                        <Icon icon="ri:logout-box-r-line" className="nav-user-dd-item-icon" /> Sign Out
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
