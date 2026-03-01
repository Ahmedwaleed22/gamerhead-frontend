'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import StatCard from './components/StatCard'
import Link from 'next/link'

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

const QUICK_ACTIONS = [
  { label: 'Resolve Disputes', href: '/admin/matches?status=disputed', icon: '⚔️', color: '#e8000d' },
  { label: 'Review Tickets', href: '/admin/support?status=open', icon: '🎫', color: '#3b82f6' },
  { label: 'Send Announcement', href: '/admin/announcements', icon: '📢', color: '#f59e0b' },
  { label: 'Set Player of Week', href: '/admin/player-of-week', icon: '🏅', color: '#a855f7' },
  { label: 'View Withdrawals', href: '/admin/wallet?tab=withdrawals', icon: '💰', color: '#22c55e' },
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
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#4F5568', padding: 40 }}>
        Loading dashboard...
      </div>
    )
  }

  if (!stats) {
    return (
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, color: '#e8000d', padding: 40 }}>
        Failed to load dashboard stats.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <h1 style={{
          fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28,
          color: '#fff', margin: 0, textTransform: 'uppercase',
        }}>
          Dashboard
        </h1>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          Platform overview and quick actions
        </p>
      </div>

      {/* Row 1: Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon="👥" label="Total Users" value={stats.totalUsers.toLocaleString()} />
        <StatCard icon="🟢" label="Active (24h)" value={stats.activeUsers24h.toLocaleString()} color="#22c55e" />
        <StatCard icon="⚡" label="Live Matches" value={stats.liveMatches} color="#3b82f6" />
        <StatCard icon="⚠️" label="Open Disputes" value={stats.disputedMatches} color={stats.disputedMatches > 0 ? '#e8000d' : '#22c55e'} />
        <StatCard icon="🎫" label="Open Tickets" value={stats.openTickets} color={stats.openTickets > 0 ? '#f59e0b' : '#22c55e'} />
        <StatCard icon="💵" label="Revenue (30d)" value={`$${(stats.revenue30d / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color="#22c55e" />
        <StatCard icon="⏳" label="Pending Withdrawals" value={stats.pendingWithdrawals} color={stats.pendingWithdrawals > 0 ? '#f59e0b' : '#4F5568'} />
        <StatCard icon="🚫" label="Banned Users" value={stats.bannedUsers} color={stats.bannedUsers > 0 ? '#e8000d' : '#4F5568'} />
      </div>

      {/* Row 2: Activity + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14 }}>
        {/* Recent Activity */}
        <div style={{
          background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10,
          padding: '16px 18px', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
            color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 12,
          }}>
            Recent Activity
          </div>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 340, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {stats.recentActivity.length === 0 ? (
              <div style={{ fontSize: 12, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textAlign: 'center', padding: 24 }}>
                No recent activity
              </div>
            ) : stats.recentActivity.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 6, background: 'rgba(255,255,255,.02)',
              }}>
                <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>
                  {item.type === 'new_user' ? '🆕' : item.type === 'admin_action' ? '🔧' : '📋'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    color: '#DDE0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {item.action}
                    {item.username && <span style={{ color: '#8890A4' }}> — {item.username}</span>}
                    {item.admin && <span style={{ color: '#4F5568' }}> by {item.admin}</span>}
                  </div>
                  <div style={{ fontSize: 9, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568' }}>
                    {item.targetType}/{item.targetId}
                  </div>
                </div>
                <div style={{ fontSize: 9, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', whiteSpace: 'nowrap' }}>
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
            fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
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
                  <span style={{ fontSize: 18 }}>{qa.icon}</span>
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13,
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard icon="🛡️" label="Active Teams" value={stats.totalTeams} />
        <StatCard icon="🎯" label="Total Matches" value={stats.totalMatches.toLocaleString()} />
        <StatCard icon="📋" label="Claimed Tickets" value={stats.claimedTickets} sub="Being handled" />
        <StatCard icon="🆕" label="New Today" value={stats.newUsersToday} sub="User registrations" color="#3b82f6" />
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
