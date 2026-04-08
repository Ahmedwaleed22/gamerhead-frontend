'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi, matchesApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminGamesPage() {
  const { toast } = useToast()
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', bannerUrl: '', accentColor: '#e8000d', platformType: 'crossplay' as 'crossplay' | 'console' | 'pc', genre: '', gameIdLabel: '', isActive: true, modes: '', modeMapMatrix: {} as Record<string, string[]>, rules: '', teamSizes: {} as Record<string, number[]> })
  const [migrateSlug, setMigrateSlug] = useState('')
  const [migrateName, setMigrateName] = useState('')
  const [migrateResult, setMigrateResult] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getGames({ limit: 50 }); setGames(res.games) } catch (err) { console.error('[Admin Games] load error:', err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const emptyForm = { name: '', slug: '', description: '', bannerUrl: '', accentColor: '#e8000d', platformType: 'crossplay' as 'crossplay' | 'console' | 'pc', genre: '', gameIdLabel: '', isActive: true, modes: '', modeMapMatrix: {} as Record<string, string[]>, rules: '', teamSizes: { Squad: [4] } as Record<string, number[]> }

  const platformMap: Record<string, { platforms: string[]; crossplay: boolean }> = {
    crossplay: { platforms: ['PC', 'Xbox', 'PS'], crossplay: true },
    console:   { platforms: ['Xbox', 'PS'],       crossplay: false },
    pc:        { platforms: ['PC'],               crossplay: false },
  }

  const buildPayload = () => {
    const { platformType, modes, ...rest } = form as any
    const pConfig = platformMap[platformType] || platformMap.crossplay
    return {
      ...rest,
      platforms: pConfig.platforms,
      crossplay: pConfig.crossplay,
      platformType,
      modes: Object.keys(form.modeMapMatrix),
      modeMapMatrix: form.modeMapMatrix,
      teamSizes: form.teamSizes,
      rules: form.rules.split('\n').map((s: string) => s.trim()).filter(Boolean),
    }
  }

  const handleCreate = async () => {
    try {
      await adminApi.createGame(buildPayload())
      setCreateModal(false)
      setForm(emptyForm)
      load()
    } catch { }
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updateGame(editModal._id, buildPayload())
      setEditModal(null)
      setForm(emptyForm)
      load()
    } catch { }
  }

  const DEFAULT_RULES = [
    'All matches must be played under fair conditions.',
    'Results must be submitted within 15 minutes with screenshot proof.',
    'Exploits or cheating result in an immediate ban.',
    'Disputes must be submitted through the support ticket system.',
  ]

  const openEditModal = (game: any) => {
    // Derive platformType from existing data
    const plats = (game.platforms || []).map((p: string) => p.toLowerCase())
    let platformType: 'crossplay' | 'console' | 'pc' = 'crossplay'
    if (game.platformType) platformType = game.platformType
    else if (plats.includes('pc') && (plats.includes('xbox') || plats.includes('ps'))) platformType = 'crossplay'
    else if (plats.includes('pc') && !plats.includes('xbox') && !plats.includes('ps')) platformType = 'pc'
    else if (!plats.includes('pc') && (plats.includes('xbox') || plats.includes('ps'))) platformType = 'console'

    const existingRules = game.rules || []

    setForm({
      name: game.name || '',
      slug: game.slug || '',
      description: game.description || '',
      bannerUrl: game.bannerUrl || '',
      accentColor: game.accentColor || '#e8000d',
      platformType,
      genre: game.genre || '',
      gameIdLabel: game.gameIdLabel || '',
      isActive: game.isActive ?? true,
      modes: (game.modes || []).join(', '),
      modeMapMatrix: game.modeMapMatrix && typeof game.modeMapMatrix === 'object' ? { ...game.modeMapMatrix } : {},
      rules: existingRules.length > 0 ? existingRules.join('\n') : DEFAULT_RULES.join('\n'),
      teamSizes: (() => {
        const raw = game.teamSizes && typeof game.teamSizes === 'object' ? game.teamSizes : { Squad: 4 }
        // Backwards compat: convert old number values to arrays
        const ts: Record<string, number[]> = {}
        for (const [k, v] of Object.entries(raw)) {
          ts[k] = Array.isArray(v) ? v as number[] : [v as number]
        }
        return ts
      })(),
    })
    setEditModal(game)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      if (isActive) await adminApi.disableGame(id)
      else await adminApi.updateGame(id, { isActive: true })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteGame(id); load() } catch { }
  }

  const formFields = (onSubmit: () => void, submitLabel: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[['Name', 'name'], ['Slug', 'slug'], ['Description', 'description'], ['Banner URL', 'bannerUrl']].map(([l, k]) => (
        <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
      ))}
      <div><div style={labelStyle}>Accent Color</div><input type="color" value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))} style={{ ...inputStyle, height: 32, padding: 2 }} /></div>
      <div><div style={labelStyle}>Genre</div>
        <select value={form.genre} onChange={e => setForm(p => ({ ...p, genre: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select genre...</option>
          {['FPS', 'Sports', 'Battle Royale', 'Fighting', 'Racing', 'MOBA', 'Strategy', 'Other'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div><div style={labelStyle}>Game ID Label</div>
        <select value={form.gameIdLabel} onChange={e => setForm(p => ({ ...p, gameIdLabel: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select gamertag type...</option>
          {[
            { value: 'activisionId', label: 'Activision ID' },
            { value: 'psnId',        label: 'PSN ID' },
            { value: 'xboxGamertag', label: 'Xbox Gamertag' },
            { value: 'riotId',       label: 'Riot ID' },
            { value: 'steamId',      label: 'Steam ID' },
            { value: 'epicId',       label: 'Epic ID' },
            { value: 'eaId',         label: 'EA ID' },
          ].map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div><div style={labelStyle}>Platform</div>
        <select value={form.platformType} onChange={e => setForm(p => ({ ...p, platformType: e.target.value as any }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="crossplay">Crossplay (PC / Xbox / PS)</option>
          <option value="console">Console Only (Xbox / PS)</option>
          <option value="pc">PC Only</option>
        </select>
      </div>

      {/* ── Team Sizes ── */}
      <div>
        <div style={labelStyle}>Team Sizes (Ladder Types)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {/* Solo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d14', border: '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '6px 10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
              <input type="checkbox" checked={'Solo' in form.teamSizes} onChange={e => {
                setForm(p => {
                  const ts = { ...p.teamSizes }
                  if (e.target.checked) ts.Solo = [1]
                  else delete ts.Solo
                  return { ...p, teamSizes: ts }
                })
              }} />
              <span style={{ fontWeight: 600, fontSize: 11, color: 'Solo' in form.teamSizes ? '#DDE0EA' : '#4F5568' }}>Solo (1v1)</span>
            </label>
          </div>
          {/* Duo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d14', border: '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '6px 10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
              <input type="checkbox" checked={'Duo' in form.teamSizes} onChange={e => {
                setForm(p => {
                  const ts = { ...p.teamSizes }
                  if (e.target.checked) ts.Duo = [2]
                  else delete ts.Duo
                  return { ...p, teamSizes: ts }
                })
              }} />
              <span style={{ fontWeight: 600, fontSize: 11, color: 'Duo' in form.teamSizes ? '#DDE0EA' : '#4F5568' }}>Duo (2v2)</span>
            </label>
          </div>
          {/* Squad — multi-select sizes */}
          <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,.06)', borderRadius: 6, padding: '6px 10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={'Squad' in form.teamSizes} onChange={e => {
                setForm(p => {
                  const ts = { ...p.teamSizes }
                  if (e.target.checked) ts.Squad = [4]
                  else delete ts.Squad
                  return { ...p, teamSizes: ts }
                })
              }} />
              <span style={{ fontWeight: 600, fontSize: 11, color: 'Squad' in form.teamSizes ? '#DDE0EA' : '#4F5568' }}>Squad</span>
            </label>
            {'Squad' in form.teamSizes && (
              <div style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 22 }}>
                {[3, 4, 5, 6].map(n => {
                  const squadSizes = form.teamSizes.Squad || []
                  const checked = squadSizes.includes(n)
                  return (
                    <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                      <input type="checkbox" checked={checked} onChange={e => {
                        setForm(p => {
                          const cur = [...(p.teamSizes.Squad || [])]
                          const next = e.target.checked ? [...cur, n].sort() : cur.filter(x => x !== n)
                          if (next.length === 0) {
                            const ts = { ...p.teamSizes }
                            delete ts.Squad
                            return { ...p, teamSizes: ts }
                          }
                          return { ...p, teamSizes: { ...p.teamSizes, Squad: next } }
                        })
                      }} />
                      <span style={{ fontWeight: 600, fontSize: 10, color: checked ? '#DDE0EA' : '#4F5568' }}>{n}v{n}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#4F5568', marginTop: 4 }}>Select which team sizes this game supports. Squad can have multiple valid sizes.</div>
      </div>

      {/* ── Mode-Map Builder ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={labelStyle}>Modes &amp; Maps</div>
          <button type="button" onClick={() => {
            const name = prompt('Mode name (e.g. Search & Destroy)')
            if (!name?.trim()) return
            setForm(p => ({ ...p, modeMapMatrix: { ...p.modeMapMatrix, [name.trim()]: [] } }))
          }} style={{ background: '#22c55e', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 700, color: '#fff', cursor: 'pointer', textTransform: 'uppercase' }}>+ Add Mode</button>
        </div>
        {Object.keys(form.modeMapMatrix).length === 0 && (
          <div style={{ fontSize: 10, color: '#4F5568', padding: '8px 0' }}>No modes added yet. Click &quot;+ Add Mode&quot; to get started.</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(form.modeMapMatrix).map(([mode, maps]) => (
            <div key={mode} style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,.06)', borderRadius: 8, padding: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{mode}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button type="button" onClick={() => {
                    const name = prompt('Rename mode:', mode)
                    if (!name?.trim() || name.trim() === mode) return
                    setForm(p => {
                      const m = { ...p.modeMapMatrix }
                      m[name.trim()] = m[mode]
                      delete m[mode]
                      return { ...p, modeMapMatrix: m }
                    })
                  }} style={{ background: '#3b82f6', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>RENAME</button>
                  <button type="button" onClick={() => {
                    setForm(p => {
                      const m = { ...p.modeMapMatrix }
                      delete m[mode]
                      return { ...p, modeMapMatrix: m }
                    })
                  }} style={{ background: '#e8000d', border: 'none', borderRadius: 3, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>REMOVE</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                {(maps || []).map((map, mi) => (
                  <span key={mi} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '3px 8px', fontSize: 10, color: '#DDE0EA' }}>
                    {map}
                    <button type="button" onClick={() => {
                      setForm(p => {
                        const m = { ...p.modeMapMatrix }
                        m[mode] = m[mode].filter((_: string, i: number) => i !== mi)
                        return { ...p, modeMapMatrix: m }
                      })
                    }} style={{ background: 'none', border: 'none', color: '#e8000d', fontSize: 11, cursor: 'pointer', padding: 0, lineHeight: 1, fontWeight: 700 }}>×</button>
                  </span>
                ))}
              </div>
              <button type="button" onClick={() => {
                const name = prompt(`Add map to "${mode}":`)
                if (!name?.trim()) return
                setForm(p => {
                  const m = { ...p.modeMapMatrix }
                  m[mode] = [...(m[mode] || []), name.trim()]
                  return { ...p, modeMapMatrix: m }
                })
              }} style={{ background: 'rgba(255,255,255,.05)', border: '1px dashed rgba(255,255,255,.12)', borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 600, color: '#9CA3AF', cursor: 'pointer', width: '100%' }}>+ Add Map</button>
            </div>
          ))}
        </div>
      </div>
      {/* ── Rules Builder ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={labelStyle}>Game / Tournament Rules</div>
          <button type="button" onClick={() => setForm(p => ({ ...p, rules: p.rules ? p.rules + '\n' : '\n' }))} style={{ background: '#22c55e', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 9, fontWeight: 700, color: '#fff', cursor: 'pointer', textTransform: 'uppercase' }}>+ Add Rule</button>
        </div>
        {(() => {
          const rulesArr = form.rules.split('\n').filter((_, i, a) => i < a.length || a[i] !== '')
          const parsed = form.rules ? form.rules.split('\n') : []
          if (parsed.length === 0) return (
            <div style={{ fontSize: 10, color: '#4F5568', padding: '8px 0' }}>No rules added yet.</div>
          )
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {parsed.map((rule, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: '#4F5568', flexShrink: 0, width: 18, textAlign: 'right' }}>{i + 1}.</span>
                  <input value={rule} onChange={e => {
                    const arr = form.rules.split('\n')
                    arr[i] = e.target.value
                    setForm(p => ({ ...p, rules: arr.join('\n') }))
                  }} style={{ ...inputStyle, flex: 1 }} placeholder="Enter rule..." />
                  <button type="button" onClick={() => {
                    const arr = form.rules.split('\n')
                    if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setForm(p => ({ ...p, rules: arr.join('\n') })) }
                  }} style={{ background: 'none', border: 'none', color: i > 0 ? '#9CA3AF' : '#25252C', fontSize: 13, cursor: i > 0 ? 'pointer' : 'default', padding: '0 2px', lineHeight: 1 }}>▲</button>
                  <button type="button" onClick={() => {
                    const arr = form.rules.split('\n')
                    if (i < arr.length - 1) { [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setForm(p => ({ ...p, rules: arr.join('\n') })) }
                  }} style={{ background: 'none', border: 'none', color: i < parsed.length - 1 ? '#9CA3AF' : '#25252C', fontSize: 13, cursor: i < parsed.length - 1 ? 'pointer' : 'default', padding: '0 2px', lineHeight: 1 }}>▼</button>
                  <button type="button" onClick={() => {
                    const arr = form.rules.split('\n')
                    arr.splice(i, 1)
                    setForm(p => ({ ...p, rules: arr.join('\n') }))
                  }} style={{ background: 'none', border: 'none', color: '#e8000d', fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1, fontWeight: 700 }}>×</button>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
      <ActionBtn label={submitLabel} color="#22c55e" onClick={onSubmit} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Games</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn label="RECALC RANKS" color="#f59e0b" onClick={async () => { try { const r = await matchesApi.recalculateRanks(); toast(`Recalculated ${r.processed} entries`, 'success') } catch { toast('Failed to recalculate ranks', 'error') } }} />
          <ActionBtn label="+ ADD GAME" color="#22c55e" onClick={() => setCreateModal(true)} />
        </div>
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {games.map((game: any) => (
            <div key={game._id} style={{
              background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden',
              opacity: game.isActive ? 1 : 0.6,
            }}>
              {game.bannerUrl && <div style={{ height: 80, backgroundImage: `url(${game.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              <div style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>{game.name}</span>
                  {!game.isActive && <span style={{ fontSize: 8, fontWeight: 700, color: '#e8000d' }}>DISABLED</span>}
                </div>
                <div style={{ fontSize: 9, color: '#4F5568', marginBottom: 8 }}>
                  {game.platformType === 'pc' ? 'PC Only' : game.platformType === 'console' ? 'Console Only' : game.crossplay ? 'Crossplay' : (game.platforms || []).join(', ')} · {game.genre}
                </div>
                <div style={{ fontSize: 9, color: '#8890A4', marginBottom: 8 }}>
                  Modes: {game.modes?.join(', ') || '—'}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(game)} />
                  <ActionBtn label={game.isActive ? 'DISABLE' : 'ENABLE'} color={game.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(game._id, game.isActive)} />
                  <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(game._id)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {createModal && (
        <Modal title="Add Game" onClose={() => setCreateModal(false)} width={500}>
          {formFields(handleCreate, 'CREATE GAME')}
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Game" subtitle={editModal.name} onClose={() => { setEditModal(null); setMigrateSlug(''); setMigrateName(''); setMigrateResult(null) }} width={500}>
          {formFields(handleEdit, 'SAVE CHANGES')}
          <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#3b82f6', marginBottom: 6, letterSpacing: 0.5 }}>Migrate Old Slug</div>
            <div style={{ fontSize: 10, color: '#4F5568', marginBottom: 8, }}>If this game was renamed, enter the old slug and name to migrate all matches, teams, ladders, stats, and user profiles.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input value={migrateSlug} onChange={e => setMigrateSlug(e.target.value)} placeholder="Old slug (e.g. call-of-duty)" style={{ padding: '6px 10px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 4, color: '#fff', fontSize: 11, }} />
              <input value={migrateName} onChange={e => setMigrateName(e.target.value)} placeholder="Old name (e.g. Call of Duty)" style={{ padding: '6px 10px', background: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 4, color: '#fff', fontSize: 11, }} />
              <button onClick={async () => {
                if (!migrateSlug.trim()) return
                try {
                  const res = await adminApi.migrateGameSlug(editModal._id, migrateSlug.trim(), migrateName.trim() || undefined)
                  setMigrateResult(`Migrated ${res.updated} records`)
                  setMigrateSlug(''); setMigrateName('')
                } catch (err: any) { console.error('Migration error:', err); setMigrateResult(`Migration failed: ${err?.message || err}`) }
              }} style={{ padding: '6px 14px', background: '#3b82f6', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase' }}>Migrate</button>
            </div>
            {migrateResult && <div style={{ marginTop: 6, fontSize: 10, color: '#4ade80', }}>{migrateResult}</div>}
          </div>
        </Modal>
      )}
    </div>
  )
}
