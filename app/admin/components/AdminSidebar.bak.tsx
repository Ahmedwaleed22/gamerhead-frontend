'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

const SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { key: '/admin', label: 'Dashboard' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { key: '/admin/users',        label: 'Users & Accounts' },
      { key: '/admin/matches',      label: 'Matches & Disputes' },
      { key: '/admin/teams',        label: 'Teams' },
      { key: '/admin/coaching',     label: 'Coaching' },
      { key: '/admin/tournaments',  label: 'Tournaments' },
    ],
  },
  {
    label: 'SUPPORT',
    items: [
      { key: '/admin/live-chat', label: 'Live Chat', badge: true },
      { key: '/admin/support',   label: 'Ticket Center' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { key: '/admin/games',         label: 'Games' },
      { key: '/admin/ladders',       label: 'Ladders' },
      { key: '/admin/badges',        label: 'Badges' },
      { key: '/admin/forum',         label: 'Forum' },
    ],
  },
  {
    label: 'STORE & FINANCE',
    items: [
      { key: '/admin/store',   label: 'Store & Products' },
      { key: '/admin/premium', label: 'Premium Members' },
      { key: '/admin/wallet',  label: 'Wallet & Txns' },
    ],
  },
  {
    label: 'FEATURED',
    items: [
      { key: '/admin/player-of-week', label: 'Player of the Week' },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [
      { key: '/admin/analytics', label: 'Analytics' },
      { key: '/admin/audit-log', label: 'Audit Log' },
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
    <div 
      className="flex flex-col md:fixed md:top-0 md:left-0 md:h-screen md:w-[240px] z-[100] bg-[#0d0d14] border-r border-white/5 overflow-y-auto w-full shrink-0"
    >
      {/* Header */}
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontWeight: 900, fontSize: 18, color: '#fff',
          }}>
            ADMIN
          </div>
          <span style={{
            padding: '2px 8px', fontSize: 11, fontWeight: 800,
            background: 'rgba(232,0,13,.15)', border: '1px solid rgba(232,0,13,.3)', borderRadius: 3,
            color: '#e8000d', letterSpacing: .5, textTransform: 'uppercase',
          }}>
            PANEL
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#4F5568', marginTop: 4 }}>
          {user?.username || '...'}
        </div>
      </div>

      {/* Nav sections */}
      <div style={{ flex: 1, padding: '8px 0' }}>
        {SECTIONS.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '10px 18px 4px', fontSize: 12, fontWeight: 800,
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
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '8px 18px', position: 'relative',
                      background: active ? 'rgba(232,0,13,.08)' : 'transparent',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.03)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {active && (
                      <div style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', background: '#e8000d', borderRadius: '0 2px 2px 0' }} />
                    )}
                    <span style={{
                      fontWeight: 700, fontSize: 13,
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
          fontSize: 13, fontWeight: 700, color: '#4F5568',
          transition: 'color .15s',
        }}>
          <span style={{ fontSize: 16 }}>←</span>
          Back to Site
        </Link>
      </div>
    </div>
  )
}
