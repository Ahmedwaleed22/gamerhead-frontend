'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApi, useMutation } from '@/lib/use-api'
import { teamsApi, invitesApi, usersApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import DashSidebar from '@/app/components/DashSidebar'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

const GAME_COLORS: Record<string, string> = {
  'call-of-duty': '#4A9EFF', fortnite: '#7B68EE', 'fifa-ea-fc': '#22C55E',
  warzone: '#FF6B35', 'rocket-league': '#A855F7', 'apex-legends': '#EF4444',
  valorant: '#FF4655', minecraft: '#84CC16', 'nba-2k': '#F97316',
  'madden-nfl': '#16A34A', ufc: '#DC2626', 'street-fighter': '#EAB308',
}

// ─── MANAGE TEAM MODAL ────────────────────────────────────────────────────────
function ManageTeamModal({ team, user, onClose, onUpdated }: { team: any; user: any; onClose: () => void; onUpdated: () => void }) {
  const [tab, setTab]               = useState<'overview' | 'members' | 'socials' | 'appearance'>('overview')
  const [bio, setBio]               = useState(team.bio || '')
  const [recruiting, setRecruiting] = useState(team.isRecruiting || false)
  const [socialUrls, setSocialUrls] = useState({
    twitchUrl:  team.twitchUrl  || '',
    twitterUrl: team.twitterUrl || '',
    youtubeUrl: team.youtubeUrl || '',
    discordUrl: team.discordUrl || '',
  })
  const [inviteQ, setInviteQ]       = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [inviteMsg, setInviteMsg]   = useState<{ text: string; ok: boolean } | null>(null)
  const [logoPreview, setLogoPreview]     = useState<string | null>(team.logoUrl || null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(team.bannerUrl || null)
  const [logoChanged, setLogoChanged]     = useState(false)
  const [bannerChanged, setBannerChanged] = useState(false)

  const { mutate: updateTeam, loading: saving } = useMutation((dto: any) => teamsApi.update(team._id, dto))
  const { mutate: kickPlayer }                   = useMutation(({ memberId }: any) => teamsApi.removeMember(team._id, memberId))
  const { mutate: sendInvite, loading: inviting } = useMutation((dto: any) => invitesApi.send(dto))

  async function saveOverview() {
    await updateTeam({ bio, isRecruiting: recruiting })
    onUpdated()
  }

  async function handleKick(memberId: string, username: string) {
    if (!confirm(`Remove ${username} from the team?`)) return
    await kickPlayer({ memberId })
    onUpdated()
  }

  async function searchPlayers() {
    if (!inviteQ.trim()) return
    try {
      const res = await usersApi.search(inviteQ.trim())
      setSearchResults(Array.isArray(res) ? res : res?.users || [])
    } catch { setSearchResults([]) }
  }

  async function handleInvite(targetUser: any) {
    setInviteMsg(null)
    try {
      await sendInvite({
        teamId:      team._id,
        recipientId: targetUser._id || targetUser.id,
        game:        team.game || team.gameSlug || '',
        mode:        team.ladder || team.format || 'Solo',
        members:     team.maxMembers || 1,
        type:        team.matchType === 'cash' ? 'Wager' : 'XP',
      })
      setInviteMsg({ text: `Invite sent to ${targetUser.username}!`, ok: true })
      setSearchResults([])
      setInviteQ('')
    } catch (e: any) {
      setInviteMsg({ text: e?.message || 'Failed to send invite', ok: false })
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (type === 'logo') { setLogoPreview(dataUrl); setLogoChanged(true) }
      else { setBannerPreview(dataUrl); setBannerChanged(true) }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function saveAppearance() {
    const updates: any = {}
    if (logoChanged) updates.logoUrl = logoPreview || ''
    if (bannerChanged) updates.bannerUrl = bannerPreview || ''
    if (Object.keys(updates).length === 0) return
    await updateTeam(updates)
    setLogoChanged(false)
    setBannerChanged(false)
    onUpdated()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 580, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh', overflow: 'auto', border: '1px solid #25252C' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#25252C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden' }}>
              {(team.logoUrl || team.bannerUrl) && ((team.logoUrl || team.bannerUrl).startsWith('http') || (team.logoUrl || team.bannerUrl).startsWith('/') || (team.logoUrl || team.bannerUrl).startsWith('data:image'))
                ? <img src={team.logoUrl || team.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                : (team.emoji ? <Icon icon={Solar.shield} width={20} height={20} /> : team.name?.charAt(0).toUpperCase() || 'T')}
            </div>
            <div>
              <div style={{ ...R, fontWeight: 700, fontSize: 16, color: '#fff' }}>{team.name}</div>
              <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Manage Team</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: '#25252C', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><Icon icon={Solar.close} width={16} height={16} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #25252C' }}>
          {(['overview', 'members', 'socials', 'appearance'] as const).map(k => (
            <button key={k} onClick={() => setTab(k as any)} style={{ flex: 1, padding: '12px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === k ? '#B22D2D' : 'transparent'}`, ...R, fontWeight: 600, fontSize: 12, color: tab === k ? '#fff' : '#9CA3AF', cursor: 'pointer', textTransform: 'capitalize' }}>{k}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Team Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a short team bio..." rows={4}
                  style={{ width: '100%', background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#fff', ...R, fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#25252C', borderRadius: 10, padding: '14px 16px' }}>
                <div>
                  <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 2 }}>Recruiting Members</div>
                  <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Show recruiting tag on your team profile</div>
                </div>
                <button onClick={() => setRecruiting(!recruiting)} style={{ width: 42, height: 24, borderRadius: 12, background: recruiting ? '#B22D2D' : 'rgba(255,255,255,0.1)', border: `1px solid ${recruiting ? '#B22D2D' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: recruiting ? 22 : 4, transition: 'left .2s' }} />
                </button>
              </div>
              <button onClick={saveOverview} disabled={saving} style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', width: '100%' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Invite search */}
              <div>
                <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Invite a Player</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={inviteQ} onChange={e => setInviteQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchPlayers()}
                    placeholder="Search by username..." style={{ flex: 1, background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#fff', ...R, fontSize: 12, outline: 'none' }} />
                  <button onClick={searchPlayers} style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '9px 18px', ...R, fontWeight: 700, fontSize: 12, color: '#fff', cursor: 'pointer' }}>Search</button>
                </div>
                {inviteMsg && (
                  <div style={{ ...R, fontSize: 12, marginTop: 6, color: inviteMsg.ok ? '#4ade80' : '#E74C3C' }}>{inviteMsg.text}</div>
                )}
                {searchResults.length > 0 && (
                  <div style={{ background: '#25252C', borderRadius: 8, marginTop: 6, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    {searchResults.slice(0, 5).map((u: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <div style={{ width: 30, height: 30, background: '#1C1C22', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', ...R, fontWeight: 700, fontSize: 12, color: '#9CA3AF' }}>
                          {u.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ ...R, fontSize: 13, color: '#fff', flex: 1 }}>{u.username}</span>
                        <button onClick={() => handleInvite(u)} disabled={inviting} style={{ background: 'rgba(178,45,45,0.12)', border: '1px solid rgba(178,45,45,0.3)', borderRadius: 6, padding: '5px 14px', ...R, fontWeight: 700, fontSize: 11, color: '#ff8080', cursor: 'pointer' }}>
                          {inviting ? '...' : 'Invite'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Member list */}
              <div style={{ ...R, fontWeight: 700, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Current Members ({team.roster?.length || 0}/{team.maxMembers})
              </div>
              {(team.roster || []).map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#25252C', borderRadius: 10, padding: '11px 14px' }}>
                  <div style={{ width: 34, height: 34, background: (m.color || '#E74C3C') + '22', border: `1.5px solid ${m.color || '#E74C3C'}55`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', ...R, fontWeight: 700, fontSize: 12, color: m.color || '#E74C3C', overflow: 'hidden' }}>
                    {m.avatarUrl && (m.avatarUrl.startsWith('http') || m.avatarUrl.startsWith('/') || m.avatarUrl.startsWith('data:image'))
                      ? <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                      : (m.initials || m.username?.slice(0, 2).toUpperCase())}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: m.color || '#fff' }}>{m.username}</div>
                    <div style={{ ...R, fontSize: 10, color: '#4A5568' }}>{m.role}</div>
                  </div>
                  {m.username !== user?.username && m.role !== 'Captain' && m.role !== 'Leader' && (
                    <button onClick={() => handleKick(m.userId, m.username)} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#E74C3C', cursor: 'pointer' }}>Kick</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SOCIALS */}
          {tab === 'socials' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'twitchUrl',  label: 'Twitch',     color: '#9146FF', placeholder: 'https://twitch.tv/yourteam',    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg> },
                { key: 'twitterUrl', label: 'X / Twitter', color: '#fff',    placeholder: 'https://x.com/yourteam',        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { key: 'youtubeUrl', label: 'YouTube',     color: '#FF0000', placeholder: 'https://youtube.com/@yourteam', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
                { key: 'discordUrl', label: 'Discord',     color: '#5865F2', placeholder: 'https://discord.gg/invite',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg> },
              ].map(s => (
                <div key={s.key}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, ...R, fontSize: 11, color: '#9CA3AF', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <span style={{ color: s.color }}>{s.icon}</span>{s.label}
                  </label>
                  <input
                    value={(socialUrls as any)[s.key]}
                    onChange={e => setSocialUrls({ ...socialUrls, [s.key]: e.target.value })}
                    placeholder={s.placeholder}
                    style={{ width: '100%', background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#fff', ...R, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                onClick={async () => { await updateTeam(socialUrls); onUpdated() }}
                disabled={saving}
                style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', marginTop: 4 }}>
                {saving ? 'Saving...' : 'Save Socials'}
              </button>
            </div>
          )}

          {/* APPEARANCE */}
          {tab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Logo Upload */}
              <div style={{ background: '#25252C', borderRadius: 10, padding: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>Team Profile Picture</div>
                <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Upload a custom team logo (JPG, PNG, max 2MB)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, background: '#1C1C22', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden' }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#9CA3AF' }}>{team.name?.charAt(0).toUpperCase() || 'T'}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                      Upload Logo
                      <input type="file" accept="image/*" onChange={e => handleFileSelect(e, 'logo')} style={{ display: 'none' }} />
                    </label>
                    {logoPreview && (
                      <button onClick={() => { setLogoPreview(null); setLogoChanged(true) }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '9px 14px', ...R, fontWeight: 600, fontSize: 12, color: '#E74C3C', cursor: 'pointer' }}>Remove</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div style={{ background: '#25252C', borderRadius: 10, padding: '16px', border: `1px solid ${team.isPremiumTeam ? 'rgba(243,156,18,0.2)' : 'rgba(255,255,255,0.06)'}`, position: 'relative', overflow: 'hidden' }}>
                {!team.isPremiumTeam && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(12,12,17,0.75)', backdropFilter: 'blur(2px)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" fill="#6B7280"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#6B7280" strokeWidth="2" fill="none"/></svg>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>Premium Teams Only</div>
                    <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Upgrade to unlock custom banners</div>
                  </div>
                )}
                <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>Team Banner</div>
                <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Wide banner shown at top of team profile (1200x300px recommended)</div>
                <div style={{ height: 72, background: bannerPreview ? 'none' : 'linear-gradient(135deg, #1a1a2a, #25252C)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' }}>
                  {bannerPreview
                    ? <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ ...R, fontSize: 11, color: '#4A5568' }}>No banner uploaded</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                    Upload Banner
                    <input type="file" accept="image/*" onChange={e => handleFileSelect(e, 'banner')} style={{ display: 'none' }} />
                  </label>
                  {bannerPreview && (
                    <button onClick={() => { setBannerPreview(null); setBannerChanged(true) }} style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '9px 14px', ...R, fontWeight: 600, fontSize: 12, color: '#E74C3C', cursor: 'pointer' }}>Remove</button>
                  )}
                </div>
              </div>

              {/* Save Button */}
              {(logoChanged || bannerChanged) && (
                <button onClick={saveAppearance} disabled={saving} style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', width: '100%' }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LEAVE CONFIRM ────────────────────────────────────────────────────────────
function LeaveConfirmModal({ team, onClose, onLeft }: { team: any; onClose: () => void; onLeft: () => void }) {
  const { mutate: leaveTeam, loading } = useMutation(() => teamsApi.leave(team._id))
  async function handleLeave() {
    try { await leaveTeam(undefined); onLeft(); onClose() } catch { /* error handled by mutate */ }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 400, padding: '32px', border: '1px solid #25252C', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}><path d="M12 2L1 21h22L12 2z" fill="#F0AA1A"/><path d="M12 9v5" stroke="#0C0C11" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="#0C0C11"/></svg>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Leave {team.name}?</div>
        <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginBottom: 28, lineHeight: 1.6 }}>You'll be removed from the roster. The captain can re-invite you later.</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleLeave} disabled={loading} style={{ flex: 1, background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 700, fontSize: 13, color: '#E74C3C', cursor: 'pointer' }}>
            {loading ? 'Leaving...' : 'Leave Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DISBAND CONFIRM ──────────────────────────────────────────────────────────
function DisbandConfirmModal({ team, onClose, onDisbanded }: { team: any; onClose: () => void; onDisbanded: () => void }) {
  const { mutate: disbandTeam, loading } = useMutation(() => teamsApi.delete(team._id))
  const [confirmText, setConfirmText] = useState('')
  async function handleDisband() {
    try { await disbandTeam(undefined); onDisbanded(); onClose() } catch { /* error handled by mutate */ }
  }
  const confirmed = confirmText === team.name
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 440, padding: '32px', border: '1px solid #25252C', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" stroke="#E74C3C" strokeWidth="1.5" fill="none"/><path d="M10 11v6M14 11v6" stroke="#E74C3C" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#E74C3C', marginBottom: 8 }}>Disband {team.name}?</div>
        <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginBottom: 12, lineHeight: 1.6 }}>
          This action is <strong style={{ color: '#E74C3C' }}>permanent</strong>. All members will be removed from the team. The team will be deleted from the database.
        </div>
        <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 6, lineHeight: 1.5 }}>
          Player records (wins, losses, XP, ladder standings) are <strong style={{ color: '#4ade80' }}>NOT affected</strong>. Only team ladder standings will be removed.
        </div>
        <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
          Type <strong style={{ color: '#fff' }}>{team.name}</strong> to confirm:
        </div>
        <input
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder={team.name}
          style={{ width: '100%', background: '#25252C', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 12px', color: '#fff', ...R, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 20, textAlign: 'center' }}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '11px 0', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleDisband} disabled={!confirmed || loading} style={{ flex: 1, background: confirmed ? '#C0392B' : 'rgba(231,76,60,0.12)', border: `1px solid ${confirmed ? '#C0392B' : 'rgba(231,76,60,0.35)'}`, borderRadius: 8, padding: '11px 0', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: confirmed ? 'pointer' : 'not-allowed', opacity: confirmed ? 1 : 0.5 }}>
            {loading ? 'Disbanding...' : 'Disband Team'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MyTeamsPage() {
  const { user } = useAuth()
  const [expanded,       setExpanded]       = useState<string | null>(null)
  const [managingTeam,   setManagingTeam]   = useState<any>(null)
  const [leavingTeam,    setLeavingTeam]    = useState<any>(null)
  const [disbandingTeam, setDisbandingTeam] = useState<any>(null)
  const [refreshKey,     setRefreshKey]     = useState(0)

  // refreshKey in deps array — now triggers a real re-fetch after create/leave
  const { data: teams, loading }  = useApi(() => teamsApi.getMine(), [refreshKey])
  const { data: inviteData }      = useApi(() => invitesApi.getCount())

  const inviteCount = (inviteData as any)?.count || 0
  const myTeams     = (teams as any[]) || []
  const refresh     = () => setRefreshKey(k => k + 1)

  return (
    <div style={{ background: '#0C0C11', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1440, padding: '0 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, alignItems: 'start' }}>
          <DashSidebar active="teams" inviteCount={inviteCount} />

          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', margin: 0 }}>My Teams</h1>
                <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>All teams you are currently a member of</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/invites" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#18181C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '11px 20px', textDecoration: 'none' }}>
                  <span style={{ ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF' }}>Pending Invites</span>
                  {inviteCount > 0 && <span style={{ background: '#B22D2D', borderRadius: 5, padding: '1px 8px', ...R, fontWeight: 700, fontSize: 11, color: '#fff' }}>{inviteCount}</span>}
                </Link>
              </div>
            </div>

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[1, 2].map(i => (
                  <div key={i} style={{ background: '#18181C', borderRadius: 12, height: 100, border: '1px solid rgba(255,255,255,0.04)', opacity: 0.5 }} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && myTeams.length === 0 && (
              <div style={{ background: '#18181C', borderRadius: 12, padding: '60px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}><path d="M6 11h4V7H6v4zm8 0h4V7h-4v4zM2 19h20V5a2 2 0 00-2-2H4a2 2 0 00-2 2v14zm4-2a1 1 0 110-2 1 1 0 010 2zm12 0a1 1 0 110-2 1 1 0 010 2zm-4 2h-4l-1 3h6l-1-3z" fill="#4A5568"/></svg>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 8 }}>No Teams Yet</div>
                <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Browse games and create a team from a ladder to start competing.</div>
                <Link href="/games" style={{ display: 'inline-block', background: '#B22D2D', border: 'none', borderRadius: 10, padding: '12px 28px', ...R, fontWeight: 700, fontSize: 14, color: '#fff', textDecoration: 'none' }}>
                  Browse Games
                </Link>
              </div>
            )}

            {/* Team cards */}
            {!loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myTeams.map((team: any) => {
                  const isOpen   = expanded === team._id
                  const gColor   = GAME_COLORS[team.gameSlug] || '#9CA3AF'
                  const total    = (team.wins || 0) + (team.losses || 0)
                  const winRate  = total === 0 ? 0 : Math.round((team.wins / total) * 100)
                  const myEntry  = team.roster?.find((r: any) => r.userId?.toString() === user?.id)
                  const myRole   = myEntry?.role || 'Member'
                  const isCapt   = myRole === 'Leader' || myRole === 'Captain'
                  const isCash   = team.matchType === 'cash'
                  const roleColor = myRole === 'Leader' ? '#F39C12' : myRole === 'Captain' ? '#E74C3C' : '#9CA3AF'
                  const roleBg    = myRole === 'Leader' ? 'rgba(243,156,18,0.12)' : myRole === 'Captain' ? 'rgba(178,45,45,0.12)' : 'rgba(255,255,255,0.05)'
                  const roleBdr   = myRole === 'Leader' ? 'rgba(243,156,18,0.3)' : myRole === 'Captain' ? 'rgba(178,45,45,0.35)' : 'rgba(255,255,255,0.1)'

                  return (
                    <div key={team._id} style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                      {/* Team row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : team._id)}>
                        <div style={{ width: 56, height: 56, background: '#25252C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          {(team.logoUrl || team.bannerUrl) && ((team.logoUrl || team.bannerUrl).startsWith('http') || (team.logoUrl || team.bannerUrl).startsWith('/') || (team.logoUrl || team.bannerUrl).startsWith('data:image'))
                            ? <img src={team.logoUrl || team.bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                            : (team.emoji ? <Icon icon={Solar.shield} width={26} height={26} /> : team.name?.charAt(0).toUpperCase() || 'T')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#fff' }}>{team.name}</div>
                            <span style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 4, padding: '3px 9px', ...R, fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>ID-{team._id?.toString().slice(-8).toUpperCase()}</span>
                            <span style={{ background: roleBg, border: `1px solid ${roleBdr}`, borderRadius: 4, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 11, color: roleColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>{myRole}</span>
                            {team.tournamentId ? (
                              <span style={{ background: 'rgba(240,192,64,0.12)', border: '1px solid rgba(240,192,64,0.3)', borderRadius: 4, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 11, color: '#f0c040', letterSpacing: 0.4, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill="currentColor"/><path d="M8 4h8v6a4 4 0 01-8 0V4z" fill="currentColor"/><rect x="10" y="14" width="4" height="4" fill="currentColor"/><rect x="7" y="18" width="10" height="3" rx="1" fill="currentColor"/></svg> Tournament
                              </span>
                            ) : (
                              <span style={{ background: isCash ? 'rgba(212,146,10,0.12)' : 'rgba(124,58,237,0.12)', border: `1px solid ${isCash ? 'rgba(212,146,10,0.3)' : 'rgba(124,58,237,0.3)'}`, borderRadius: 4, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 11, color: isCash ? '#F0AA1A' : '#A78BFA', letterSpacing: 0.4 }}>
                                {isCash ? '$ Cash' : 'XP'}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span style={{ background: gColor + '18', border: `1px solid ${gColor}44`, borderRadius: 4, padding: '3px 9px', ...R, fontSize: 11, color: gColor, fontWeight: 600 }}>{team.game}</span>
                            <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '3px 9px', ...R, fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{team.ladder}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                          {[
                            { label: 'Wins',     value: team.wins || 0,   color: '#4ade80' },
                            { label: 'Losses',   value: team.losses || 0, color: '#E74C3C' },
                            { label: 'Win Rate', value: `${winRate}%`,    color: '#F39C12' },
                            { label: 'Members',  value: `${team.roster?.length || 1}/${team.maxMembers}`, color: '#9CA3AF' },
                          ].map((s, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                              <div style={{ ...R, fontWeight: 800, fontSize: 18, color: s.color, lineHeight: 1 }}>{s.value}</div>
                              <div style={{ ...R, fontSize: 10, color: '#4A5568', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                          <Link href={`/teams/${team.slug}`} onClick={e => e.stopPropagation()}
                            style={{ background: '#B22D2D', borderRadius: 8, padding: '9px 18px', textDecoration: 'none', ...R, fontWeight: 700, fontSize: 12, color: '#fff' }}>
                            View Team
                          </Link>
                          <div style={{ width: 36, height: 36, background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 14, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                        </div>
                      </div>

                      {/* Expanded */}
                      {isOpen && (
                        <div style={{ borderTop: '1px solid #25252C', padding: '18px 24px' }}>
                          <div style={{ ...R, fontWeight: 700, fontSize: 12, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>Team Members</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {(team.roster || []).map((m: any, i: number) => {
                              const mColor  = m.color || '#E74C3C'
                              const mRole   = m.role || 'Member'
                              const mRoleColor = mRole === 'Leader' ? '#F39C12' : mRole === 'Captain' ? '#E74C3C' : '#6B7280'
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < team.roster.length - 1 ? '1px solid #25252C' : 'none' }}>
                                  <div style={{ width: 36, height: 36, background: mColor + '22', border: `1.5px solid ${mColor}55`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', ...R, fontWeight: 700, fontSize: 13, color: mColor, overflow: 'hidden' }}>
                                    {m.avatarUrl && (m.avatarUrl.startsWith('http') || m.avatarUrl.startsWith('/') || m.avatarUrl.startsWith('data:image'))
                                      ? <img src={m.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                                      : (m.initials || m.username?.slice(0, 2).toUpperCase())}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: m.color || '#fff' }}>{m.username}</div>
                                    <div style={{ ...R, fontSize: 11, color: '#4A5568' }}>Joined {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'}</div>
                                  </div>
                                  <span style={{ background: mRoleColor + '18', border: `1px solid ${mRoleColor}44`, borderRadius: 4, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 10, color: mRoleColor, textTransform: 'uppercase', letterSpacing: 0.4 }}>{mRole}</span>
                                </div>
                              )
                            })}
                          </div>
                          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                            {isCapt && (
                              <button onClick={() => setManagingTeam(team)} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
                                Manage Team
                              </button>
                            )}
                            {myRole === 'Leader' && (
                              <button onClick={() => setDisbandingTeam(team)} style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#E74C3C', cursor: 'pointer', marginLeft: 'auto' }}>
                                Disband Team
                              </button>
                            )}
                            {!isCapt && (
                              <button onClick={() => setLeavingTeam(team)} style={{ background: 'transparent', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#E74C3C', cursor: 'pointer', marginLeft: myRole === 'Leader' ? '0' : 'auto' }}>
                                Leave Team
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {managingTeam   && <ManageTeamModal      team={managingTeam}   user={user} onClose={() => setManagingTeam(null)}   onUpdated={refresh} />}
      {leavingTeam    && <LeaveConfirmModal   team={leavingTeam}              onClose={() => setLeavingTeam(null)}    onLeft={refresh} />}
      {disbandingTeam && <DisbandConfirmModal team={disbandingTeam}           onClose={() => setDisbandingTeam(null)} onDisbanded={refresh} />}
    </div>
  )
}