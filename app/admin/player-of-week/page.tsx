'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'

export default function AdminPotwPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [historyPages, setHistoryPages] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, hRes] = await Promise.all([
        adminApi.getPOTWCandidates(),
        adminApi.getPOTWHistory({ page: historyPage, limit: 10 }),
      ])
      setCandidates(cRes.data || cRes.candidates || cRes || [])
      const hData = hRes.data || hRes
      setHistory(hData.entries || hData.history || [])
      setHistoryPages(hData.pages || 1)
    } catch { }
    setLoading(false)
  }, [historyPage])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    try { await adminApi.deletePOTW(id); load() } catch { }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Player of the Week</h1>

      {/* Top Candidates */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
          Top Candidates This Week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {(Array.isArray(candidates) ? candidates : []).slice(0, 5).map((c: any, i: number) => (
            <div key={c._id} style={{
              background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 14, textAlign: 'center',
              borderColor: i === 0 ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.06)',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', background: '#1a1a2e', margin: '0 auto 8px',
                backgroundImage: c.avatarUrl ? `url(${c.avatarUrl})` : 'none', backgroundSize: 'cover',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#4F5568',
              }}>
                {!c.avatarUrl && c.username?.[0]?.toUpperCase()}
              </div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif' }}>{c.username}</div>
              <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginTop: 2 }}>
                {c.wins}W · Streak: {c.winStreak} · Lvl {c.level}
              </div>
              {i === 0 && <div style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', marginTop: 4 }}>TOP CANDIDATE</div>}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
          History
        </div>
        {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
          <DataTable
            columns={[
              { key: 'weekKey', label: 'Week', width: '100px' },
              { key: 'username', label: 'Player', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.username}</span> },
              { key: 'game', label: 'Game', width: '100px', render: (r: any) => r.game || '—' },
              { key: 'weeklyWins', label: 'Wins', width: '60px' },
              { key: 'weeklyLosses', label: 'Losses', width: '60px' },
              { key: 'weeklyWinStreak', label: 'Streak', width: '60px' },
              { key: 'isManualPick', label: 'Type', width: '70px', render: (r: any) => <span style={{ fontSize: 9, color: r.isManualPick ? '#a855f7' : '#22c55e', fontWeight: 700 }}>{r.isManualPick ? 'MANUAL' : 'AUTO'}</span> },
              { key: 'actions', label: '', width: '60px', render: (r: any) => <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} /> },
            ]}
            rows={history}
            emptyText="No history"
            page={historyPage} totalPages={historyPages} onPage={setHistoryPage}
          />
        )}
      </div>
    </div>
  )
}
