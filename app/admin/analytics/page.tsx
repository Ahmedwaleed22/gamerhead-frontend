'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'
import DataTable, { Column } from '../components/DataTable'

type Period = '7d' | '30d' | '90d'

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [analytics, setAnalytics] = useState<any>(null)
  const [topEarners, setTopEarners] = useState<any[]>([])
  const [topGames, setTopGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, eRes, gRes] = await Promise.all([
        adminApi.getAnalytics({ period }),
        adminApi.getTopEarners(),
        adminApi.getTopGames(),
      ])
      setAnalytics(aRes.data || aRes)
      setTopEarners(eRes.data || eRes.earners || eRes || [])
      setTopGames(gRes.data || gRes.games || gRes || [])
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [period])

  if (loading) return <div style={{ fontSize: 14, color: '#4F5568', padding: 40 }}>Loading analytics...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7d', '30d', '90d'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '5px 12px', fontSize: 10, fontWeight: 700,
              background: period === p ? 'rgba(232,0,13,.15)' : 'transparent',
              border: `1px solid ${period === p ? 'rgba(232,0,13,.3)' : 'rgba(255,255,255,.06)'}`,
              borderRadius: 4, color: period === p ? '#e8000d' : '#4F5568', cursor: 'pointer',
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      {analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <StatCard icon={Solar.bill} label={`Revenue (${period})`} value={`$${((analytics.revenue || 0) / 100).toFixed(2)}`} color="#22c55e" />
          <StatCard icon={Solar.users} label={`New Users (${period})`} value={analytics.newUsers} color="#3b82f6" />
          <StatCard icon={Solar.sword} label={`Matches (${period})`} value={analytics.matchesPlayed} />
          <StatCard icon={Solar.diploma} label={`Coaching Orders (${period})`} value={analytics.coachingOrders} color="#a855f7" />
        </div>
      )}

      {/* Rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
        {/* Top Earners */}
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
            Top 10 Earners
          </div>
          {(Array.isArray(topEarners) ? topEarners : []).map((u: any, i: number) => (
            <div key={u._id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,.03)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? '#f59e0b' : '#4F5568', width: 20 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DDE0EA', flex: 1 }}>{u.displayName || u.username}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>${((u.lifetimeEarnings || 0) / 100).toFixed(2)}</span>
            </div>
          ))}
          {(!Array.isArray(topEarners) || topEarners.length === 0) && <div style={{ fontSize: 10, color: '#4F5568', textAlign: 'center', padding: 12 }}>No data</div>}
        </div>

        {/* Top Games */}
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
            Top Games by Matches
          </div>
          {(Array.isArray(topGames) ? topGames : []).map((g: any, i: number) => (
            <div key={g._id} style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,.03)',
            }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: i < 3 ? '#3b82f6' : '#4F5568', width: 20 }}>#{i + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DDE0EA', flex: 1 }}>{g._id}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#8890A4' }}>{g.count} matches</span>
            </div>
          ))}
          {(!Array.isArray(topGames) || topGames.length === 0) && <div style={{ fontSize: 10, color: '#4F5568', textAlign: 'center', padding: 12 }}>No data</div>}
        </div>
      </div>
    </div>
  )
}
