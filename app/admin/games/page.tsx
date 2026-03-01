'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', bannerUrl: '', accentColor: '#e8000d', platforms: '', genre: '', crossplay: false, gameIdLabel: '', isActive: true, modes: '', modeMapMatrix: '' })

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getGames({ limit: 50 }); setGames(res.games) } catch (err) { console.error('[Admin Games] load error:', err) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      await adminApi.createGame({
        ...form,
        platforms: form.platforms.split(',').map(s => s.trim()).filter(Boolean),
        modes: form.modes.split(',').map(s => s.trim()).filter(Boolean),
        modeMapMatrix: form.modeMapMatrix ? JSON.parse(form.modeMapMatrix) : {},
      })
      setCreateModal(false)
      setForm({ name: '', slug: '', description: '', bannerUrl: '', accentColor: '#e8000d', platforms: '', genre: '', crossplay: false, gameIdLabel: '', isActive: true, modes: '', modeMapMatrix: '' })
      load()
    } catch { }
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updateGame(editModal._id, {
        ...form,
        platforms: form.platforms.split(',').map(s => s.trim()).filter(Boolean),
        modes: form.modes.split(',').map(s => s.trim()).filter(Boolean),
        modeMapMatrix: form.modeMapMatrix ? JSON.parse(form.modeMapMatrix) : {},
      })
      setEditModal(null)
      setForm({ name: '', slug: '', description: '', bannerUrl: '', accentColor: '#e8000d', platforms: '', genre: '', crossplay: false, gameIdLabel: '', isActive: true, modes: '', modeMapMatrix: '' })
      load()
    } catch { }
  }

  const openEditModal = (game: any) => {
    setForm({
      name: game.name || '',
      slug: game.slug || '',
      description: game.description || '',
      bannerUrl: game.bannerUrl || '',
      accentColor: game.accentColor || '#e8000d',
      platforms: (game.platforms || []).join(', '),
      genre: game.genre || '',
      crossplay: game.crossplay || false,
      gameIdLabel: game.gameIdLabel || '',
      isActive: game.isActive ?? true,
      modes: (game.modes || []).join(', '),
      modeMapMatrix: game.modeMapMatrix ? JSON.stringify(game.modeMapMatrix, null, 2) : '',
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

  const GameForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[['Name', 'name'], ['Slug', 'slug'], ['Description', 'description'], ['Banner URL', 'bannerUrl'], ['Genre', 'genre'], ['Game ID Label', 'gameIdLabel']].map(([l, k]) => (
        <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
      ))}
      <div><div style={labelStyle}>Accent Color</div><input type="color" value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))} style={{ ...inputStyle, height: 32, padding: 2 }} /></div>
      <div><div style={labelStyle}>Platforms (comma separated)</div><input value={form.platforms} onChange={e => setForm(p => ({ ...p, platforms: e.target.value }))} style={inputStyle} placeholder="PS5, Xbox, PC" /></div>
      <div><div style={labelStyle}>Modes (comma separated)</div><input value={form.modes} onChange={e => setForm(p => ({ ...p, modes: e.target.value }))} style={inputStyle} placeholder="Search & Destroy, Hardpoint" /></div>
      <div><div style={labelStyle}>Mode-Map Matrix (JSON)</div><textarea value={form.modeMapMatrix} onChange={e => setForm(p => ({ ...p, modeMapMatrix: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder='{"Search & Destroy": ["Raid", "Skidrow"]}' /></div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.crossplay} onChange={e => setForm(p => ({ ...p, crossplay: e.target.checked }))} /> Crossplay
      </label>
      <ActionBtn label={submitLabel} color="#22c55e" onClick={onSubmit} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Games</h1>
        <ActionBtn label="+ ADD GAME" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>

      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
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
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff' }}>{game.name}</span>
                  {!game.isActive && <span style={{ fontSize: 8, fontWeight: 700, color: '#e8000d', fontFamily: 'Rajdhani, sans-serif' }}>DISABLED</span>}
                </div>
                <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginBottom: 8 }}>
                  {game.platforms?.join(', ')} · {game.genre} {game.crossplay ? '· Crossplay' : ''}
                </div>
                <div style={{ fontSize: 9, color: '#8890A4', fontFamily: 'Rajdhani, sans-serif', marginBottom: 8 }}>
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
          <GameForm onSubmit={handleCreate} submitLabel="CREATE GAME" />
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Game" subtitle={editModal.name} onClose={() => setEditModal(null)} width={500}>
          <GameForm onSubmit={handleEdit} submitLabel="SAVE CHANGES" />
        </Modal>
      )}
    </div>
  )
}
