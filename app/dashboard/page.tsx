'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { walletApi, teamsApi, invitesApi, badgesApi, levelRewardsApi, supportApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'
import CrateOpening from './components/CrateOpening'

const RARITY_COLORS: Record<string, string> = {
  Common: '#9CA3AF', Rare: '#3498DB', Epic: '#9B59B6', Legendary: '#F39C12',
}

const SIG_HISTORY = [
  { buyer: 'Joao Pedro Santos', date: '26/04/2022', value: '$45.00' },
  { buyer: 'Joao Pedro Santos', date: '22/04/2022', value: '$45.00' },
]

const DEFAULT_TICKET_STATS = [
  { label: 'Open Tickets',        value: 0, color: '#E74C3C' },
  { label: 'Tickets in Progress', value: 0, color: '#F39C12' },
  { label: 'Tickets Completed',   value: 0, color: '#4ade80' },
]

// ─── HELPERS ────────────────────────────────────────────
const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

function CardWrap({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', ...style }}>{children}</div>
}

function SectionLabel({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 15, background: '#B22D2D', borderRadius: 2, flexShrink: 0 }} />
        <span style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{title}</span>
      </div>
      {action}
    </div>
  )
}

function PremiumTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    function calc() {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m remaining` : `${h}h ${m}m remaining`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [expiresAt])

  return (
    <div style={{ ...R, fontSize: 11, color: '#F0AA1A', marginTop: 4, fontWeight: 600 }}>
      {timeLeft}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'invites' | 'teams'>('invites')
  const [invites,   setInvites]   = useState<any[]>([])
  const [teams,     setTeams]     = useState<any[]>([])
  const [txHistory, setTxHistory] = useState<any[]>([])
  const [balance,   setBalance]   = useState<any>(null)
  const [inviteCount, setInviteCount] = useState(0)
  const [recentBadges, setRecentBadges] = useState<any[]>([])
  const [levelRewards, setLevelRewards] = useState<any[]>([])
  const [crateAnim, setCrateAnim]       = useState<{ items: any[]; wonItem: any; label: string } | null>(null)
  const [claiming, setClaiming]         = useState<string | null>(null)
  const [ticketStats, setTicketStats]   = useState(DEFAULT_TICKET_STATS)

  useEffect(() => {
    walletApi.getBalance().then(setBalance).catch(() => {})
    walletApi.getTransactions({ limit: 4 }).then((res: any) => {
      const list = res?.transactions || res?.data || res
      setTxHistory(Array.isArray(list) ? list : [])
    }).catch(() => {})
    teamsApi.getMine().then((res: any) => setTeams(Array.isArray(res) ? res : res.teams || [])).catch(() => {})
    badgesApi.getMyRecent(5).then((res: any) => setRecentBadges(Array.isArray(res) ? res : [])).catch(() => {})
    invitesApi.getMyInvites().then((res: any) => {
      const list = Array.isArray(res) ? res : res.invites || []
      setInvites(list)
      setInviteCount(list.length)
    }).catch(() => {})
    levelRewardsApi.getMine().then((res: any) => setLevelRewards(Array.isArray(res) ? res : [])).catch(() => {})
    supportApi.getMine().then((res: any) => {
      const tickets = Array.isArray(res) ? res : []
      setTicketStats([
        { label: 'Open Tickets',        value: tickets.filter((t: any) => t.status === 'open').length,    color: '#E74C3C' },
        { label: 'Tickets in Progress', value: tickets.filter((t: any) => t.status === 'claimed').length, color: '#F39C12' },
        { label: 'Tickets Completed',   value: tickets.filter((t: any) => t.status === 'closed').length,  color: '#4ade80' },
      ])
    }).catch(() => {})
  }, [])

  const handleClaimReward = async (reward: any) => {
    const rewardId = reward._id || reward.id
    setClaiming(rewardId)
    try {
      // For crate rewards, fetch pool for animation before claiming
      if (reward.rewardType === 'crate') {
        const pool = await levelRewardsApi.getCratePool(reward.rewardData?.crateType).catch(() => [])
        const claimed = await levelRewardsApi.claim(rewardId)
        const items = Array.isArray(pool) ? pool : []
        const wonItem = claimed.crateResult || { label: 'Nothing', type: 'nothing' }
        setCrateAnim({ items, wonItem, label: reward.rewardLabel })
        setLevelRewards(prev => prev.map(r => (r._id || r.id) === rewardId ? claimed : r))
      } else {
        const claimed = await levelRewardsApi.claim(rewardId)
        setLevelRewards(prev => prev.map(r => (r._id || r.id) === rewardId ? claimed : r))
      }
    } catch {}
    setClaiming(null)
  }

  const handleInviteResponse = async (id: string, action: 'accepted' | 'declined') => {
    try {
      await invitesApi.respond(id, action)
      setInvites(prev => prev.filter((inv: any) => (inv._id || inv.id) !== id))
      setInviteCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  if (!user) return null

  const initials      = user.username?.slice(0, 2).toUpperCase() || '??'
  const accentColor   = user.usernameColor || '#E74C3C'
  const cashDisplay   = balance ? `$${((balance.cashBalance ?? balance.cash ?? 0) / 100).toFixed(2)}` : `$${(user.cashBalance / 100).toFixed(2)}`
  const creditsDisplay= balance?.credits ?? user.credits ?? 0

  return (
    <div style={{ background: '#0C0C11', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1440, padding: '0 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, alignItems: 'start' }}>

          <DashSidebar active="dashboard" inviteCount={inviteCount} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── ROW 1: Profile · Prime · Ticket Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 270px', gap: 20 }}>

              {/* Profile Card */}
              <CardWrap>
                <div style={{ height: 130, background: 'linear-gradient(135deg,#150a12 0%,#2a0d1a 55%,#1a1a2e 100%)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(178,45,45,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(178,45,45,0.07) 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
                  <div style={{ position: 'absolute', right: 14, bottom: -18, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 130, color: 'rgba(178,45,45,0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{initials}</div>
                </div>
                <div style={{ padding: '0 20px 18px' }}>
                  <div style={{ position: 'relative', width: 80, height: 80, marginTop: -40, background: accentColor, border: '3px solid #18181C', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${accentColor}73` }}>
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 30, color: '#fff' }}>{initials}</span>
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, background: '#27AE60', border: '2px solid #18181C', borderRadius: '50%' }} />
                    <div style={{ position: 'absolute', bottom: -8, right: -8, width: 26, height: 26, background: accentColor, border: '2px solid #18181C', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ ...R, fontWeight: 700, fontSize: 11, color: '#fff' }}>{user.level}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div style={{ ...R, fontWeight: 700, fontSize: 17, color: accentColor }}>{user.username}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M4 4V21" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M4 4H17L14 8.5L17 13H4" fill="#E74C3C" stroke="#E74C3C" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <div style={{ ...R, fontSize: 12, color: '#fff', fontWeight: 600 }}>{(user as any).country || 'Not set'}</div>
                        {(user as any).state && <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>{(user as any).state}</div>}
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ height: 1, background: '#25252C', margin: '0 20px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: '14px 20px 18px' }}>
                  {[
                    { label: 'My Teams',    value: `${teams.length} teams` },
                    { label: 'Global Rank', value: '#—'                      },
                    { label: 'Premium',     value: user.isPremium ? '★ Active' : 'None' },
                  ].map((s, i) => (
                    <div key={i} style={{ borderRight: i < 2 ? '1px solid #25252C' : 'none', paddingRight: i < 2 ? 12 : 0, paddingLeft: i > 0 ? 12 : 0 }}>
                      <div style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>{s.label}</div>
                      <div style={{ ...R, fontWeight: 700, fontSize: 14, color: i === 2 && !user.isPremium ? '#4A5568' : '#E74C3C', marginTop: 3 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </CardWrap>

              {/* Premium Card */}
              <CardWrap>
                <div style={{ padding: '22px 26px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: '#B22D2D', borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(178,45,45,0.4)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="2" y="4" width="14" height="11" rx="2" fill="white" fillOpacity="0.3"/>
                        <path d="M2 19.5L8 15.5H22V21.5H2V19.5Z" fill="white"/>
                        <path d="M18 8.5H22V15.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ ...R, fontWeight: 700, fontSize: 16, color: '#fff' }}>
                        {user.isPremium ? 'You are Premium' : 'You are not Premium'}
                      </div>
                      <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                        {user.isPremium ? 'Premium features unlocked' : 'Unlock premium features & perks'}
                      </div>
                      {user.isPremium && user.premiumExpiresAt && (
                        <PremiumTimer expiresAt={user.premiumExpiresAt} />
                      )}
                    </div>
                  </div>
                  <div style={{ height: 1, background: '#25252C', marginBottom: 16 }} />
                  <div style={{ ...R, fontSize: 12, color: '#C0C0C8', lineHeight: '20px', marginBottom: 18 }}>
                    {user.isPremium
                      ? 'You have an active subscription. Enjoy exclusive colors, free name changes, Double XP, and more.'
                      : <>You currently do not have an active subscription.<br/>Get Premium for exclusive colors, free name changes, Double XP, and more.</>
                    }
                  </div>
                  <Link href="/premium" style={{ display: 'block', background: '#B22D2D', borderRadius: 10, padding: '12px 0', textAlign: 'center', textDecoration: 'none' }}>
                    <span style={{ ...R, fontWeight: 700, fontSize: 12, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>KNOW OUR PLANS</span>
                  </Link>
                </div>
                <div style={{ padding: '18px 26px 22px' }}>
                  <div style={{ height: 1, background: '#25252C', marginBottom: 16 }} />
                  <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 12 }}>Subscription History</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 80px', gap: 6 }}>
                    {['Buyer','Date','Value'].map((h, i) => (
                      <span key={i} style={{ ...R, fontWeight: 700, fontSize: 10, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</span>
                    ))}
                    {SIG_HISTORY.map((s, i) => (
                      <div key={i} style={{ display: 'contents' }}>
                        <span style={{ ...R, fontSize: 12, color: '#9CA3AF', padding: '6px 0', borderTop: '1px solid #25252C' }}>{s.buyer}</span>
                        <span style={{ ...R, fontSize: 12, color: '#9CA3AF', padding: '6px 0', borderTop: '1px solid #25252C' }}>{s.date}</span>
                        <span style={{ ...R, fontWeight: 600, fontSize: 12, color: '#fff', padding: '6px 0', borderTop: '1px solid #25252C' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardWrap>

              {/* 3 Ticket Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ticketStats.map((t, i) => (
                  <Link key={i} href="/support" style={{ background: '#18181C', borderRadius: 12, padding: '20px 22px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16, flex: 1, border: `1px solid ${t.color}18` }}>
                    <div style={{ width: 46, height: 46, background: t.color + '18', border: `1px solid ${t.color}44`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <rect x="2" y="3.5" width="13" height="10" rx="2" fill={t.color} fillOpacity="0.4"/>
                        <path d="M2 18L7.5 14H20V20H2V18Z" fill={t.color}/>
                        <path d="M17 7.5H20V14" stroke={t.color} strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ ...R, fontSize: 12, color: '#9CA3AF' }}>{t.label}</div>
                      <div style={{ ...R, fontWeight: 800, fontSize: 30, color: '#fff', lineHeight: 1.1, marginTop: 2 }}>{t.value}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── ROW 2: Invites+Teams · Achievements · Credits ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '310px 1fr 270px', gap: 20 }}>

              {/* Invites / Teams tabs */}
              <CardWrap>
                <div style={{ display: 'flex', borderBottom: '1px solid #25252C' }}>
                  {(['invites', 'teams'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '13px 0', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #B22D2D' : '2px solid transparent', marginBottom: -1, ...R, fontWeight: 700, fontSize: 12, color: activeTab === tab ? '#fff' : '#9CA3AF', cursor: 'pointer', transition: 'color 0.15s' }}>
                      {tab === 'invites' ? `Invites (${invites.length})` : 'My Teams'}
                    </button>
                  ))}
                </div>
                <div style={{ padding: '6px 18px 16px' }}>
                  {activeTab === 'invites' && (
                    invites.length === 0
                      ? <div style={{ padding: '28px 0', textAlign: 'center', ...R, fontSize: 12, color: '#4A5568' }}>No pending invites</div>
                      : invites.map((inv: any, i: number) => {
                        const invId = inv._id || inv.id
                        return (
                          <div key={invId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < invites.length - 1 ? '1px solid #25252C' : 'none' }}>
                            <div style={{ width: 40, height: 40, background: '#25252C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{inv.teamEmoji || inv.logo || '🎮'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{inv.teamName || inv.team}</div>
                              <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{inv.game || ''} {inv.mode ? `· ${inv.mode}` : ''}</div>
                              <div style={{ ...R, fontSize: 10, color: '#4A5568', marginTop: 1 }}>Received: {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-US') : ''}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                              <button onClick={() => handleInviteResponse(invId, 'accepted')} style={{ padding: '6px 14px', background: '#B22D2D', border: 'none', borderRadius: 8, ...R, fontWeight: 700, fontSize: 11, color: '#fff', cursor: 'pointer' }}>Accept</button>
                              <button onClick={() => handleInviteResponse(invId, 'declined')} style={{ padding: '6px 14px', background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, ...R, fontWeight: 600, fontSize: 11, color: '#9CA3AF', cursor: 'pointer' }}>Refuse</button>
                            </div>
                          </div>
                        )
                      })
                  )}
                  {activeTab === 'teams' && (
                    teams.length === 0
                      ? <div style={{ padding: '28px 0', textAlign: 'center', ...R, fontSize: 12, color: '#4A5568' }}>No teams yet</div>
                      : teams.map((team: any, i: number) => {
                        const roleEntry = (team.roster || []).find((r: any) => r.userId?.toString() === user.id)
                        const role = roleEntry?.role || (team.captainId?.toString() === user.id ? 'Leader' : 'Member')
                        const memberCount = team.members?.length || team.memberCount || 0
                        return (
                          <div key={team._id || team.slug || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: i < teams.length - 1 ? '1px solid #25252C' : 'none' }}>
                            <div style={{ width: 40, height: 40, background: '#25252C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{team.emoji || team.gameEmoji || '🎮'}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{team.name}</div>
                              <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{team.game || team.gameSlug || ''} · {memberCount} members</div>
                            </div>
                            <span style={{ background: role === 'Leader' || role === 'Captain' ? 'rgba(243,156,18,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${role === 'Leader' || role === 'Captain' ? 'rgba(243,156,18,0.3)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 6, padding: '4px 9px', ...R, fontWeight: 700, fontSize: 10, color: role === 'Leader' || role === 'Captain' ? '#F39C12' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                              {role}
                            </span>
                          </div>
                        )
                      })
                  )}
                </div>
              </CardWrap>

              {/* Achievements */}
              <CardWrap>
                <SectionLabel title="Recent Achievements" action={<Link href={`/profile/${user.slug}?tab=Badges`} style={{ ...R, fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>See all →</Link>} />
                <div style={{ padding: '0 20px 18px' }}>
                  {recentBadges.length === 0 ? (
                    <div style={{ padding: '28px 0', textAlign: 'center', ...R, fontSize: 12, color: '#4A5568' }}>No badges earned yet — start competing!</div>
                  ) : (
                    recentBadges.map((b: any, i: number) => {
                      const rc = RARITY_COLORS[b.rarity] || '#9CA3AF'
                      return (
                        <div key={b._id || i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < recentBadges.length - 1 ? '1px solid #25252C' : 'none' }}>
                          <div style={{ width: 46, height: 46, background: `${rc}18`, border: `1px solid ${rc}44`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, overflow: 'hidden' }}>
                            {b.img ? (
                              <img src={b.img} alt={b.name} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e: any) => { e.target.style.display = 'none'; e.target.parentElement.textContent = b.name?.[0] || '?' }} />
                            ) : (
                              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: rc }}>{b.name?.[0] || '?'}</span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{b.name}</div>
                            <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{b.category === 'forum' ? 'Forum' : 'Platform'}</div>
                            {b.date && <div style={{ ...R, fontSize: 10, color: '#4A5568', marginTop: 1 }}>Earned: {b.date}</div>}
                          </div>
                          <div style={{ ...R, fontWeight: 700, fontSize: 12, color: rc, flexShrink: 0 }}>{b.rarity}</div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardWrap>

              {/* Credits */}
              <CardWrap>
                <SectionLabel title="Credits / Balances" action={<Link href="/wallet" style={{ ...R, fontSize: 11, color: '#9CA3AF', textDecoration: 'none' }}>View all →</Link>} />
                <div style={{ padding: '0 18px 18px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 50px', gap: 8, paddingBottom: 8, borderBottom: '1px solid #25252C' }}>
                    {['Transaction','Type','Amt'].map((h, i) => (
                      <span key={i} style={{ ...R, fontWeight: 700, fontSize: 10, color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</span>
                    ))}
                  </div>
                  {txHistory.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', ...R, fontSize: 12, color: '#4A5568' }}>No transactions yet</div>
                  ) : (
                    txHistory.slice(0, 4).map((c: any, i: number) => {
                      const isPositive = c.type === 'deposit' || c.type === 'match_win' || c.type === 'prize_claim' || (c.amount > 0)
                      const amt = c.amount != null ? (isPositive ? `+${c.amount}` : `${c.amount}`) : ''
                      return (
                        <div key={c._id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 52px 50px', gap: 8, padding: '10px 0', borderBottom: '1px solid #25252C' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 30, height: 30, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7, flexShrink: 0 }} />
                            <div>
                              <div style={{ ...R, fontWeight: 600, fontSize: 12, color: '#fff', lineHeight: 1.2 }}>{c.description || c.type}</div>
                              <div style={{ ...R, fontSize: 10, color: '#4A5568', marginTop: 2 }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : ''}</div>
                            </div>
                          </div>
                          <span style={{ ...R, fontSize: 11, color: '#9CA3AF', alignSelf: 'center' }}>{c.currency || 'Cash'}</span>
                          <span style={{ ...R, fontWeight: 700, fontSize: 13, color: isPositive ? '#4ade80' : '#E74C3C', alignSelf: 'center' }}>{amt}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardWrap>

            </div>

            {/* ── ROW 3: Level Rewards ── */}
            {levelRewards.length > 0 && (
              <CardWrap>
                <SectionLabel title="Level Rewards" />
                <div style={{ padding: '0 20px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {levelRewards.map((rw: any) => {
                    const id = rw._id || rw.id
                    const isClaimed = rw.status === 'claimed'
                    const isCrate = rw.rewardType === 'crate'
                    const isClaiming = claiming === id
                    const typeColor = isCrate ? '#9B59B6' : rw.rewardType === 'tokens' ? '#F0AA1A' : rw.rewardType === 'xpBoost' ? '#3498DB' : rw.rewardType === 'credit' ? '#4ade80' : '#9CA3AF'

                    return (
                      <div key={id} style={{
                        background: isClaimed ? '#111116' : '#1E1E24',
                        border: `1px solid ${isClaimed ? '#25252C' : typeColor + '44'}`,
                        borderRadius: 10, padding: '16px 14px',
                        opacity: isClaimed ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{
                            ...R, fontWeight: 800, fontSize: 11, color: typeColor,
                            letterSpacing: 0.5, textTransform: 'uppercase',
                          }}>
                            LVL {rw.level}
                          </span>
                          <span style={{
                            background: `${rw.track === 'premium' ? '#F0AA1A' : '#6B7280'}22`,
                            border: `1px solid ${rw.track === 'premium' ? '#F0AA1A' : '#6B7280'}44`,
                            borderRadius: 4, padding: '2px 6px',
                            ...R, fontWeight: 700, fontSize: 9, color: rw.track === 'premium' ? '#F0AA1A' : '#6B7280',
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}>
                            {rw.track}
                          </span>
                        </div>
                        <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 4, lineHeight: 1.3 }}>
                          {rw.rewardLabel}
                        </div>
                        {isClaimed && rw.crateResult && (
                          <div style={{ ...R, fontSize: 11, color: '#4ade80', marginBottom: 6 }}>
                            Won: {rw.crateResult.label}
                          </div>
                        )}
                        {!isClaimed ? (
                          <button
                            onClick={() => handleClaimReward(rw)}
                            disabled={isClaiming}
                            style={{
                              width: '100%', marginTop: 8, padding: '8px 0',
                              background: isClaiming ? '#333' : isCrate ? '#9B59B6' : '#B22D2D',
                              border: 'none', borderRadius: 8,
                              ...R, fontWeight: 700, fontSize: 11, color: '#fff',
                              cursor: isClaiming ? 'wait' : 'pointer',
                              letterSpacing: 0.5, textTransform: 'uppercase',
                            }}
                          >
                            {isClaiming ? 'Claiming...' : isCrate ? 'Open Crate' : 'Claim'}
                          </button>
                        ) : (
                          <div style={{
                            width: '100%', marginTop: 8, padding: '8px 0',
                            textAlign: 'center',
                            ...R, fontWeight: 600, fontSize: 11, color: '#4A5568',
                          }}>
                            Claimed
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardWrap>
            )}

          </div>
        </div>
      </div>

      {/* Crate opening overlay */}
      {crateAnim && (
        <CrateOpening
          items={crateAnim.items}
          wonItem={crateAnim.wonItem}
          onClose={() => setCrateAnim(null)}
          rewardLabel={crateAnim.label}
        />
      )}
    </div>
  )
}
