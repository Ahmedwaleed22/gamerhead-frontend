'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, gamesApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'
import { EmojiSolar } from '@/lib/solar-duotone'

const STATUS_COLORS: Record<string, string> = {
  draft: '#4F5568', open: '#3b82f6', checkin: '#f59e0b', live: '#22c55e', completed: '#8890A4', cancelled: '#e8000d',
}

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

const DEFAULT_PRIZES = [
  { place: '1st Place', amount: 0, color: '#F0C040', creditsBonus: 0, note: '' },
  { place: '2nd Place', amount: 0, color: '#C0C0C0', creditsBonus: 0, note: '' },
  { place: '3rd Place', amount: 0, color: '#CD7F32', creditsBonus: 0, note: '' },
]

function autoSplitPrizes(total: number) {
  const first = Math.round(total * 0.5)
  const second = Math.round(total * 0.3)
  const third = total - first - second
  return [
    { ...DEFAULT_PRIZES[0], amount: first },
    { ...DEFAULT_PRIZES[1], amount: second },
    { ...DEFAULT_PRIZES[2], amount: third },
  ]
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState<any>(null)
  const [games, setGames] = useState<any[]>([])
  const [form, setForm] = useState({
    name: '', game: '', gamemode: '', bracketType: 'Single Elimination', entryType: 'team',
    format: 'Squads (4v4)', series: 'Best of 3', maxTeams: '64', entryCredits: '0',
    prizePool: '0', prizePoolType: 'cash', prizePoolLabel: '',
    startDate: '', startTime: '', region: 'North America', platform: 'Cross-Play',
    bannerUrl: '', accentColor: '#1A5C9E', isFeatured: false,
  })
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES)
  const [selectedGame, setSelectedGame] = useState<any>(null)

  // Load games list on mount
  useEffect(() => {
    gamesApi.getAll().then(setGames).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getTournaments(params)
      setTournaments(res.tournaments)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Tournaments] load error:', err) }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  // When game is selected from dropdown
  const handleGameSelect = (gameName: string) => {
    const game = games.find((g: any) => g.name === gameName)
    setSelectedGame(game || null)
    setForm(p => ({
      ...p,
      game: gameName,
      gamemode: '',
      accentColor: game?.accentColor || '#1A5C9E',
      bannerUrl: game?.bannerUrl || '',
    }))
  }

  // When prize pool total changes, auto-split
  const handlePrizePoolChange = (value: string) => {
    setForm(p => ({ ...p, prizePool: value }))
    const num = Number(value)
    if (num > 0) {
      setPrizes(autoSplitPrizes(num))
    }
  }

  const handleCreate = async () => {
    try {
      await adminApi.createTournament({
        ...form,
        maxTeams: Number(form.maxTeams),
        entryCredits: Number(form.entryCredits),
        prizePool: Number(form.prizePool),
        prizes,
        gameEmoji: selectedGame?.bannerUrl || '🎯',
      })
      setCreateModal(false)
      setForm({
        name: '', game: '', gamemode: '', bracketType: 'Single Elimination', entryType: 'team',
        format: 'Squads (4v4)', series: 'Best of 3', maxTeams: '64', entryCredits: '0',
        prizePool: '0', prizePoolType: 'cash', prizePoolLabel: '',
        startDate: '', startTime: '', region: 'North America', platform: 'Cross-Play',
        bannerUrl: '', accentColor: '#1A5C9E', isFeatured: false,
      })
      setPrizes(DEFAULT_PRIZES)
      setSelectedGame(null)
      load()
    } catch { }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try { await adminApi.updateTournament(id, { status }); load() } catch { }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try { await adminApi.updateTournament(id, { isFeatured: !current }); load() } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteTournament(id); load() } catch { }
  }

  const handleViewDetail = async (id: string) => {
    try { const res = await adminApi.getTournament(id); setDetailModal(res) } catch { }
  }

  const columns: Column[] = [
    { key: 'name', label: 'Name', width: '2fr', render: (r: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        {r.bannerUrl || r.gameEmoji?.startsWith('/') ? (
          <img src={r.bannerUrl || r.gameEmoji} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover' }} />
        ) : (
          <EmojiSolar emoji={r.gameEmoji || '🎯'} size={18} inline={false} />
        )}
        <span
          style={{
            fontWeight: 700,
            cursor: 'pointer',
            color: '#DDE0EA',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minWidth: 0,
            flex: '1 1 auto',
          }}
          onClick={() => handleViewDetail(r._id)}
        >
          {r.name}
        </span>
        {r.isFeatured && <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700, marginLeft: 6 }}>FEATURED</span>}
      </div>
    )},
    { key: 'game', label: 'Game', width: '100px', render: (r: any) => <span style={{ color: '#4F5568', wordBreak: 'break-word' }}>{r.game}</span> },
    { key: 'bracketType', label: 'Bracket', width: '100px', render: (r: any) => <span style={{ fontSize: 9, color: '#8890A4' }}>{r.bracketType === 'Single Elimination' ? 'Single Elim' : 'Double Elim'}</span> },
    { key: 'registeredCount', label: 'Teams', width: '80px', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.registeredCount}/{r.maxTeams}</span> },
    { key: 'prizePool', label: 'Prize Pool', width: '80px', render: (r: any) => <span style={{ fontWeight: 700, color: '#22c55e' }}>${((r.prizePool || 0) / 100).toFixed(0)}</span> },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[r.status] || '#4F5568', textTransform: 'uppercase' }}>{r.status}</span> },
    { key: 'startDate', label: 'Start', width: '90px', render: (r: any) => <span style={{ color: '#4F5568', fontSize: 10 }}>{r.startDate || '—'}</span> },
    { key: 'actions', label: '', width: '140px', render: (r: any) => (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <ActionBtn label="VIEW" color="#3b82f6" onClick={() => handleViewDetail(r._id)} />
        <ActionBtn label={r.isFeatured ? 'UNFEAT' : 'FEAT'} color="#f59e0b" onClick={() => handleToggleFeatured(r._id, r.isFeatured)} />
        {r.status === 'draft' && <ActionBtn label="OPEN" color="#22c55e" onClick={() => handleUpdateStatus(r._id, 'open')} />}
        {r.status === 'open' && <ActionBtn label="CANCEL" color="#e8000d" onClick={() => handleUpdateStatus(r._id, 'cancelled')} />}
        {['draft', 'cancelled', 'completed'].includes(r.status) && <ActionBtn label="DEL" color="#e8000d" onClick={() => handleDelete(r._id)} />}
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 auto', minWidth: 200 }}>
          <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Tournaments</h1>
          <p style={{ fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
            {total} total tournaments
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <ActionBtn label="+ CREATE TOURNAMENT" color="#22c55e" onClick={() => setCreateModal(true)} />
        </div>
      </div>

      <SearchFilter
        filters={[
          {
            value: statusFilter, onChange: v => { setStatusFilter(v); setPage(1) }, placeholder: 'All Status',
            options: [
              { value: 'draft', label: 'Draft' }, { value: 'open', label: 'Open' }, { value: 'checkin', label: 'Check-In' },
              { value: 'live', label: 'Live' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
            ],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={tournaments} emptyText="No tournaments" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal title={detailModal.name} onClose={() => setDetailModal(null)} width={600}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11, color: '#DDE0EA' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div><span style={{ color: '#4F5568' }}>Game:</span> {detailModal.game}</div>
              <div><span style={{ color: '#4F5568' }}>Status:</span> <span style={{ color: STATUS_COLORS[detailModal.status], fontWeight: 700, textTransform: 'uppercase' }}>{detailModal.status}</span></div>
              <div><span style={{ color: '#4F5568' }}>Bracket:</span> {detailModal.bracketType}</div>
              <div><span style={{ color: '#4F5568' }}>Format:</span> {detailModal.format}</div>
              <div><span style={{ color: '#4F5568' }}>Series:</span> {detailModal.series}</div>
              <div><span style={{ color: '#4F5568' }}>Gamemode:</span> {detailModal.gamemode || '—'}</div>
              <div><span style={{ color: '#4F5568' }}>Teams:</span> {detailModal.registeredCount}/{detailModal.maxTeams}</div>
              <div><span style={{ color: '#4F5568' }}>Prize Pool:</span> <span style={{ color: '#22c55e', fontWeight: 700 }}>${((detailModal.prizePool || 0) / 100).toFixed(2)}</span></div>
              <div><span style={{ color: '#4F5568' }}>Entry Fee:</span> {detailModal.entryCredits} tickets</div>
              <div><span style={{ color: '#4F5568' }}>Region:</span> {detailModal.region}</div>
              <div><span style={{ color: '#4F5568' }}>Platform:</span> {detailModal.platform}</div>
              <div><span style={{ color: '#4F5568' }}>Start:</span> {detailModal.startDate} {detailModal.startTime}</div>
            </div>

            {/* Prizes */}
            {detailModal.prizes?.length > 0 && (
              <div>
                <div style={labelStyle}>Prizes</div>
                {detailModal.prizes.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ color: p.color || '#DDE0EA', fontWeight: 700 }}>{p.place}</span>
                    <span style={{ color: '#22c55e' }}>${(p.amount / 100).toFixed(2)}{p.creditsBonus ? ` + ${p.creditsBonus}cr` : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Registered Entries */}
            {detailModal.registeredEntries?.length > 0 && (
              <div>
                <div style={labelStyle}>Registered ({detailModal.registeredEntries.length})</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {detailModal.registeredEntries.map((e: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize: 10, color: '#4F5568', width: 20 }}>#{e.seed || i + 1}</span>
                      <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}><EmojiSolar emoji={e.emoji || '🎮'} size={14} inline={false} /> {e.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, color: e.checkedIn ? '#22c55e' : '#4F5568' }}>{e.checkedIn ? 'CHECKED IN' : 'NOT CHECKED'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {detailModal.rules?.length > 0 && (
              <div>
                <div style={labelStyle}>Rules</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#8890A4', fontSize: 10 }}>
                  {detailModal.rules.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {createModal && (
        <Modal title="Create Tournament" onClose={() => setCreateModal(false)} width={540}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Name */}
            <div>
              <div style={labelStyle}>Name</div>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="Tournament name..." />
            </div>

            {/* Game Dropdown + Preview */}
            <div>
              <div style={labelStyle}>Game</div>
              <select value={form.game} onChange={e => handleGameSelect(e.target.value)} style={inputStyle}>
                <option value="">Select a game...</option>
                {games.map((g: any) => (
                  <option key={g.slug} value={g.name}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Game Image Preview */}
            {selectedGame && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'rgba(255,255,255,.03)', borderRadius: 8, border: '1px solid rgba(255,255,255,.06)' }}>
                <img
                  src={selectedGame.bannerUrl}
                  alt={selectedGame.name}
                  style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', border: `2px solid ${selectedGame.accentColor}` }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA' }}>{selectedGame.name}</div>
                  <div style={{ fontSize: 9, color: '#4F5568' }}>
                    {selectedGame.platforms?.join(' / ')} &mdash; {selectedGame.modes?.length || 0} modes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: selectedGame.accentColor }} />
                    <span style={{ fontSize: 9, color: '#4F5568' }}>{selectedGame.accentColor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gamemode (from selected game) */}
            {selectedGame && selectedGame.modes?.length > 0 && (
              <div>
                <div style={labelStyle}>Gamemode</div>
                <select value={form.gamemode} onChange={e => setForm(p => ({ ...p, gamemode: e.target.value }))} style={inputStyle}>
                  <option value="">Select a gamemode...</option>
                  {selectedGame.modes.map((m: string) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Format & Series */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <div style={labelStyle}>Format</div>
                <select value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value }))} style={inputStyle}>
                  <option value="Solo (1v1)">Solo (1v1)</option>
                  <option value="Duos (2v2)">Duos (2v2)</option>
                  <option value="Trios (3v3)">Trios (3v3)</option>
                  <option value="Squads (4v4)">Squads (4v4)</option>
                </select>
              </div>
              <div>
                <div style={labelStyle}>Series</div>
                <select value={form.series} onChange={e => setForm(p => ({ ...p, series: e.target.value }))} style={inputStyle}>
                  <option value="Best of 1">Best of 1</option>
                  <option value="Best of 3">Best of 3</option>
                  <option value="Best of 5">Best of 5</option>
                </select>
              </div>
            </div>

            {/* Max Teams & Entry Tickets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <div style={labelStyle}>Max Teams</div>
                <input value={form.maxTeams} onChange={e => setForm(p => ({ ...p, maxTeams: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Entry Tickets</div>
                <input value={form.entryCredits} onChange={e => setForm(p => ({ ...p, entryCredits: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* Prize Pool Type + Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div>
                <div style={labelStyle}>Prize Type</div>
                <select value={form.prizePoolType} onChange={e => setForm(p => ({ ...p, prizePoolType: e.target.value }))} style={inputStyle}>
                  <option value="cash">Cash</option>
                  <option value="credits">Tickets</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <div style={labelStyle}>
                  {form.prizePoolType === 'cash' ? 'Prize Pool (cents)' : form.prizePoolType === 'credits' ? 'Prize Pool (tickets)' : 'Prize Pool Total'}
                </div>
                <input value={form.prizePool} onChange={e => handlePrizePoolChange(e.target.value)} style={inputStyle} placeholder="e.g. 10000" />
              </div>
            </div>

            {/* Other label */}
            {form.prizePoolType === 'other' && (
              <div>
                <div style={labelStyle}>Prize Description</div>
                <input value={form.prizePoolLabel} onChange={e => setForm(p => ({ ...p, prizePoolLabel: e.target.value }))} style={inputStyle} placeholder="e.g. Gaming Chair + $500 Cash" />
              </div>
            )}

            {/* Auto-split Prize Preview */}
            {Number(form.prizePool) > 0 && (
              <div style={{ background: 'rgba(255,255,255,.02)', borderRadius: 6, padding: '8px 12px', border: '1px solid rgba(255,255,255,.05)' }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>Prize Split (auto)</div>
                {prizes.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 11 }}>
                    <span style={{ fontSize: 14 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <span style={{ color: p.color, fontWeight: 700, width: 60 }}>{p.place}</span>
                    <input
                      value={p.amount}
                      onChange={e => {
                        const updated = [...prizes]
                        updated[i] = { ...updated[i], amount: Number(e.target.value) || 0 }
                        setPrizes(updated)
                      }}
                      style={{ ...inputStyle, width: 80, textAlign: 'center' }}
                    />
                    <span style={{ color: '#4F5568', fontSize: 9 }}>
                      {form.prizePoolType === 'cash' ? `($${(p.amount / 100).toFixed(2)})` : form.prizePoolType === 'credits' ? 'tk' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Start Date/Time */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <div style={labelStyle}>Start Date</div>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Start Time</div>
                <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} style={inputStyle} />
              </div>
            </div>

            {/* Bracket Type */}
            <div><div style={labelStyle}>Bracket Type</div>
              <select value={form.bracketType} onChange={e => setForm(p => ({ ...p, bracketType: e.target.value }))} style={inputStyle}>
                <option value="Single Elimination">Single Elimination</option>
                <option value="Double Elimination">Double Elimination</option>
              </select>
            </div>

            {/* Region & Platform */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div><div style={labelStyle}>Region</div>
                <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} style={inputStyle}>
                  <option value="North America">North America</option><option value="Europe">Europe</option><option value="Asia">Asia</option><option value="Global">Global</option>
                </select>
              </div>
              <div><div style={labelStyle}>Platform</div>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} style={inputStyle}>
                  <option value="Cross-Play">Cross-Play</option><option value="Console Only">Console Only (Xbox/PSN)</option><option value="PlayStation">PlayStation</option><option value="Xbox">Xbox</option><option value="PC">PC</option>
                </select>
              </div>
            </div>

            {/* Accent Color */}
            <div><div style={labelStyle}>Accent Color</div><input type="color" value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))} style={{ ...inputStyle, height: 36, padding: 2 }} /></div>

            {/* Featured */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} /> Featured Tournament
            </label>

            <ActionBtn label="CREATE TOURNAMENT" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
    </div>
  )
}
