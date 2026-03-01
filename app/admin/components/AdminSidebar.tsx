'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { key: '/admin', label: 'Dashboard', icon: '📊' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { key: '/admin/users',    label: 'Users & Accounts',   icon: '👥' },
      { key: '/admin/matches',  label: 'Matches & Disputes', icon: '⚔️' },
      { key: '/admin/teams',    label: 'Teams',              icon: '🛡️' },
      { key: '/admin/coaching',     label: 'Coaching',           icon: '🎓' },
      { key: '/admin/tournaments', label: 'Tournaments',        icon: '🏟️' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { key: '/admin/live-chat', label: 'Live Chat',      icon: '💬', badge: true },
      { key: '/admin/support',   label: 'Ticket Center',  icon: '🎫' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { key: '/admin/games',         label: 'Games',         icon: '🎮' },
      { key: '/admin/ladders',       label: 'Ladders',       icon: '🏆' },
      { key: '/admin/badges',        label: 'Badges',        icon: '🏅' },
      { key: '/admin/forum',         label: 'Forum',         icon: '💬' },
      { key: '/admin/announcements', label: 'Announcements', icon: '📢' },
    ],
  },
  {
    label: 'STORE & FINANCE',
    items: [
      { key: '/admin/store',   label: 'Store & Products', icon: '🛒' },
      { key: '/admin/premium', label: 'Premium Plans',    icon: '⭐' },
      { key: '/admin/wallet',  label: 'Wallet & Txns',    icon: '💰' },
    ],
  },
  {
    label: 'FEATURED',
    items: [
      { key: '/admin/player-of-week', label: 'Player of the Week', icon: '🏅' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { key: '/admin/analytics', label: 'Analytics',  icon: '📈' },
      { key: '/admin/audit-log', label: 'Audit Log',  icon: '📋' },
    ],
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (key: string) => {
    if (key === '/admin') return pathname === '/admin'
    return pathname.startsWith(key)
  }

  return (
    <div style={{
      width: 240, minHeight: '100vh', background: '#0d0d14', borderRight: '1px solid rgba(255,255,255,.06)',
      position: 'fixed', top: 0, left: 0, overflowY: 'auto', zIndex: 100,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 18, color: '#fff',
          }}>
            ADMIN
          </div>
          <span style={{
            padding: '2px 6px', fontSize: 8, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
            background: 'rgba(232,0,13,.15)', border: '1px solid rgba(232,0,13,.3)', borderRadius: 3,
            color: '#e8000d', letterSpacing: .5, textTransform: 'uppercase',
          }}>
            PANEL
          </span>
        </div>
        <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginTop: 4 }}>
          {user?.username || '...'}
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '8px 18px 4px', fontSize: 8, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
              color: '#3a3a4a', letterSpacing: 1.2, textTransform: 'uppercase',
            }}>
              {section.label}
            </div>
            {section.items.map(item => {
              const active = isActive(item.key)
              return (
                <Link key={item.key} href={item.key} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '7px 18px', position: 'relative',
                      background: active ? 'rgba(232,0,13,.08)' : 'transparent',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: '#e8000d', borderRadius: '0 2px 2px 0' }} />
                    )}
                    <span style={{ fontSize: 14, lineHeight: 1, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span style={{
                      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12,
                      color: active ? '#fff' : '#8890A4', flex: 1,
                    }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none',
          fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: '#4F5568',
          transition: 'color .15s',
        }}>
          <span style={{ fontSize: 14 }}>←</span>
          Back to Site
        </Link>
      </div>
    </div>
  )
}
