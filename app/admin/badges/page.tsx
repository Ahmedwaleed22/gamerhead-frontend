'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

// ── Constants ─────────────────────────────────────────────────────────────────

const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const RARITY_COLORS: Record<string, string> = {
  Common: '#6b7280', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
}

const BADGE_TRIGGERS = [
  { value: 'discord_linked',              label: 'Discord Account Linked' },
  { value: 'psn_linked',                  label: 'PlayStation Account Linked' },
  { value: 'xbox_linked',                 label: 'Xbox Account Linked' },
  { value: 'steam_linked',                label: 'Steam Account Linked' },
  { value: 'twitch_linked',               label: 'Twitch Account Linked' },
  { value: 'twitter_linked',              label: 'Twitter / X Account Linked' },
  { value: 'epic_linked',                 label: 'Epic Games Account Linked' },
  { value: 'battlenet_linked',            label: 'Battle.net Account Linked' },
  { value: 'friend_added',               label: 'Friends Count (threshold)' },
  { value: 'ladder_win',                 label: 'Ladder Wins (threshold)' },
  { value: 'match_completed',            label: 'Matches Played (threshold)' },
  { value: 'cash_earned',               label: 'Cash Earned in USD (threshold)' },
  { value: 'tournament_played',         label: 'Tournaments Played (threshold)' },
  { value: 'team_created',              label: 'First Team Created' },
  { value: 'potw_awarded',              label: 'Player of the Week' },
  { value: 'role_member',               label: 'Role: Member' },
  { value: 'role_premium',              label: 'Role: Premium' },
  { value: 'role_coach',                label: 'Role: Coach' },
  { value: 'role_admin',                label: 'Role: Admin' },
  { value: 'forum_qualified_post_count',  label: "Forum Posts on Others' Threads (24 h+)" },
  { value: 'forum_qualified_thread_count',label: 'Forum Threads Created (24 h+)' },
  { value: 'forum_reactions_total',       label: 'Total Reactions Received' },
  { value: 'forum_thread_op_reactions',   label: 'Reactions on Single Thread OP' },
  { value: 'manual',                     label: 'Manual (Admin Awarded)' },
]

const BADGE_SUBCATEGORIES = [
  { value: 'link_accounts',      label: 'Link Accounts' },
  { value: 'friends',            label: 'Friends' },
  { value: 'wins',               label: 'Wins' },
  { value: 'matches',            label: 'Matches' },
  { value: 'cash_earned',        label: 'Cash Earned' },
  { value: 'tournaments_played', label: 'Tournaments Played' },
  { value: 'misc',               label: 'Misc / Other' },
  { value: 'role',               label: 'Forum Role' },
  { value: 'posting_milestones', label: 'Posting Milestones' },
  { value: 'thread_creation',    label: 'Thread Creation' },
  { value: 'reaction_milestones',label: 'Reaction Milestones' },
  { value: 'high_engagement',    label: 'High Engagement' },
]

const CATEGORY_ORDER: Record<string, string[]> = {
  platform: ['link_accounts','friends','wins','matches','cash_earned','tournaments_played','misc'],
  forum:    ['role','posting_milestones','thread_creation','reaction_milestones','high_engagement'],
}

const SUBCATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BADGE_SUBCATEGORIES.map(s => [s.value, s.label])
)

// ── Styles ────────────────────────────────────────────────────────────────────

const IS: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const LS: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = {
  name: '', slug: '', desc: '', img: '',
  rarity: 'Common', category: 'platform', subcategory: '',
  trigger: '', threshold: '', operator: 'gte',
  minHoursActive: '', revocable: false, displayOnForum: false,
  sortOrder: '0', isActive: true,
}

// ── UserSearchPicker ──────────────────────────────────────────────────────────

function UserSearchPicker({ onSelect }: { onSelect: (u: any) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!q.trim()) { setResults([]); return }
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await adminApi.getUsers({ search: q.trim(), limit: 8 })
        setResults(res.users || [])
      } catch { setResults([]) }
      setLoading(false)
    }, 350)
  }, [q])

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        style={{ ...IS, paddingLeft: 32 }}
        placeholder="Search by username or email…"
        autoComplete="off"
      />
      <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F5568" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      {loading && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#4F5568' }}>…</span>
      )}
      {results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d0d14', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, zIndex: 50, marginTop: 2, maxHeight: 260, overflowY: 'auto' }}>
          {results.map((u: any) => (
            <div
              key={u._id}
              onClick={() => { onSelect(u); setQ(''); setResults([]) }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)', transition: 'background .12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {u.avatarUrl
                  ? <img src={u.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>{(u.username || '?').slice(0, 2).toUpperCase()}</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.displayName || u.username}</div>
                <div style={{ fontSize: 10, color: '#4F5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || `@${u.username}`}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: .6, textTransform: 'uppercase', color: u.role === 'admin' ? '#e8000d' : u.isPremium ? '#f59e0b' : '#6b7280', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
                {u.role === 'admin' ? 'Admin' : u.isPremium ? 'Premium' : u.role === 'coach' ? 'Coach' : 'Member'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── BadgeSearchDropdown ───────────────────────────────────────────────────────

function BadgeSearchDropdown({ badges, selected, onSelect }: {
  badges: any[]; selected: any | null; onSelect: (b: any) => void
}) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = badges.filter(b =>
    !q.trim() ||
    b.name.toLowerCase().includes(q.toLowerCase()) ||
    b.slug.toLowerCase().includes(q.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ ...IS, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}
      >
        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            {selected.img && <img src={selected.img} alt="" style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />}
            <span style={{ fontSize: 11, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
            <span style={{ fontSize: 9, color: RARITY_COLORS[selected.rarity] || '#6b7280', fontWeight: 700, flexShrink: 0 }}>{selected.rarity}</span>
          </div>
        ) : (
          <span style={{ color: '#4F5568' }}>Select a badge…</span>
        )}
        <span style={{ color: '#4F5568', fontSize: 10, flexShrink: 0 }}>▼</span>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0d0d14', border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, zIndex: 50, marginTop: 2 }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
            <input
              autoFocus
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search badges…"
              style={{ ...IS, width: '100%' }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '14px 12px', fontSize: 11, color: '#4F5568', textAlign: 'center' }}>No badges found</div>
              : filtered.map((b: any) => (
                <div
                  key={b._id}
                  onClick={() => { onSelect(b); setOpen(false); setQ('') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.04)', transition: 'background .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {b.img
                      ? <img src={b.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 16 }}>🏅</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</div>
                    <div style={{ fontSize: 9, color: '#4F5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {SUBCATEGORY_LABELS[b.subcategory] || b.category} · {b.slug}
                    </div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: RARITY_COLORS[b.rarity] || '#6b7280', flexShrink: 0 }}>{b.rarity}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ── BadgeFormFields ────────────────────────────────────────────────────────────

function BadgeFormFields({ form, setForm, imgUploading, onImgSelect, imgInputRef }: {
  form: typeof emptyForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
  imgUploading: boolean; onImgSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  imgInputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <>
      {/* Name */}
      <div>
        <div style={LS}>Name</div>
        <input value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))}
          style={IS} placeholder="Badge name…" />
      </div>

      {/* Description */}
      <div>
        <div style={LS}>Description</div>
        <input value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} style={IS} placeholder="How to earn it…" />
      </div>

      {/* Image */}
      <div>
        <div style={LS}>Badge Image</div>
        <input ref={imgInputRef} type="file" accept="image/*" onChange={onImgSelect} style={{ display: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {form.img && <img src={form.img} alt="preview" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4, background: '#0d0d14' }} />}
          <button type="button" onClick={() => imgInputRef.current?.click()} disabled={imgUploading}
            style={{ ...IS, cursor: imgUploading ? 'default' : 'pointer', width: 'auto', padding: '7px 14px', color: '#9CA3AF' }}>
            {imgUploading ? 'Uploading…' : form.img ? 'Change Image' : 'Choose Image…'}
          </button>
          {form.img && <button type="button" onClick={() => setForm(p => ({ ...p, img: '' }))} style={{ background: 'none', border: 'none', color: '#e8000d', cursor: 'pointer', fontSize: 11 }}>Remove</button>}
        </div>
      </div>

      {/* Rarity + Category */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={LS}>Rarity</div>
          <select value={form.rarity} onChange={e => setForm(p => ({ ...p, rarity: e.target.value }))} style={IS}>
            <option value="Common">Common</option>
            <option value="Rare">Rare</option>
            <option value="Epic">Epic</option>
            <option value="Legendary">Legendary</option>
          </select>
        </div>
        <div>
          <div style={LS}>Category</div>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value, subcategory: '' }))} style={IS}>
            <option value="platform">Platform</option>
            <option value="forum">Forum</option>
          </select>
        </div>
      </div>

      {/* Subcategory */}
      <div>
        <div style={LS}>Subcategory</div>
        <select value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} style={IS}>
          <option value="">— None —</option>
          {(form.category === 'platform'
            ? BADGE_SUBCATEGORIES.filter(s => ['link_accounts','friends','wins','matches','cash_earned','tournaments_played','misc'].includes(s.value))
            : BADGE_SUBCATEGORIES.filter(s => ['role','posting_milestones','thread_creation','reaction_milestones','high_engagement'].includes(s.value))
          ).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Trigger + Threshold */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <div>
          <div style={LS}>Trigger</div>
          <select value={form.trigger} onChange={e => setForm(p => ({ ...p, trigger: e.target.value }))} style={IS}>
            <option value="">— Select trigger —</option>
            {BADGE_TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <div style={LS}>Threshold</div>
          <input type="number" value={form.threshold} onChange={e => setForm(p => ({ ...p, threshold: e.target.value }))} style={IS} placeholder="None" min="0" />
        </div>
      </div>

      {/* Operator + Min Hours Active */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <div style={LS}>Operator</div>
          <select value={form.operator} onChange={e => setForm(p => ({ ...p, operator: e.target.value }))} style={IS}>
            <option value="gte">≥ Greater than or equal</option>
            <option value="lte">≤ Less than or equal</option>
            <option value="eq">= Exactly equal</option>
          </select>
        </div>
        <div>
          <div style={LS}>Min Hours Active</div>
          <input type="number" value={form.minHoursActive} onChange={e => setForm(p => ({ ...p, minHoursActive: e.target.value }))} style={IS} placeholder="None (e.g. 24)" min="0" />
        </div>
      </div>

      {/* Flags row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {([
          { key: 'revocable',     label: 'Revocable',       desc: 'Auto-remove if count drops' },
          { key: 'displayOnForum',label: 'Show on Forum',   desc: 'Selectable on thread posts' },
          { key: 'isActive',      label: 'Active',          desc: 'Award automatically' },
        ] as const).map(({ key, label, desc }) => (
          <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#DDE0EA' }}>{label}</span>
              <div style={{ width: 32, height: 16, borderRadius: 8, background: form[key] ? '#22c55e' : '#374151', transition: 'background .2s', position: 'relative' }} onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}>
                <div style={{ position: 'absolute', top: 2, left: form[key] ? 18 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </div>
            </div>
            <span style={{ fontSize: 9, color: '#4F5568' }}>{desc}</span>
          </label>
        ))}
      </div>

      {/* Sort Order */}
      <div>
        <div style={LS}>Sort Order</div>
        <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} style={IS} placeholder="0" min="0" />
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminBadgesPage() {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [manageModal, setManageModal] = useState(false)
  const [manageMode, setManageMode] = useState<'award' | 'remove'>('award')
  const [manageUser, setManageUser] = useState<any>(null)
  const [manageUserBadges, setManageUserBadges] = useState<any[]>([])
  const [manageUserLoading, setManageUserLoading] = useState(false)
  const [awardBadge, setAwardBadge] = useState<any>(null)
  const [removeBadge, setRemoveBadge] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm })
  const imgInputRef = useRef<HTMLInputElement>(null as unknown as HTMLInputElement)
  const [imgUploading, setImgUploading] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getBadges({ limit: 200 })
      setBadges(res.badges || [])
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleImgSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    e.target.value = ''
    setImgUploading(true)
    try {
      const res = await adminApi.uploadFile(file)
      setForm(p => ({ ...p, img: res.url }))
    } catch { }
    setImgUploading(false)
  }

  const handleCreate = async () => {
    setSaving(true)
    try {
      await adminApi.createBadge({
        ...form,
        threshold:     form.threshold     ? Number(form.threshold)     : null,
        minHoursActive:form.minHoursActive ? Number(form.minHoursActive): null,
        sortOrder:     Number(form.sortOrder) || 0,
        slug:          form.slug || slugify(form.name),
      })
      setCreateModal(false)
      setForm({ ...emptyForm })
      load()
      showToast('Badge created')
    } catch (e: any) { showToast(e?.message || 'Failed', false) }
    setSaving(false)
  }

  const openEdit = (badge: any) => {
    setForm({
      name:          badge.name || '',
      slug:          badge.slug || '',
      desc:          badge.desc || '',
      img:           badge.img  || '',
      rarity:        badge.rarity    || 'Common',
      category:      badge.category  || 'platform',
      subcategory:   badge.subcategory || '',
      trigger:       badge.trigger    || '',
      threshold:     badge.threshold  != null ? String(badge.threshold) : '',
      operator:      badge.operator   || 'gte',
      minHoursActive:badge.minHoursActive != null ? String(badge.minHoursActive) : '',
      revocable:     badge.revocable    ?? false,
      displayOnForum:badge.displayOnForum ?? false,
      sortOrder:     String(badge.sortOrder ?? 0),
      isActive:      badge.isActive ?? true,
    })
    setEditModal(badge)
  }

  const handleEdit = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      await adminApi.updateBadge(editModal._id, {
        ...form,
        threshold:     form.threshold     ? Number(form.threshold)     : null,
        minHoursActive:form.minHoursActive ? Number(form.minHoursActive): null,
        sortOrder:     Number(form.sortOrder) || 0,
      })
      setEditModal(null)
      setForm({ ...emptyForm })
      load()
      showToast('Badge updated')
    } catch (e: any) { showToast(e?.message || 'Failed', false) }
    setSaving(false)
  }

  const handleToggle = async (badge: any) => {
    try {
      if (badge.isActive) await adminApi.disableBadge(badge._id)
      else await adminApi.enableBadge(badge._id)
      load()
      showToast(badge.isActive ? 'Badge disabled' : 'Badge enabled')
    } catch (e: any) { showToast(e?.message || 'Failed', false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this badge? If users have it, it will be disabled instead.')) return
    try { await adminApi.deleteBadge(id); load(); showToast('Deleted') }
    catch (e: any) { showToast(e?.message || 'Failed', false) }
  }

  const handleAward = async () => {
    if (!manageUser || !awardBadge) return
    setSaving(true)
    try {
      await adminApi.awardBadge(manageUser._id, { badgeSlug: awardBadge.slug })
      setAwardBadge(null)
      showToast(`"${awardBadge.name}" awarded to ${manageUser.displayName || manageUser.username}`)
    } catch (e: any) { showToast(e?.message || 'Already has this badge or error', false) }
    setSaving(false)
  }

  useEffect(() => {
    if (!manageUser || manageMode !== 'remove') { setManageUserBadges([]); setRemoveBadge(null); return }
    setManageUserLoading(true)
    adminApi.getUser(manageUser._id)
      .then((res: any) => setManageUserBadges(res.badges || []))
      .catch(() => setManageUserBadges([]))
      .finally(() => setManageUserLoading(false))
  }, [manageUser, manageMode])

  const handleRevoke = async () => {
    if (!manageUser || !removeBadge) return
    setSaving(true)
    try {
      await adminApi.revokeBadgeFromUser(manageUser._id, removeBadge._id)
      setManageUserBadges(prev => prev.filter((b: any) => b._id !== removeBadge._id))
      setRemoveBadge(null)
      showToast(`"${removeBadge.name}" removed from ${manageUser.displayName || manageUser.username}`)
    } catch (e: any) { showToast(e?.message || 'Failed', false) }
    setSaving(false)
  }

  const handleRefreshCache = async () => {
    try { await adminApi.refreshBadgeCache(); showToast('Badge cache refreshed') }
    catch { showToast('Failed', false) }
  }

  // Group badges by category then subcategory
  const grouped: Record<string, Record<string, any[]>> = { platform: {}, forum: {} }
  for (const b of badges) {
    const cat = b.category || 'platform'
    const sub = b.subcategory || 'misc'
    if (!grouped[cat]) grouped[cat] = {}
    if (!grouped[cat][sub]) grouped[cat][sub] = []
    grouped[cat][sub].push(b)
  }

  const renderSection = (cat: string) => {
    const subs = CATEGORY_ORDER[cat] || Object.keys(grouped[cat] || {})
    const sections = subs.filter(s => grouped[cat]?.[s]?.length > 0)
    if (!sections.length) return null
    return (
      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,.06)', paddingBottom: 8 }}>
          {cat === 'platform' ? '🎮 User Profile Badges' : '💬 Forum Badges'}
          <span style={{ fontSize: 10, color: '#4F5568', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>({(grouped[cat] ? Object.values(grouped[cat]).flat() : []).length})</span>
        </div>
        {sections.map(sub => (
          <div key={sub}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
              {SUBCATEGORY_LABELS[sub] || sub}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {(grouped[cat]?.[sub] || []).map((b: any) => (
                <div key={b._id} style={{
                  background: '#13131E',
                  border: `1px solid ${RARITY_COLORS[b.rarity] || '#4F5568'}${b.isActive ? '44' : '22'}`,
                  borderRadius: 10, padding: 12, textAlign: 'center',
                  opacity: b.isActive ? 1 : 0.45, position: 'relative',
                }}>
                  {!b.isActive && (
                    <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 8, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 3, padding: '1px 4px', letterSpacing: .4 }}>OFF</div>
                  )}
                  {b.revocable && (
                    <div style={{ position: 'absolute', top: b.isActive ? 6 : 20, right: 6, fontSize: 8, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 3, padding: '1px 4px', letterSpacing: .4 }}>REV</div>
                  )}
                  <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.img
                      ? <img src={b.img} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 20 }}>🏅</span>
                    }
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: '#DDE0EA', lineHeight: 1.3, marginBottom: 2 }}>{b.name}</div>
                  <div style={{ fontSize: 8, color: RARITY_COLORS[b.rarity] || '#4F5568', fontWeight: 700, letterSpacing: .6 }}>{b.rarity}</div>
                  {b.threshold != null && (
                    <div style={{ fontSize: 8, color: '#4F5568', marginTop: 2 }}>{b.operator === 'lte' ? '≤' : b.operator === 'eq' ? '=' : '≥'} {b.threshold.toLocaleString()}</div>
                  )}
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                    <ActionBtn label="Edit" color="#3b82f6" onClick={() => openEdit(b)} />
                    <ActionBtn label={b.isActive ? 'Disable' : 'Enable'} color={b.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(b)} />
                    <ActionBtn label="Del" color="#e8000d" onClick={() => handleDelete(b._id)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: toast.ok ? '#16a34a' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Badges</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionBtn label="↺ Refresh Cache" color="#6b7280" onClick={handleRefreshCache} />
          <ActionBtn label="⊕ Manage User Badges" color="#3b82f6" onClick={() => { setManageModal(true); setManageMode('award'); setManageUser(null); setAwardBadge(null); setRemoveBadge(null) }} />
          <ActionBtn label="+ Create Badge"  color="#22c55e" onClick={() => { setForm({ ...emptyForm }); setCreateModal(true) }} />
        </div>
      </div>

      {loading
        ? <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading…</div>
        : <>
            {renderSection('platform')}
            {renderSection('forum')}
            {badges.filter(b => !b.category || !['platform','forum'].includes(b.category)).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Other</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 10 }}>
                  {badges.filter(b => !['platform','forum'].includes(b.category)).map((b: any) => (
                    <div key={b._id} style={{ background: '#13131E', border: `1px solid ${RARITY_COLORS[b.rarity] || '#4F5568'}44`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                      {b.img && <img src={b.img} alt={b.name} style={{ width: 40, height: 40, marginBottom: 4, objectFit: 'cover' }} />}
                      <div style={{ fontWeight: 700, fontSize: 11, color: '#DDE0EA' }}>{b.name}</div>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
                        <ActionBtn label="Edit" color="#3b82f6" onClick={() => openEdit(b)} />
                        <ActionBtn label="Del"  color="#e8000d" onClick={() => handleDelete(b._id)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
      }

      {/* ── CREATE MODAL ── */}
      {createModal && (
        <Modal title="Create Badge" onClose={() => { setCreateModal(false); setForm({ ...emptyForm }) }} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BadgeFormFields form={form} setForm={setForm} imgUploading={imgUploading} onImgSelect={handleImgSelect} imgInputRef={imgInputRef} />
            <ActionBtn label={saving ? 'Creating…' : 'Create Badge'} color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <Modal title="Edit Badge" subtitle={editModal.name} onClose={() => { setEditModal(null); setForm({ ...emptyForm }) }} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BadgeFormFields form={form} setForm={setForm} imgUploading={imgUploading} onImgSelect={handleImgSelect} imgInputRef={imgInputRef} />
            <ActionBtn label={saving ? 'Saving…' : 'Save Changes'} color="#22c55e" onClick={handleEdit} />
          </div>
        </Modal>
      )}

      {/* ── MANAGE USER BADGES MODAL (Award + Remove) ── */}
      {manageModal && (
        <Modal title="Manage User Badges" onClose={() => { setManageModal(false); setManageUser(null); setAwardBadge(null); setRemoveBadge(null) }} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Mode toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: 3 }}>
              {(['award', 'remove'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setManageMode(m); setAwardBadge(null); setRemoveBadge(null) }}
                  style={{
                    background: manageMode === m ? (m === 'award' ? '#3b82f6' : '#f59e0b') : 'transparent',
                    border: 'none', borderRadius: 6, padding: '8px 0',
                    fontWeight: 700, fontSize: 11, letterSpacing: .6, textTransform: 'uppercase',
                    color: manageMode === m ? '#fff' : '#6b7280', cursor: 'pointer', transition: 'all .15s',
                  }}
                >{m === 'award' ? '⊕ Award Badge' : '⊖ Remove Badge'}</button>
              ))}
            </div>

            {/* Shared user picker */}
            <div>
              <div style={LS}>Select User</div>
              {manageUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    {manageUser.avatarUrl
                      ? <img src={manageUser.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontWeight: 700, fontSize: 14, color: '#9CA3AF' }}>{(manageUser.username || '?').slice(0, 2).toUpperCase()}</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{manageUser.displayName || manageUser.username}</div>
                    <div style={{ fontSize: 10, color: '#4F5568' }}>{manageUser.email || `@${manageUser.username}`}</div>
                  </div>
                  <button onClick={() => { setManageUser(null); setAwardBadge(null); setRemoveBadge(null) }} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 5, color: '#9CA3AF', cursor: 'pointer', fontSize: 10, padding: '4px 10px', fontWeight: 700 }}>Change</button>
                </div>
              ) : (
                <UserSearchPicker onSelect={setManageUser} />
              )}
            </div>

            {/* ── AWARD mode: pick any badge ── */}
            {manageMode === 'award' && (
              <div>
                <div style={LS}>Select Badge to Award</div>
                {awardBadge ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${RARITY_COLORS[awardBadge.rarity] || '#4F5568'}44`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {awardBadge.img ? <img src={awardBadge.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🏅</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{awardBadge.name}</div>
                      <div style={{ fontSize: 10, color: RARITY_COLORS[awardBadge.rarity] || '#6b7280', fontWeight: 700 }}>{awardBadge.rarity} · {SUBCATEGORY_LABELS[awardBadge.subcategory] || awardBadge.category}</div>
                      {awardBadge.desc && <div style={{ fontSize: 10, color: '#4F5568', marginTop: 2 }}>{awardBadge.desc}</div>}
                    </div>
                    <button onClick={() => setAwardBadge(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 5, color: '#9CA3AF', cursor: 'pointer', fontSize: 10, padding: '4px 10px', fontWeight: 700 }}>Change</button>
                  </div>
                ) : (
                  <BadgeSearchDropdown badges={badges} selected={awardBadge} onSelect={setAwardBadge} />
                )}
              </div>
            )}

            {/* ── REMOVE mode: pick from user's earned badges ── */}
            {manageMode === 'remove' && manageUser && (
              <div>
                <div style={LS}>Select Badge to Remove</div>
                {manageUserLoading ? (
                  <div style={{ fontSize: 11, color: '#4F5568', padding: '12px 0' }}>Loading badges…</div>
                ) : manageUserBadges.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#4F5568', padding: '12px 0' }}>This user has no badges.</div>
                ) : removeBadge ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.04)', border: `1px solid ${RARITY_COLORS[removeBadge.rarity] || '#4F5568'}44`, borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {removeBadge.img ? <img src={removeBadge.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20 }}>🏅</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{removeBadge.name}</div>
                      <div style={{ fontSize: 10, color: RARITY_COLORS[removeBadge.rarity] || '#6b7280', fontWeight: 700 }}>{removeBadge.rarity} · {SUBCATEGORY_LABELS[removeBadge.subcategory] || removeBadge.category}</div>
                    </div>
                    <button onClick={() => setRemoveBadge(null)} style={{ background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 5, color: '#9CA3AF', cursor: 'pointer', fontSize: 10, padding: '4px 10px', fontWeight: 700 }}>Change</button>
                  </div>
                ) : (
                  <BadgeSearchDropdown badges={manageUserBadges} selected={removeBadge} onSelect={setRemoveBadge} />
                )}
              </div>
            )}

            {/* Confirmation + action */}
            {manageMode === 'award' && manageUser && awardBadge && (
              <div style={{ background: 'rgba(59,130,246,.06)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>
                Award <strong style={{ color: RARITY_COLORS[awardBadge.rarity] || '#fff' }}>"{awardBadge.name}"</strong> to <strong style={{ color: '#fff' }}>{manageUser.displayName || manageUser.username}</strong>?
              </div>
            )}
            {manageMode === 'remove' && manageUser && removeBadge && (
              <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#9CA3AF' }}>
                Remove <strong style={{ color: RARITY_COLORS[removeBadge.rarity] || '#fff' }}>"{removeBadge.name}"</strong> from <strong style={{ color: '#fff' }}>{manageUser.displayName || manageUser.username}</strong>?
              </div>
            )}

            {manageMode === 'award'
              ? <ActionBtn label={saving ? 'Awarding…' : 'Award Badge'} color={manageUser && awardBadge ? '#3b82f6' : '#374151'} onClick={handleAward} />
              : <ActionBtn label={saving ? 'Removing…' : 'Remove Badge'} color={manageUser && removeBadge ? '#f59e0b' : '#374151'} onClick={handleRevoke} />
            }
          </div>
        </Modal>
      )}

    </div>
  )
}
