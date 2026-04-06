'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import StatCard from './components/StatCard'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

interface DashboardStats {
  totalUsers: number
  newUsersToday: number
  activeUsers24h: number
  bannedUsers: number
  totalMatches: number
  liveMatches: number
  disputedMatches: number
  openTickets: number
  claimedTickets: number
  totalTeams: number
  pendingWithdrawals: number
  revenue30d: number
  recentActivity: {
    type: string
    action: string
    admin: string
    targetType: string
    targetId: string
    username?: string
    timestamp: string
  }[]
}

const ACTION_LABELS: Record<string, string> = {
  claim_live_chat:        'Claimed Live Chat',
  close_live_chat:        'Closed Live Chat',
  create_tournament:      'Created Tournament',
  cancel_tournament:      'Cancelled Tournament',
  start_tournament:       'Started Tournament',
  complete_tournament:    'Completed Tournament',
  ban_user:               'Banned User',
  unban_user:             'Unbanned User',
  close_ticket:           'Closed Ticket',
  open_ticket:            'Opened Ticket',
  resolve_dispute:        'Resolved Dispute',
  cancel_match:           'Cancelled Match',
  complete_match:         'Completed Match',
  edit_match:             'Edited Match',
  create_match:           'Created Match',
  award_badge:            'Awarded Badge',
  update_user:            'Updated User',
  create_announcement:    'Posted Announcement',
  set_player_of_week:     'Set Player of Week',
  approve_withdrawal:     'Approved Withdrawal',
  reject_withdrawal:      'Rejected Withdrawal',
  new_user:               'New User Registered',
  admin_action:           'Admin Action',
  user_registered:        'New User Registered',
  match_disputed:         'Match Disputed',
}

function formatAction(raw: string): string {
  if (!raw) return '—'
  if (ACTION_LABELS[raw]) return ACTION_LABELS[raw]
  // Convert snake_case to Title Case as fallback
  return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const QUICK_ACTIONS = [
  { label: 'Resolve Disputes', href: '/admin/matches?status=disputed', icon: Solar.sword, color: '#e8000d' },
  { label: 'Review Tickets', href: '/admin/support?status=open', icon: Solar.ticket, color: '#3b82f6' },
  { label: 'Send Announcement', href: '/admin/announcements', icon: Solar.megaphone, color: '#f59e0b' },
  { label: 'Set Player of Week', href: '/admin/player-of-week', icon: Solar.medal, color: '#a855f7' },
  { label: 'View Withdrawals', href: '/admin/wallet?tab=withdrawals', icon: Solar.coin, color: '#22c55e' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStats().then(res => {
      setStats(res)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ fontSize: 14, color: '#4F5568', padding: 40 }}>
        Loading dashboard...
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ fontSize: 14, color: '#e8000d', padding: 40 }}>
        Failed to load dashboard stats.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <h1 style={{
          fontWeight: 900, fontSize: 28,
          color: '#fff', margin: 0, textTransform: 'uppercase',
        }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          Platform overview and quick actions
        </p>
      </div>

      {/* Row 1: Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={Solar.users} label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatCard icon={Solar.live} label="Active (24h)" value={stats.activeUsers24h.toLocaleString()} color="#22c55e" />
        <StatCard icon={Solar.bolt} label="Live Matches" value={stats.liveMatches} color="#3b82f6" />
        <StatCard icon={Solar.warning} label="Open Disputes" value={stats.disputedMatches} color={stats.disputedMatches > 0 ? '#e8000d' : '#22c55e'} />
        <StatCard icon={Solar.ticket} label="Open Tickets" value={stats.openTickets} color={stats.openTickets > 0 ? '#f59e0b' : '#22c55e'} />
        <StatCard icon={Solar.bill} label="Revenue (30d)" value={`$${(stats.revenue30d / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#22c55e" />
        <StatCard icon={Solar.hourglass} label="Pending Withdrawals" value={stats.pendingWithdrawals} color={stats.pendingWithdrawals > 0 ? '#f59e0b' : '#4F5568'} />
        <StatCard icon={Solar.forbidden} label="Banned Users" value={stats.bannedUsers} color={stats.bannedUsers > 0 ? '#e8000d' : '#4F5568'} />
      </div>

      {/* Row 2: Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 14 }}>
        {/* Recent Activity */}
        <div style={{
          background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10,
          padding: '16px 18px', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800,
            color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12,
          }}>
            Recent Activity
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 340, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.recentActivity.length === 0 ? (
              <div style={{ fontSize: 12, color: '#4F5568', textAlign: 'center', padding: 24 }}>
                No recent activity
              </div>
            ) : stats.recentActivity.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '8px 10px',
                borderRadius: 6, background: 'rgba(255,255,255,.02)',
              }}>
                <span style={{ width: 22, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                  <Icon icon={item.type === 'new_user' ? Solar.sparkles : item.type === 'admin_action' ? Solar.tools : Solar.clipboard} width={16} height={16} />
                </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#DDE0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {formatAction(item.action)}
                    {item.username && <span style={{ color: '#8890A4' }}> — {item.username}</span>}
                    {item.admin && <span style={{ color: '#4F5568', fontWeight: 400 }}> by {item.admin}</span>}
                  </div>
                  {item.targetType && item.targetId && (
                    <div style={{ fontSize: 9, color: '#4F5568' }}>
                      {item.targetType} #{item.targetId.slice(-8)}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: '#4F5568', whiteSpace: 'nowrap' }}>
                  {formatTimeAgo(item.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10,
          padding: '16px 18px', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800,
            color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12,
          }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_ACTIONS.map(qa => (
              <Link key={qa.label} href={qa.href} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 8,
                    background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.04)',
                    transition: 'background .15s, border-color .15s', cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.06)'
                    e.currentTarget.style.borderColor = `${qa.color}44`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,.04)'
                  }}
                >
                  <Icon icon={qa.icon} width={20} height={20} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: '#DDE0EA',
                  }}>
                    {qa.label}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 12, color: '#4F5568',
                  }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Mini Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard icon={Solar.shield} label="Active Teams" value={stats.totalTeams} />
        <StatCard icon={Solar.target} label="Total Matches" value={stats.totalMatches.toLocaleString()} />
        <StatCard icon={Solar.clipboard} label="Claimed Tickets" value={stats.claimedTickets} sub="Being handled" />
        <StatCard icon={Solar.sparkles} label="New Today" value={stats.newUsersToday} sub="User registrations" color="#3b82f6" />
      </div>
    </div>
  )
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
