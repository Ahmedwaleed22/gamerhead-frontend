'use client'

import { useState } from 'react'
import { Icon } from '@iconify/react'
import { useApi, useMutation } from '@/lib/use-api'
import { invitesApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'
import { EmojiSolar, Solar } from '@/lib/solar-duotone'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

type InviteType = 'Wager' | 'Tournament' | 'XP'

const TYPE_STYLE: Record<InviteType, { bg: string; bdr: string; color: string }> = {
  Wager:      { bg: 'rgba(240,192,64,0.1)',  bdr: 'rgba(240,192,64,0.3)',  color: '#F0C040' },
  Tournament: { bg: 'rgba(178,45,45,0.1)',   bdr: 'rgba(178,45,45,0.3)',   color: '#ff8080' },
  XP:         { bg: 'rgba(167,139,250,0.1)', bdr: 'rgba(167,139,250,0.3)', color: '#A78BFA' },
}

function TypeBadge({ type }: { type: string }) {
  const s = TYPE_STYLE[type as InviteType] || TYPE_STYLE.XP
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 5, padding: '2px 9px', ...R, fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {type}
    </span>
  )
}

// Detail modal shown when clicking an invite row
function InviteDetailModal({ invite, onClose, onRespond }: { invite: any; onClose: () => void; onRespond: (action: 'accepted' | 'declined') => Promise<void> }) {
  const [acting, setActing] = useState(false)

  async function respond(action: 'accepted' | 'declined') {
    setActing(true)
    try { await onRespond(action) } finally { setActing(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 520, padding: '32px 36px', border: '1px solid #25252C' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: '#25252C', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {invite.logo && String(invite.logo).startsWith('http') ? (
              <img src={invite.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
            ) : (
              <EmojiSolar emoji={invite.logo || '🎮'} size={36} inline={false} />
            )}
          </div>
          <div>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 24, color: '#fff' }}>{invite.team}</div>
            <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Invited by {invite.leader}</div>
          </div>
        </div>
        <div style={{ height: 1, background: '#25252C', marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Game',     value: invite.game                   },
            { label: 'Mode',     value: invite.mode                   },
            { label: 'Members',  value: `${invite.members} players`   },
            { label: 'Type',     value: invite.type                   },
            { label: 'Leader',   value: invite.leader                 },
            { label: 'Received', value: invite.received               },
          ].map((s, i) => (
            <div key={i} style={{ background: '#0C0C11', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ ...R, fontSize: 11, color: '#4A5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              {s.label === 'Type'
                ? <TypeBadge type={s.value} />
                : <div style={{ ...R, fontWeight: 700, fontSize: 14, color: '#fff' }}>{s.value}</div>
              }
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => respond('accepted')} disabled={acting} style={{ flex: 1, background: '#B22D2D', border: 'none', borderRadius: 10, padding: '13px 0', ...R, fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', boxShadow: '0 0 16px rgba(178,45,45,0.25)' }}>
            {acting ? 'Accepting...' : 'Accept Invite'}
          </button>
          <button onClick={() => respond('declined')} disabled={acting} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '13px 22px', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function InvitesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selected,   setSelected]   = useState<any>(null)

  const { data: rawInvites, loading } = useApi(() => invitesApi.getMyInvites(), [refreshKey])
  const { data: countData }           = useApi(() => invitesApi.getCount(),     [refreshKey])

  const { mutate: respond } = useMutation(({ id, action }: { id: string; action: 'accepted' | 'declined' }) =>
    invitesApi.respond(id, action)
  )

  const invites     = (rawInvites as any[]) || []
  const inviteCount = (countData as any)?.count || 0
  const refresh     = () => setRefreshKey(k => k + 1)

  async function handleRespond(invite: any, action: 'accepted' | 'declined') {
    await respond({ id: invite._id || invite.id, action })
    setSelected(null)
    refresh()
  }

  return (
    <div style={{ background: '#0C0C11', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1440, padding: '0 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, alignItems: 'start' }}>
          <DashSidebar active="invites" inviteCount={inviteCount} />

          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', margin: 0 }}>Team Invites</h1>
              <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Review and respond to team invitations</div>
            </div>

            {/* Pending invites card */}
            <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 15, background: '#B22D2D', borderRadius: 2 }} />
                <span style={{ ...R, fontWeight: 700, fontSize: 14, color: '#fff' }}>Pending Invites</span>
                <span style={{ background: '#B22D2D', borderRadius: 5, padding: '1px 8px', ...R, fontWeight: 700, fontSize: 11, color: '#fff', marginLeft: 4 }}>
                  {loading ? '...' : invites.length}
                </span>
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2].map(i => <div key={i} style={{ height: 76, background: '#25252C', borderRadius: 10, opacity: 0.5 }} />)}
                </div>
              )}

              {/* Empty */}
              {!loading && invites.length === 0 && (
                <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
                    <Icon icon={Solar.letter} width={40} height={40} style={{ opacity: 0.85 }} />
                  </div>
                  <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>No pending invites</div>
                  <div style={{ ...R, fontSize: 13, color: '#4A5568' }}>You're all caught up! Check back later.</div>
                </div>
              )}

              {/* Invite rows */}
              {!loading && invites.length > 0 && (
                <div style={{ padding: '8px 0' }}>
                  {invites.map((inv: any, i: number) => (
                    <div key={inv._id || inv.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < invites.length - 1 ? '1px solid #25252C' : 'none', cursor: 'pointer', transition: 'background .12s' }}
                      onClick={() => setSelected(inv)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      {/* Team logo */}
                      <div style={{ width: 52, height: 52, background: '#25252C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {inv.logo && String(inv.logo).startsWith('http') ? (
                          <img src={inv.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <EmojiSolar emoji={inv.logo || '🎮'} size={28} inline={false} />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 5 }}>{inv.team}</div>
                        <div style={{ marginBottom: 5 }}><TypeBadge type={inv.type} /></div>
                        <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>
                          {inv.game} · {inv.mode} · {inv.members} members · Invited by <strong style={{ color: '#cbd5e1' }}>{inv.leader}</strong> · {inv.received}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); handleRespond(inv, 'accepted') }}
                          style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '10px 24px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', boxShadow: '0 0 12px rgba(178,45,45,0.3)' }}>
                          Accept
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleRespond(inv, 'declined') }}
                          style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 22px', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expired / past invites could go here in future */}
          </div>
        </div>
      </div>

      {selected && (
        <InviteDetailModal
          invite={selected}
          onClose={() => setSelected(null)}
          onRespond={(action) => handleRespond(selected, action)}
        />
      )}
    </div>
  )
}