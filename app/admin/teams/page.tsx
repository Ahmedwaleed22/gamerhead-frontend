'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [disbanded, setDisbanded] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [games, setGames] = useState<any[]>([])
  const [detailModal, setDetailModal] = useState<any>(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', avatarUrl: '', bannerUrl: '', bio: '', twitchUrl: '', twitterUrl: '', youtubeUrl: '', discordUrl: '' })

  // Transfer leader
  const [transferModal, setTransferModal] = useState(false)
  const [transferUserId, setTransferUserId] = useState('')
  const [transferring, setTransferring] = useState(false)

  // Load games for filter dropdown
  useEffect(() => {
    adminApi.getGames({ limit: 50 }).then((res: any) => setGames(res.games || [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.q = search
      if (disbanded) params.isDisbanded = disbanded
      if (gameFilter) params.game = gameFilter
      if (typeFilter) params.type = typeFilter
      if (tournamentFilter) params.hasTournament = tournamentFilter
      const res = await adminApi.getTeams(params)
      setTeams(res.teams)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Teams] load error:', err) }
    setLoading(false)
  }, [page, search, disbanded, gameFilter, typeFilter, tournamentFilter])

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
    if (!confirm('Disband this team?')) return
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
      avatarUrl: detailModal.avatarUrl || detailModal.logoUrl || '',
      bannerUrl: detailModal.bannerUrl || '',
      bio: detailModal.bio || '',
      twitchUrl: detailModal.twitchUrl || '',
      twitterUrl: detailModal.twitterUrl || '',
      youtubeUrl: detailModal.youtubeUrl || '',
      discordUrl: detailModal.discordUrl || '',
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
      viewDetail(teamId)
      load()
    } catch { }
  }

  const handleTransferLeader = async () => {
    if (!detailModal || !transferUserId.trim()) return
    setTransferring(true)
    try {
      await adminApi.transferCaptain(detailModal._id, transferUserId.trim())
      setTransferModal(false)
      setTransferUserId('')
      viewDetail(detailModal._id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Transfer failed')
    }
    setTransferring(false)
  }

  const columns: Column[] = [
    { key: '_id', label: 'Team ID', width: '100px',
      render: (row: any) => <span style={{ fontSize: 10, color: '#8890A4' }}>{row._id?.slice(-8)}</span>,
    },
    { key: 'name', label: 'Team', width: '1.5fr',
      render: (row: any) => (
        <span style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => viewDetail(row._id)}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.shield} width={14} height={14} style={{ display: 'block' }} /> {row.name}</span>
        </span>
      ),
    },
    { key: 'game', label: 'Game', width: '100px' },
    { key: 'matchType', label: 'Type', width: '65px',
      render: (row: any) => (
        <span style={{ fontSize: 10, fontWeight: 700, color: row.matchType === 'cash' ? '#22c55e' : '#3b82f6', textTransform: 'uppercase' }}>
          {row.matchType || 'xp'}
        </span>
      ),
    },
    { key: 'tournament', label: 'Tournament', width: '100px',
      render: (row: any) => row.tournamentName
        ? <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{row.tournamentName}</span>
        : <span style={{ color: '#4F5568' }}>—</span>,
    },
    { key: 'members', label: 'Members', width: '70px',
      render: (row: any) => row.roster?.length || 0,
    },
    { key: 'record', label: 'Record', width: '80px',
      render: (row: any) => `${row.wins || 0}W - ${row.losses || 0}L`,
    },
    { key: 'status', label: 'Status', width: '75px',
      render: (row: any) => (
        <span style={{ fontSize: 10, fontWeight: 700, color: row.isDisbanded ? '#e8000d' : '#22c55e' }}>
          {row.isDisbanded ? 'DISBANDED' : 'ACTIVE'}
        </span>
      ),
    },
    { key: 'actions', label: 'Actions', width: '120px',
      render: (row: any) => (
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
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Teams
        </h1>
        <p style={{ fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          {total.toLocaleString()} teams total
        </p>
      </div>

      <SearchFilter
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search by team name or ID..."
        filters={[
          {
            value: gameFilter, onChange: v => { setGameFilter(v); setPage(1) }, placeholder: 'All Games',
            options: games.map((g: any) => ({ value: g.slug, label: g.name })),
          },
          {
            value: typeFilter, onChange: v => { setTypeFilter(v); setPage(1) }, placeholder: 'All Types',
            options: [{ value: 'cash', label: 'Cash' }, { value: 'xp', label: 'XP' }],
          },
          {
            value: disbanded, onChange: v => { setDisbanded(v); setPage(1) }, placeholder: 'All Status',
            options: [{ value: 'false', label: 'Active' }, { value: 'true', label: 'Disbanded' }],
          },
          {
            value: tournamentFilter, onChange: v => { setTournamentFilter(v); setPage(1) }, placeholder: 'All Teams',
            options: [{ value: 'true', label: 'In Tournament' }, { value: 'false', label: 'No Tournament' }],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading teams...</div>
      ) : (
        <DataTable columns={columns} rows={teams} emptyText="No teams found" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Detail Modal */}
      {detailModal && !editModal && !transferModal && (
        <Modal title={detailModal.name} subtitle={`${detailModal.game} · ${detailModal.matchType === 'cash' ? 'Cash' : 'XP'} · ${detailModal.wins || 0}W ${detailModal.losses || 0}L`} onClose={() => setDetailModal(null)} width={520}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Team ID */}
            <div style={{ fontSize: 11, color: '#4F5568' }}>
              Team ID: <span style={{ color: '#8890A4' }}>{detailModal._id?.slice(-8)}</span>
              {detailModal.tournamentName && (
                <span style={{ marginLeft: 12, fontWeight: 700, color: '#f59e0b' }}>Tournament: {detailModal.tournamentName}</span>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 10 }}>
              {[
                ['Cash Earned', `$${((detailModal.cashEarned || 0) / 100).toFixed(2)}`],
                ['Ladder Rank', detailModal.ladderRank || 'Unranked'],
                ['XP', detailModal.xp || 0],
              ].map(([k, v]) => (
                <div key={k as string} style={{ background: '#0d0d14', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                  <div style={{ color: '#4F5568', fontWeight: 700, fontSize: 8, textTransform: 'uppercase', letterSpacing: .5 }}>{k}</div>
                  <div style={{ color: '#fff', fontWeight: 900, fontSize: 16, }}>{String(v)}</div>
                </div>
              ))}
            </div>

            {/* Roster */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>
                Roster ({detailModal.roster?.length || 0})
              </div>
              {(detailModal.roster || []).map((member: any) => (
                <div key={member.userId?.toString() || member.username} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0',
                  borderBottom: '1px solid rgba(255,255,255,.04)', fontSize: 11,
                }}>
                  <span style={{ fontWeight: 700, color: member.color || '#DDE0EA', flex: 1 }}>
                    {member.userInfo?.username || member.username || 'Unknown'}
                  </span>
                  <span style={{ fontSize: 10, color: '#4F5568', }}>{(member.userId || member.user)?.toString()?.slice(-8)}</span>
                  <span style={{ fontSize: 9, color: member.role === 'Leader' ? '#f59e0b' : '#4F5568', fontWeight: 700 }}>{member.role}</span>
                  <ActionBtn label="REMOVE" color="#e8000d" onClick={() => handleRemoveMember(detailModal._id, (member.userId || member.user)?.toString())} />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ActionBtn label="EDIT TEAM" color="#f59e0b" size="md" onClick={openEditModal} />
              <ActionBtn label="TRANSFER LEADER" color="#a855f7" size="md" onClick={() => { setTransferModal(true); setTransferUserId('') }} />
              {!detailModal.isDisbanded && (
                <ActionBtn label="DISBAND TEAM" color="#e8000d" size="md" onClick={() => handleDisband(detailModal._id)} />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Team Modal */}
      {editModal && detailModal && (
        <Modal title="Edit Team" subtitle={`${detailModal.name} · ${detailModal.game} (locked)`} onClose={() => setEditModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><div style={labelStyle}>Team Name</div><input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Team Bio</div><textarea value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Team bio..." /></div>
            <div><div style={labelStyle}>Profile Picture URL</div><input value={editForm.avatarUrl} onChange={e => setEditForm(p => ({ ...p, avatarUrl: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
            {editForm.avatarUrl && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img src={editForm.avatarUrl} alt="Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,.1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <div><div style={labelStyle}>Banner URL</div><input value={editForm.bannerUrl} onChange={e => setEditForm(p => ({ ...p, bannerUrl: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
            {editForm.bannerUrl && (
              <div style={{ borderRadius: 6, overflow: 'hidden', maxHeight: 80 }}>
                <img src={editForm.bannerUrl} alt="Banner preview" style={{ width: '100%', height: 80, objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
            )}
            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 10, marginTop: 4 }}>
              <div style={{ ...labelStyle, marginBottom: 6 }}>Socials</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><input value={editForm.twitchUrl} onChange={e => setEditForm(p => ({ ...p, twitchUrl: e.target.value }))} style={inputStyle} placeholder="Twitch URL" /></div>
                <div><input value={editForm.twitterUrl} onChange={e => setEditForm(p => ({ ...p, twitterUrl: e.target.value }))} style={inputStyle} placeholder="Twitter / X URL" /></div>
                <div><input value={editForm.youtubeUrl} onChange={e => setEditForm(p => ({ ...p, youtubeUrl: e.target.value }))} style={inputStyle} placeholder="YouTube URL" /></div>
                <div><input value={editForm.discordUrl} onChange={e => setEditForm(p => ({ ...p, discordUrl: e.target.value }))} style={inputStyle} placeholder="Discord URL" /></div>
              </div>
            </div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" size="md" onClick={handleEditTeam} />
          </div>
        </Modal>
      )}

      {/* Transfer Leader Modal */}
      {transferModal && detailModal && (
        <Modal title="Transfer Leader" subtitle={detailModal.name} onClose={() => setTransferModal(false)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: '#8890A4', margin: 0 }}>
              Enter the User ID of the new leader. They must be a member of this team.
            </p>
            <div>
              <div style={labelStyle}>User ID</div>
              <input
                value={transferUserId}
                onChange={e => setTransferUserId(e.target.value)}
                style={inputStyle}
                placeholder="Paste user ID..."
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <ActionBtn label="CANCEL" color="#4F5568" size="md" onClick={() => setTransferModal(false)} />
              <ActionBtn label={transferring ? 'TRANSFERRING...' : 'TRANSFER'} color="#a855f7" size="md" onClick={handleTransferLeader} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
