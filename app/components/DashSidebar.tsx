'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

const STATIC_NAV = [
  {
    key: 'dashboard', href: '/dashboard', label: 'Dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/></svg>,
  },
  {
    key: 'account', href: '/settings', label: 'Account Settings',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" fill="currentColor"/><path d="M2 14c0-3 2.5-4.5 6-4.5S14 11 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    key: 'profile', href: '/profile', label: 'My Profile', dynamic: true,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.8" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M2 14c0-3 2.5-4.5 6-4.5S14 11 14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    key: 'teams', href: '/teams', label: 'My Teams',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="5" r="2.5" fill="currentColor"/><circle cx="11" cy="5" r="2.5" fill="currentColor" opacity="0.4"/><path d="M1 13.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M10.5 10.3c.5-.2 1-.3 1.5-.3 2 0 3 1 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.4"/></svg>,
  },
  {
    key: 'invites', href: '/invites', label: 'Invites', badge: true, div: true,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3.5" width="14" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M1 6.5L8 10L15 6.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
  },
  {
    key: 'wallet', href: '/wallet', label: 'Wallet & Payouts',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M1 7h14" stroke="currentColor" strokeWidth="1.4"/><circle cx="12" cy="10.5" r="1.2" fill="currentColor"/></svg>,
  },
  {
    key: 'store', href: '/store', label: 'Buy Credits',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
  {
    key: 'orders', href: '/orders', label: 'My Orders', div: true,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M5 5.5h6M5 8h6M5 10.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  },
  {
    key: 'support', href: '/support', label: 'Support',
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M6 6.5c0-1.1.9-2 2-2s2 .9 2 2c0 1.5-2 1.8-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><circle cx="8" cy="11.8" r=".8" fill="currentColor"/></svg>,
  },
  {
    key: 'logout', href: '/', label: 'Logout', isLogout: true,
    icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6.5 2.5H3a1 1 0 00-1 1v9a1 1 0 001 1h3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5"/><path d="M10.5 5L14 8l-3.5 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
  },
]

interface DashSidebarProps {
  active:       string
  inviteCount?: number
}

export default function DashSidebar({ active, inviteCount = 0 }: DashSidebarProps) {
  const { user, logout } = useAuth()

  const initials    = user?.username?.slice(0, 2).toUpperCase() || '??'
  const accentColor = user?.usernameColor || '#E74C3C'
  const credits     = user?.credits ?? 0
  const cash        = ((user?.cashBalance ?? 0) / 100).toFixed(2)

  const NAV = STATIC_NAV.map(item =>
    item.dynamic && user?.slug ? { ...item, href: `/profile/${user.slug}` } : item
  )

  return (
    <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 20 }}>
      {/* User row */}
      <div style={{ padding: '16px 16px 14px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 40, height: 40, flexShrink: 0, borderRadius: 8,
          background: accentColor + '22', border: `1.5px solid ${accentColor}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, color: accentColor,
          overflow: 'hidden',
        }}>
          {user?.avatarUrl
            ? <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ ...R, fontWeight: 700, fontSize: 13, color: accentColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username || '...'}
          </div>
          <div style={{ ...R, fontSize: 10, color: '#9CA3AF', marginTop: 3 }}>
            🪙 {credits} · ${cash}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 0 8px' }}>
        {NAV.map(item => {
          const isActive = item.key === active

          const inner = (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 16px', position: 'relative',
              background: isActive ? '#202023' : 'transparent',
              cursor: 'pointer',
            }}>
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: '#B22D2D', borderRadius: '0 2px 2px 0' }} />
              )}
              <span style={{ color: isActive ? '#B22D2D' : 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0, lineHeight: 1 }}>
                {item.icon}
              </span>
              <span style={{ ...R, fontWeight: 600, fontSize: 12, color: isActive ? '#fff' : '#B0B0BC', flex: 1 }}>
                {item.label}
              </span>
              {item.badge && inviteCount > 0 && (
                <span style={{ background: '#B22D2D', borderRadius: 5, padding: '1px 6px', ...R, fontWeight: 700, fontSize: 10, color: '#fff' }}>
                  {inviteCount}
                </span>
              )}
            </div>
          )

          return (
            <div key={item.key}>
              {(item as any).isLogout ? (
                <div onClick={logout}>{inner}</div>
              ) : (
                <Link href={item.href} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link>
              )}
              {item.div && <div style={{ height: 1, background: '#25252C', margin: '5px 14px' }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}