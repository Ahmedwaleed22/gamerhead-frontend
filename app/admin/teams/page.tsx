'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

interface TeamRow {
  _id: string
  name: string
  slug: string
  emoji: string
  game: string
  gameSlug: string
  captainId: string
  roster: any[]
  wins: number
  losses: number
  cashEarned: number
  ladderRank: number
  isDisbanded: boolean
  createdAt: string
}

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [disbanded, setDisbanded] = useState('')
  const [detailModal, setDetailModal] = useState<any>(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', emoji: '', avatarUrl: '', bannerUrl: '', game: '', gameSlug: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.q = search
      if (disbanded) params.isDisbanded = disbanded
      const res = await adminApi.getTeams(params)
      setTeams(res.teams)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Teams] load error:', err) }
    setLoading(false)
  }, [page, search, disbanded])

  useEffect(() => { load() }, [load])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const viewDetail = async (id: string) => {
    try {
      const res = await adminApi.getTeam(id)
      setDetailModal(res)
    } catch { }
  }

  const handleDisband = async (id: string) => {
    try {
      await adminApi.disbandTeam(id)
      setDetailModal(null)
      load()
    } catch { }
  }

  const openEditModal = () => {
    if (!detailModal) return
    setEditForm({
      name: detailModal.name || '',
      emoji: detailModal.emoji || '',
      avatarUrl: detailModal.avatarUrl || '',
      bannerUrl: detailModal.bannerUrl || '',
      game: detailModal.game || '',
      gameSlug: detailModal.gameSlug || '',
    })
    setEditModal(true)
  }

  const handleEditTeam = async () => {
    if (!detailModal) return
    try {
      await adminApi.updateTeam(detailModal._id, editForm)
      setEditModal(false)
      viewDetail(detailModal._id)
      load()
    } catch { }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      await adminApi.removeTeamMember(teamId, memberId)
      viewDetail(teamId) // Refresh detail
      load()
    } catch { }
  }

  const columns: Column<TeamRow>[] = [
    { key: 'name', label: 'Team', width: '2fr',
      render: (row) => (
        <span style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => viewDetail(row._id)}>
          {row.emoji} {row.name}
        </span>
      ),
    },
    { key: 'game', label: 'Game', width: '100px' },
    { key: 'members', label: 'Members', width: '70px',
      render: (row) => row.roster?.length || 0,
    },
    { key: 'record', label: 'Record', width: '80px',
      render: (row) => `${row.wins || 0}W - ${row.losses || 0}L`,
    },
    { key: 'cashEarned', label: 'Earned', width: '80px',
      render: (row) => `$${((row.cashEarned || 0) / 100).toFixed(2)}`,
    },
    { key: 'ladderRank', label: 'Rank', width: '60px',
      render: (row) => row.ladderRank || '—',
    },
    { key: 'status', label: 'Status', width: '80px',
      render: (row) => (
        <span style={{ fontSize: 9, fontWeight: 700, color: row.isDisbanded ? '#e8000d' : '#22c55e' }}>
          {row.isDisbanded ? 'DISBANDED' : 'ACTIVE'}
        </span>
      ),
    },
    { key: 'actions', label: 'Actions', width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="VIEW" color="#3b82f6" onClick={() => viewDetail(row._id)} />
          {!row.isDisbanded && <ActionBtn label="DISBAND" color="#e8000d" onClick={() => handleDisband(row._id)} />}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Teams
        </h1>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          {total.toLocaleString()} teams total
        </p>
      </div>

      <SearchFilter
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search by team name..."
        filters={[
          {
            value: disbanded, onChange: v => { setDisbanded(v); setPage(1) }, placeholder: 'All Status',
            options: [{ value: 'false', label: 'Active' }, { value: 'true', label: 'Disbanded' }],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading teams...</div>
      ) : (
        <DataTable columns={columns} rows={teams} emptyText="No teams found" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal title={`${detailModal.emoji || '🛡️'} ${detailModal.name}`} subtitle={`${detailModal.game} · ${detailModal.wins || 0}W ${detailModal.losses || 0}L`} onClose={() => setDetailModal(null)} width={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 10, fontFamily: 'Rajdhani, sans-serif' }}>
              {[
                ['Cash Earned', `$${((detailModal.cashEarned || 0) / 100).toFixed(2)}`],
                ['Ladder Rank', detailModal.ladderRank || 'Unranked'],
                ['XP', detailModal.xp || 0],
              ].map(([k, v]) => (
                <div key={k as string} style={{ background: '#0d0d14', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#4F5568', fontWeight: 700, fontSize: 8, textTransform: 'uppercase', letterSpacing: .5 }}>{k}</div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: 'Barlow Condensed, sans-serif' }}>{String(v)}</div>
                </div>
              ))}
            </div>

            {/* Roster */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>
                Roster ({detailModal.roster?.length || 0})
              </div>
              {(detailModal.roster || []).map((member: any) => (
                <div key={member.userId?.toString() || member.username} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11, fontFamily: 'Rajdhani, sans-serif',
                }}>
                  <span style={{ fontWeight: 700, color: member.color || '#DDE0EA', flex: 1 }}>
                    {member.userInfo?.username || member.username || 'Unknown'}
                  </span>
                  <span style={{ fontSize: 9, color: '#4F5568', fontWeight: 700 }}>{member.role}</span>
                  <ActionBtn label="REMOVE" color="#e8000d" onClick={() => handleRemoveMember(detailModal._id, (member.userId || member.user)?.toString())} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionBtn label="EDIT TEAM" color="#f59e0b" onClick={openEditModal} />
              {!detailModal.isDisbanded && (
                <ActionBtn label="DISBAND TEAM" color="#e8000d" onClick={() => handleDisband(detailModal._id)} />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {editModal && detailModal && (
        <Modal title="Edit Team" subtitle={detailModal.name} onClose={() => setEditModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>Team Name</div><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Emoji</div><input value={editForm.emoji} onChange={e => setEditForm(p => ({ ...p, emoji: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Profile Picture URL</div><input value={editForm.avatarUrl} onChange={e => setEditForm(p => ({ ...p, avatarUrl: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
            <div><div style={labelStyle}>Banner URL</div><input value={editForm.bannerUrl} onChange={e => setEditForm(p => ({ ...p, bannerUrl: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
            <div><div style={labelStyle}>Game</div><input value={editForm.game} onChange={e => setEditForm(p => ({ ...p, game: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Game Slug</div><input value={editForm.gameSlug} onChange={e => setEditForm(p => ({ ...p, gameSlug: e.target.value }))} style={inputStyle} /></div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEditTeam} />
          </div>
        </Modal>
      )}
    </div>
  )
}
