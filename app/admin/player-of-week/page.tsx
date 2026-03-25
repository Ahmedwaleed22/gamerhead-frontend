'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

export default function AdminPotwPage() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [weekKey, setWeekKey] = useState('')
  const [lastWinnerUserId, setLastWinnerUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [historyPages, setHistoryPages] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [skipped, setSkipped] = useState<Set<string>>(new Set())

  // Review modal
  const [reviewUserId, setReviewUserId] = useState<string | null>(null)
  const [reviewUsername, setReviewUsername] = useState('')
  const [reviewMatches, setReviewMatches] = useState<any[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)

  // Select confirm
  const [selectUserId, setSelectUserId] = useState<string | null>(null)
  const [selectUsername, setSelectUsername] = useState('')
  const [selecting, setSelecting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cRes, hRes] = await Promise.all([
        adminApi.getPOTWCandidates(),
        adminApi.getPOTWHistory({ page: historyPage, limit: 10 }),
      ])
      const cData = cRes.data || cRes
      setCandidates(cData.candidates || [])
      setWeekKey(cData.weekKey || '')
      setLastWinnerUserId(cData.lastWinnerUserId || null)
      const hData = hRes.data || hRes
      setHistory(hData.entries || [])
      setHistoryPages(hData.pages || 1)
    } catch { }
    setLoading(false)
  }, [historyPage])

  useEffect(() => { load() }, [load])

  const handleReview = async (userId: string, username: string) => {
    setReviewUserId(userId)
    setReviewUsername(username)
    setReviewLoading(true)
    try {
      const res = await adminApi.getPOTWCandidateMatches(userId)
      setReviewMatches(res.data || res || [])
    } catch { setReviewMatches([]) }
    setReviewLoading(false)
  }

  const handleSkip = (userId: string) => {
    setSkipped(prev => new Set(prev).add(userId))
  }

  const handleSelect = async () => {
    if (!selectUserId) return
    setSelecting(true)
    try {
      await adminApi.selectPOTW(selectUserId)
      setSelectUserId(null)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to select POTW')
    }
    setSelecting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this POTW entry?')) return
    try { await adminApi.deletePOTW(id); load() } catch { }
  }

  // Filter out skipped candidates
  const visibleCandidates = candidates.filter((c: any) => !skipped.has(c.userId))

  const candidateColumns: Column[] = [
    { key: 'rank', label: '#', width: '40px',
      render: (r: any) => <span style={{ fontWeight: 800, color: r.rank === 1 ? '#f59e0b' : r.rank === 2 ? '#94a3b8' : r.rank === 3 ? '#cd7f32' : '#4F5568' }}>{r.rank}</span>,
    },
    { key: 'username', label: 'Player', width: '1fr',
      render: (r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#1a1a2e', flexShrink: 0,
            backgroundImage: r.avatarUrl ? `url(${r.avatarUrl})` : 'none', backgroundSize: 'cover',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#4F5568',
          }}>
            {!r.avatarUrl && (r.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#DDE0EA' }}>{r.username}</div>
            {r.teamName && <div style={{ fontSize: 10, color: '#4F5568' }}>{r.teamName}</div>}
          </div>
          {r.isLastWeekWinner && (
            <span style={{ fontSize: 9, fontWeight: 800, color: '#e8000d', background: 'rgba(232,0,13,.12)', padding: '2px 6px', borderRadius: 3 }}>
              LAST WEEK
            </span>
          )}
        </div>
      ),
    },
    { key: 'weeklyWins', label: 'Wins', width: '70px',
      render: (r: any) => <span style={{ fontWeight: 800, color: '#22c55e' }}>{r.weeklyWins}</span>,
    },
    { key: 'weeklyLosses', label: 'Losses', width: '70px',
      render: (r: any) => <span style={{ color: '#e8000d' }}>{r.weeklyLosses}</span>,
    },
    { key: 'level', label: 'Level', width: '60px',
      render: (r: any) => <span style={{ color: '#8890A4' }}>{r.level}</span>,
    },
    { key: 'actions', label: 'Actions', width: '200px',
      render: (r: any) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn label="REVIEW" color="#3b82f6" onClick={() => handleReview(r.userId, r.username)} />
          {!r.isLastWeekWinner && (
            <ActionBtn label="SELECT" color="#22c55e" onClick={() => { setSelectUserId(r.userId); setSelectUsername(r.username) }} />
          )}
          <ActionBtn label="SKIP" color="#4F5568" onClick={() => handleSkip(r.userId)} />
        </div>
      ),
    },
  ]

  const historyColumns: Column[] = [
    { key: 'weekKey', label: 'Week', width: '90px' },
    { key: 'username', label: 'Player', width: '1fr',
      render: (r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: '#1a1a2e', flexShrink: 0,
            backgroundImage: r.avatarUrl ? `url(${r.avatarUrl})` : 'none', backgroundSize: 'cover',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#4F5568',
          }}>
            {!r.avatarUrl && (r.username?.[0] || '?').toUpperCase()}
          </div>
          <span style={{ fontWeight: 700, color: '#DDE0EA' }}>{r.username}</span>
        </div>
      ),
    },
    { key: 'weeklyWins', label: 'Wins', width: '60px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#22c55e' }}>{r.weeklyWins}</span>,
    },
    { key: 'weeklyLosses', label: 'Losses', width: '60px' },
    { key: 'premiumGranted', label: 'Premium', width: '80px',
      render: (r: any) => <span style={{ fontSize: 11, fontWeight: 700, color: r.premiumGranted ? '#22c55e' : '#4F5568' }}>{r.premiumGranted ? 'GRANTED' : '—'}</span>,
    },
    { key: 'badgeGranted', label: 'Badge', width: '70px',
      render: (r: any) => <span style={{ fontSize: 11, fontWeight: 700, color: r.badgeGranted ? '#22c55e' : '#4F5568' }}>{r.badgeGranted ? 'AWARDED' : '—'}</span>,
    },
    { key: 'isManualPick', label: 'Type', width: '70px',
      render: (r: any) => <span style={{ fontSize: 11, color: r.isManualPick ? '#a855f7' : '#22c55e', fontWeight: 700 }}>{r.isManualPick ? 'MANUAL' : 'AUTO'}</span>,
    },
    { key: 'actions', label: '', width: '70px',
      render: (r: any) => <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Player of the Week
        </h1>
        {weekKey && (
          <p style={{ fontSize: 13, color: '#4F5568', margin: '4px 0 0' }}>
            Week: {weekKey} &middot; {visibleCandidates.length} candidates
          </p>
        )}
      </div>

      {/* Candidates Table */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
          This Week&apos;s Candidates
        </div>
        {loading ? (
          <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : visibleCandidates.length === 0 ? (
          <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center', background: '#13131E', borderRadius: 10, border: '1px solid rgba(255,255,255,.06)' }}>
            No candidates found this week. Matches must be completed to generate candidates.
          </div>
        ) : (
          <DataTable columns={candidateColumns} rows={visibleCandidates} emptyText="No candidates" />
        )}
      </div>

      {/* History */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
          History
        </div>
        <DataTable
          columns={historyColumns}
          rows={history}
          emptyText="No history yet"
          page={historyPage} totalPages={historyPages} onPage={setHistoryPage}
        />
      </div>

      {/* Review Modal */}
      {reviewUserId && (
        <Modal title={`Match Review — ${reviewUsername}`} onClose={() => setReviewUserId(null)}>
          {reviewLoading ? (
            <div style={{ fontSize: 13, color: '#4F5568', padding: 20, textAlign: 'center' }}>Loading matches...</div>
          ) : reviewMatches.length === 0 ? (
            <div style={{ fontSize: 13, color: '#4F5568', padding: 20, textAlign: 'center' }}>No completed matches this week.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {reviewMatches.map((m: any) => (
                <div key={m._id} style={{
                  display: 'grid', gridTemplateColumns: '80px 1fr 70px 60px 110px', alignItems: 'center', gap: 16,
                  padding: '10px 14px', background: 'rgba(255,255,255,.02)', borderRadius: 6, border: '1px solid rgba(255,255,255,.04)',
                }}>
                  <span style={{ fontSize: 11, color: '#8890A4' }}>{m.matchId}</span>
                  <span style={{ fontSize: 12, color: '#DDE0EA', fontWeight: 600 }}>
                    {m.teamAName} vs {m.teamBName}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#DDE0EA', textAlign: 'center' }}>
                    {m.scoreA} - {m.scoreB}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, textAlign: 'center', padding: '2px 6px', borderRadius: 3,
                    color: m.isWin ? '#22c55e' : '#e8000d',
                    background: m.isWin ? 'rgba(34,197,94,.1)' : 'rgba(232,0,13,.1)',
                  }}>
                    {m.isWin ? 'WIN' : 'LOSS'}
                  </span>
                  <span style={{ fontSize: 10, color: '#4F5568', textAlign: 'right' }}>
                    {m.completedAt ? new Date(m.completedAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Select Confirmation Modal */}
      {selectUserId && (
        <Modal title="Confirm Selection" onClose={() => setSelectUserId(null)}>
          <div style={{ fontSize: 14, color: '#DDE0EA', lineHeight: 1.6 }}>
            <p style={{ margin: '0 0 12px' }}>
              Select <strong style={{ color: '#f59e0b' }}>{selectUsername}</strong> as Player of the Week?
            </p>
            <p style={{ margin: '0 0 16px', color: '#8890A4', fontSize: 12 }}>
              This will award them 7 days of Premium and the &quot;Player of the Week&quot; badge. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
              <ActionBtn label="CANCEL" color="#4F5568" size="md" onClick={() => setSelectUserId(null)} />
              <ActionBtn label={selecting ? 'SELECTING...' : 'CONFIRM'} color="#22c55e" size="md" onClick={handleSelect} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
