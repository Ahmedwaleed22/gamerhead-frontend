'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const RARITY_COLORS: Record<string, string> = { Common: '#6b7280', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b' }
const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

const BADGE_TRIGGERS = [
  { value: 'first-win', label: 'First Win' },
  { value: 'win-streak', label: 'Win Streak (X)' },
  { value: 'matches-played', label: 'Matches Played (X)' },
  { value: 'cash-earned', label: 'Cash Earned (X)' },
  { value: 'level-reached', label: 'Level Reached (X)' },
  { value: 'forum-posts', label: 'Forum Posts (X)' },
  { value: 'team-created', label: 'Team Created' },
  { value: 'referral', label: 'Referrals (X)' },
  { value: 'tournament-win', label: 'Tournament Win' },
  { value: 'premium-subscribe', label: 'Premium Subscription' },
  { value: 'profile-complete', label: 'Profile Complete' },
  { value: 'manual', label: 'Manual (Admin Awarded)' },
]

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [awardModal, setAwardModal] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', desc: '', img: '', rarity: 'Common', category: 'platform', trigger: '', threshold: '1', isActive: true })
  const [awardForm, setAwardForm] = useState({ userId: '', badgeSlug: '' })
  const imgInputRef = useRef<HTMLInputElement>(null)

  const emptyForm = { name: '', slug: '', desc: '', img: '', rarity: 'Common', category: 'platform', trigger: '', threshold: '1', isActive: true }

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getBadges({ limit: 50 }); setBadges(res.badges) } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const [imgUploading, setImgUploading] = useState(false)

  const handleImgSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    e.target.value = ''
    setImgUploading(true)
    try {
      const res = await adminApi.uploadFile(file)
      setForm(p => ({ ...p, img: res.url }))
    } catch { }
    setImgUploading(false)
  }

  const handleCreate = async () => {
    try {
      await adminApi.createBadge({ ...form, threshold: Number(form.threshold) })
      setCreateModal(false)
      setForm(emptyForm)
      load()
    } catch { }
  }

  const openEditModal = (badge: any) => {
    setForm({
      name: badge.name || '',
      slug: badge.slug || '',
      desc: badge.desc || badge.description || '',
      img: badge.img || '',
      rarity: badge.rarity || 'Common',
      category: badge.category || 'platform',
      trigger: badge.trigger || '',
      threshold: String(badge.threshold || '1'),
      isActive: badge.isActive ?? true,
    })
    setEditModal(badge)
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updateBadge(editModal._id, { ...form, threshold: Number(form.threshold) })
      setEditModal(null)
      setForm(emptyForm)
      load()
    } catch { }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      if (isActive) await adminApi.disableBadge(id)
      else await adminApi.updateBadge(id, { isActive: true })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteBadge(id); load() } catch { }
  }

  const handleAward = async () => {
    if (!awardForm.userId || !awardForm.badgeSlug) return
    try { await adminApi.awardBadge(awardForm.userId, { badgeSlug: awardForm.badgeSlug }); setAwardModal(false); setAwardForm({ userId: '', badgeSlug: '' }) } catch { }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Badges</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn label="AWARD TO USER" color="#3b82f6" onClick={() => setAwardModal(true)} />
          <ActionBtn label="+ CREATE BADGE" color="#22c55e" onClick={() => { setForm(emptyForm); setCreateModal(true) }} />
        </div>
      </div>

      {loading ? <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <>
          {/* Platform Badges */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
              Platform Badges ({badges.filter(b => b.category !== 'forum').length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {badges.filter((b: any) => b.category !== 'forum').map((b: any) => (
                <div key={b._id} style={{
                  background: '#13131E', border: `1px solid ${RARITY_COLORS[b.rarity] || '#4F5568'}44`,
                  borderRadius: 10, padding: 14, textAlign: 'center', opacity: b.isActive ? 1 : 0.5,
                }}>
                  {b.img && <img src={b.img} alt={b.name} style={{ width: 48, height: 48, marginBottom: 6, objectFit: 'cover' }} />}
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA' }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: RARITY_COLORS[b.rarity] || '#4F5568', fontWeight: 700 }}>{b.rarity}</div>
                  <div style={{ fontSize: 9, color: '#4F5568', marginTop: 4 }}>{b.slug}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                    <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(b)} />
                    <ActionBtn label={b.isActive ? 'DISABLE' : 'ENABLE'} color={b.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(b._id, b.isActive)} />
                    <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(b._id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forum Badges */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
              Forum Badges ({badges.filter(b => b.category === 'forum').length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {badges.filter((b: any) => b.category === 'forum').map((b: any) => (
                <div key={b._id} style={{
                  background: '#13131E', border: `1px solid ${RARITY_COLORS[b.rarity] || '#4F5568'}44`,
                  borderRadius: 10, padding: 14, textAlign: 'center', opacity: b.isActive ? 1 : 0.5,
                }}>
                  {b.img && <img src={b.img} alt={b.name} style={{ width: 48, height: 48, marginBottom: 6, objectFit: 'cover' }} />}
                  <div style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA' }}>{b.name}</div>
                  <div style={{ fontSize: 9, color: RARITY_COLORS[b.rarity] || '#4F5568', fontWeight: 700 }}>{b.rarity}</div>
                  <div style={{ fontSize: 9, color: '#4F5568', marginTop: 4 }}>{b.slug}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                    <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(b)} />
                    <ActionBtn label={b.isActive ? 'DISABLE' : 'ENABLE'} color={b.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(b._id, b.isActive)} />
                    <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(b._id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {createModal && (
        <Modal title="Create Badge" onClose={() => setCreateModal(false)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Description</div>
              <input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Badge Image</div>
              <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImgSelect} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {form.img && <img src={form.img} alt="preview" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#0d0d14' }} />}
                <button type="button" onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ ...inputStyle, cursor: imgUploading ? 'default' : 'pointer', width: 'auto', padding: '7px 14px', color: '#9CA3AF', textAlign: 'left' }}>
                  {imgUploading ? 'Uploading...' : form.img ? 'Change Image' : 'Choose Image...'}
                </button>
                {form.img && <button type="button" onClick={() => setForm(p => ({ ...p, img: '' }))} style={{ background: 'none', border: 'none', color: '#e8000d', cursor: 'pointer', fontSize: 12 }}>Remove</button>}
              </div>
            </div>
            <div><div style={labelStyle}>Rarity</div>
              <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))} style={inputStyle}>
                <option value="Common">Common</option><option value="Rare">Rare</option><option value="Epic">Epic</option><option value="Legendary">Legendary</option>
              </select>
            </div>
            <div><div style={labelStyle}>Category</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                <option value="platform">Platform</option><option value="forum">Forum</option>
              </select>
            </div>
            <div><div style={labelStyle}>Trigger</div>
              <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} style={inputStyle}>
                <option value="">Select trigger...</option>
                {BADGE_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><div style={labelStyle}>Threshold</div><input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))} style={inputStyle} placeholder="1" /></div>
            <ActionBtn label="CREATE BADGE" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Badge" subtitle={editModal.name} onClose={() => { setEditModal(null); setForm(emptyForm) }} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Name</div>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Description</div>
              <input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Badge Image</div>
              <input ref={imgInputRef} type="file" accept="image/*" onChange={handleImgSelect} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {form.img && <img src={form.img} alt="preview" style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#0d0d14' }} />}
                <button type="button" onClick={() => imgInputRef.current?.click()} disabled={imgUploading} style={{ ...inputStyle, cursor: imgUploading ? 'default' : 'pointer', width: 'auto', padding: '7px 14px', color: '#9CA3AF', textAlign: 'left' }}>
                  {imgUploading ? 'Uploading...' : form.img ? 'Change Image' : 'Choose Image...'}
                </button>
                {form.img && <button type="button" onClick={() => setForm(p => ({ ...p, img: '' }))} style={{ background: 'none', border: 'none', color: '#e8000d', cursor: 'pointer', fontSize: 12 }}>Remove</button>}
              </div>
            </div>
            <div><div style={labelStyle}>Rarity</div>
              <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))} style={inputStyle}>
                <option value="Common">Common</option><option value="Rare">Rare</option><option value="Epic">Epic</option><option value="Legendary">Legendary</option>
              </select>
            </div>
            <div><div style={labelStyle}>Category</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                <option value="platform">Platform</option><option value="forum">Forum</option>
              </select>
            </div>
            <div><div style={labelStyle}>Trigger</div>
              <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} style={inputStyle}>
                <option value="">Select trigger...</option>
                {BADGE_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><div style={labelStyle}>Threshold</div><input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))} style={inputStyle} placeholder="1" /></div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} />
          </div>
        </Modal>
      )}

      {awardModal && (
        <Modal title="Award Badge to User" onClose={() => setAwardModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><div style={labelStyle}>User ID</div><input value={awardForm.userId} onChange={e => setAwardForm(p => ({ ...p, userId: e.target.value }))} style={inputStyle} placeholder="Paste user ID..." /></div>
            <div><div style={labelStyle}>Badge Slug</div><input value={awardForm.badgeSlug} onChange={e => setAwardForm(p => ({ ...p, badgeSlug: e.target.value }))} style={inputStyle} placeholder="e.g. first-win" /></div>
            <ActionBtn label="AWARD BADGE" color="#3b82f6" onClick={handleAward} />
          </div>
        </Modal>
      )}
    </div>
  )
}
