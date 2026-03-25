'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import ActionBtn from '../../components/ActionBtn'
import Modal from '../../components/Modal'
import { EmojiSolar } from '@/lib/solar-duotone'

const TABS = ['Overview', 'Wallet & Finance', 'Match History', 'Teams', 'Badges'] as const
type Tab = typeof TABS[number]

const ROLE_COLORS: Record<string, string> = { admin: '#e8000d', premium: '#f59e0b', coach: '#a855f7', member: '#8890A4' }

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 13, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6,
}
const cardStyle: React.CSSProperties = {
  background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20,
}

const badgeStyle = (color: string, bg?: string): React.CSSProperties => ({
  padding: '3px 10px', fontSize: 12, fontWeight: 800,
  background: bg || `${color}18`, border: `1px solid ${color}44`, borderRadius: 4,
  color, textTransform: 'uppercase', letterSpacing: .5, lineHeight: 1.3,
})

export default function AdminUserDetail() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Overview')

  // Action modals
  const [banModal, setBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [walletModal, setWalletModal] = useState(false)
  const [walletForm, setWalletForm] = useState({ currency: 'credits' as 'cash' | 'credits', amount: '', description: '' })
  const [roleModal, setRoleModal] = useState(false)
  const [newRole, setNewRole] = useState('')
  const [badgeModal, setBadgeModal] = useState(false)
  const [badgeSlug, setBadgeSlug] = useState('')
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', displayName: '', dateOfBirth: '', avatarUrl: '', bannerUrl: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUser(id)
      setData(res)
      setNewRole(res.user.role)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  if (loading) return <div style={{ fontSize: 16, color: '#4F5568', padding: 40 }}>Loading user...</div>
  if (!data) return <div style={{ fontSize: 16, color: '#e8000d', padding: 40 }}>User not found</div>

  const { user, transactions, teams, matches, badges, forumStats } = data
  const displayName = user.displayName || user.username

  const handleBan = async () => {
    try {
      if (user.isBanned) await adminApi.unbanUser(id)
      else await adminApi.banUser(id, { reason: banReason })
      setBanModal(false)
      setBanReason('')
      load()
    } catch { }
  }

  const handleWalletAdjust = async () => {
    const raw = parseFloat(walletForm.amount)
    if (!raw || !walletForm.description) return
    const amount = walletForm.currency === 'cash' ? Math.round(raw * 100) : Math.round(raw)
    try {
      await adminApi.walletAdjust(id, { currency: walletForm.currency, amount, description: walletForm.description })
      setWalletModal(false)
      setWalletForm({ currency: 'credits', amount: '', description: '' })
      load()
    } catch { }
  }

  const handleSetRole = async () => {
    try {
      await adminApi.setRole(id, { role: newRole })
      setRoleModal(false)
      load()
    } catch { }
  }

  const handleAwardBadge = async () => {
    if (!badgeSlug) return
    try {
      await adminApi.awardBadge(id, { badgeSlug })
      setBadgeModal(false)
      setBadgeSlug('')
      load()
    } catch { }
  }

  const handleEditProfile = async () => {
    try {
      const body: any = {}
      if (editForm.username) body.username = editForm.username
      if (editForm.displayName) body.displayName = editForm.displayName
      if (editForm.dateOfBirth) body.dateOfBirth = editForm.dateOfBirth
      if (editForm.avatarUrl) body.avatarUrl = editForm.avatarUrl
      if (editForm.bannerUrl) body.bannerUrl = editForm.bannerUrl
      await adminApi.updateUser(id, body)
      setEditModal(false)
      load()
    } catch { }
  }

  const openEditModal = () => {
    setEditForm({
      username: user?.username || '',
      displayName: user?.displayName || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      avatarUrl: user?.avatarUrl || '',
      bannerUrl: user?.bannerUrl || '',
    })
    setEditModal(true)
  }

  const handleVerifyEmail = async () => {
    try { await adminApi.verifyEmail(id); load() } catch { }
  }

  const handleResetPassword = async () => {
    try { await adminApi.resetPassword(id); alert('Password reset token generated.') } catch { }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back link */}
      <span
        onClick={() => router.push('/admin/users')}
        style={{ fontSize: 13, color: '#4F5568', fontWeight: 700, cursor: 'pointer' }}
      >
        ← Back to Users
      </span>

      {/* Header Card */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', background: '#1a1a2e', flexShrink: 0,
          backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
          backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, color: '#4F5568', fontWeight: 900,
        }}>
          {!user.avatarUrl && displayName?.[0]?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontWeight: 900, fontSize: 28, color: user.usernameColor || '#fff' }}>
              {displayName}
            </span>
            <span style={badgeStyle(ROLE_COLORS[user.role] || '#4F5568')}>{user.role}</span>
            {user.isCoach && <span style={badgeStyle('#a855f7')}>COACH</span>}
            {user.isPremium && <span style={badgeStyle('#f59e0b')}>PREMIUM</span>}
            {user.isBanned && <span style={badgeStyle('#e8000d')}>BANNED</span>}
          </div>

          <div style={{ fontSize: 13, color: '#8890A4', fontWeight: 600, lineHeight: 1.6 }}>
            {user.email} &nbsp;·&nbsp; Level {user.level} &nbsp;·&nbsp; Rep {user.reputation} &nbsp;·&nbsp; Joined {new Date(user.createdAt).toLocaleDateString()}
          </div>

          {user.isBanned && user.bannedReason && (
            <div style={{ fontSize: 16, color: '#e8000d', fontWeight: 700, marginTop: 6, background: 'rgba(232,0,13,.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(232,0,13,.15)' }}>
              Ban reason: {user.bannedReason}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 340 }}>
          <ActionBtn label="Edit Profile" color="#3b82f6" size="md" onClick={openEditModal} />
          <ActionBtn label={user.isBanned ? 'Unban User' : 'Ban User'} color={user.isBanned ? '#22c55e' : '#e8000d'} size="md" onClick={() => setBanModal(true)} />
          <ActionBtn label="Change Role" color="#a855f7" size="md" onClick={() => setRoleModal(true)} />
          <ActionBtn label="Adjust Wallet" color="#f59e0b" size="md" onClick={() => setWalletModal(true)} />
          <ActionBtn label="Award Badge" color="#3b82f6" size="md" onClick={() => setBadgeModal(true)} />
          <ActionBtn label="Verify Email" color="#22c55e" size="md" onClick={handleVerifyEmail} />
          <ActionBtn label="Reset Password" color="#8890A4" size="md" onClick={handleResetPassword} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 700,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: tab === t ? '#fff' : '#4F5568',
              borderBottom: tab === t ? '2px solid #e8000d' : '2px solid transparent',
              transition: 'all .15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'Overview' && <OverviewTab user={user} forumStats={forumStats} />}
      {tab === 'Wallet & Finance' && <WalletTab user={user} transactions={transactions} />}
      {tab === 'Match History' && <MatchesTab matches={matches} />}
      {tab === 'Teams' && <TeamsTab teams={teams} userId={id} />}
      {tab === 'Badges' && <BadgesTab badges={badges} user={user} />}

      {/* Modals */}
      {banModal && (
        <Modal title={user.isBanned ? 'Unban User' : 'Ban User'} subtitle={displayName} onClose={() => setBanModal(false)}>
          {!user.isBanned && (
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Reason</div>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Ban reason..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>
          )}
          <ActionBtn label={user.isBanned ? 'CONFIRM UNBAN' : 'CONFIRM BAN'} color={user.isBanned ? '#22c55e' : '#e8000d'} size="lg" onClick={handleBan} />
        </Modal>
      )}

      {walletModal && (
        <Modal title="Adjust Wallet" subtitle={displayName} onClose={() => setWalletModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>Currency</div>
              <select value={walletForm.currency} onChange={e => setWalletForm(p => ({ ...p, currency: e.target.value as any }))} style={inputStyle}>
                <option value="credits">Tickets</option>
                <option value="cash">Cash (USD)</option>
              </select>
            </div>
            <div>
              <div style={labelStyle}>Amount (positive to add, negative to deduct){walletForm.currency === 'cash' ? ' — in dollars' : ''}</div>
              <input type="number" step={walletForm.currency === 'cash' ? '0.01' : '1'} value={walletForm.amount} onChange={e => setWalletForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} placeholder={walletForm.currency === 'cash' ? 'e.g. 5.00 or -2.50' : 'e.g. 500 or -100'} />
            </div>
            <div>
              <div style={labelStyle}>Description</div>
              <input value={walletForm.description} onChange={e => setWalletForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} placeholder="Reason for adjustment..." />
            </div>
            <ActionBtn label="APPLY ADJUSTMENT" color="#f59e0b" size="lg" onClick={handleWalletAdjust} />
          </div>
        </Modal>
      )}

      {roleModal && (
        <Modal title="Change Role" subtitle={displayName} onClose={() => setRoleModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Base Role</div>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={inputStyle}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Additional Roles</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              {[
                { key: 'premium', label: 'Premium', active: user.isPremium, color: '#f59e0b' },
                { key: 'coach', label: 'Coach', active: user.isCoach, color: '#a855f7' },
              ].map(r => (
                <label key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 14px', background: user[`is${r.key.charAt(0).toUpperCase() + r.key.slice(1)}`] ? `${r.color}15` : '#0d0d14', border: `1px solid ${user[`is${r.key.charAt(0).toUpperCase() + r.key.slice(1)}`] ? r.color : 'rgba(255,255,255,.09)'}`, borderRadius: 6 }}>
                  <input type="checkbox" defaultChecked={r.key === 'premium' ? user.isPremium : user.isCoach} id={`role-${r.key}`} style={{ accentColor: r.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.label}</span>
                </label>
              ))}
            </div>
          </div>
          <ActionBtn label="SAVE ROLES" color="#a855f7" size="lg" onClick={async () => {
            try {
              const isPremium = (document.getElementById('role-premium') as HTMLInputElement)?.checked
              const isCoach = (document.getElementById('role-coach') as HTMLInputElement)?.checked
              await adminApi.setRole(id, { role: newRole, isPremium, isCoach })
              setRoleModal(false)
              load()
            } catch {}
          }} />
        </Modal>
      )}

      {badgeModal && (
        <Modal title="Award Badge" subtitle={displayName} onClose={() => setBadgeModal(false)}>
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Badge Slug</div>
            <input value={badgeSlug} onChange={e => setBadgeSlug(e.target.value)} style={inputStyle} placeholder="e.g. first-win, streak-10, etc." />
          </div>
          <ActionBtn label="AWARD BADGE" color="#3b82f6" size="lg" onClick={handleAwardBadge} />
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Profile" subtitle={displayName} onClose={() => setEditModal(false)} width={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={labelStyle}>Username</div>
              <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Display Name</div>
              <input value={editForm.displayName} onChange={e => setEditForm(p => ({ ...p, displayName: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Date of Birth</div>
              <input type="date" value={editForm.dateOfBirth} onChange={e => setEditForm(p => ({ ...p, dateOfBirth: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <div style={labelStyle}>Profile Picture URL</div>
              <input value={editForm.avatarUrl} onChange={e => setEditForm(p => ({ ...p, avatarUrl: e.target.value }))} style={inputStyle} placeholder="https://..." />
            </div>
            <div>
              <div style={labelStyle}>Profile Banner URL</div>
              <input value={editForm.bannerUrl} onChange={e => setEditForm(p => ({ ...p, bannerUrl: e.target.value }))} style={inputStyle} placeholder="https://..." />
            </div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" size="lg" onClick={handleEditProfile} />
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Tab Components ────────────────────────────────────────────────────────

function OverviewTab({ user, forumStats }: { user: any; forumStats?: { threads: number; posts: number } }) {
  const displayName = user.displayName || user.username
  const yesNo = (v: any) => v ? 'Yes' : 'No'
  const sections = [
    {
      title: 'Identity',
      fields: [
        ['Name', displayName],
        ['Email', user.email],
        ['Slug', user.slug],
        ['Platform ID', user.platformId || '—'],
        ['Country', user.country || '—'],
        ['Timezone', user.timezone || '—'],
        ['Bio', user.bio || '—'],
        ['Email Verified', yesNo(user.isVerified)],
        ['Admin', yesNo(user.role === 'admin')],
        ['Coach', yesNo(user.isCoach)],
        ['Premium', yesNo(user.isPremium)],
      ],
    },
    {
      title: 'Stats',
      fields: [
        ['Level', user.level],
        ['XP', `${user.xp || 0} / ${user.xpToNextLevel || 0}`],
        ['Reputation', user.reputation],
        ['Wins', user.wins],
        ['Losses', user.losses],
        ['Win Streak', user.winStreak],
        ['Best Streak', user.bestWinStreak],
        ['Total Wagered', `$${((user.totalWagered || 0) / 100).toFixed(2)}`],
        ['Total Won', `$${((user.totalWon || 0) / 100).toFixed(2)}`],
      ],
    },
    {
      title: 'Gaming Platforms',
      fields: [
        ['PSN', user.psnId || '—'],
        ['Xbox', user.xboxGamertag || '—'],
        ['Steam', user.steamId || '—'],
        ['Epic', user.epicId || '—'],
        ['Activision', user.activisionId || '—'],
        ['Riot', user.riotId || '—'],
        ['BattleNet', user.battleNetTag || '—'],
        ['Nintendo', user.nintendoFc || '—'],
      ],
    },
    {
      title: 'Forum Stats',
      fields: [
        ['Threads Created', forumStats?.threads ?? 0],
        ['Posts / Replies', forumStats?.posts ?? 0],
      ],
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
      {sections.map(s => (
        <div key={s.title} style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#8890A4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            {s.title}
          </div>
          {s.fields.map(([label, val]) => (
            <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
              <span style={{ fontSize: 13, color: '#4F5568', fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: 13, color: '#DDE0EA', fontWeight: 700, textAlign: 'right', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(val)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function WalletTab({ user, transactions }: { user: any; transactions: any[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Balances */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          ['Tickets', user.credits?.toLocaleString()],
          ['Cash', `$${((user.cashBalance || 0) / 100).toFixed(2)}`],
          ['Held', `$${((user.heldBalance || 0) / 100).toFixed(2)}`],
          ['Pending Payout', `$${((user.pendingPayout || 0) / 100).toFixed(2)}`],
          ['Lifetime Earnings', `$${((user.lifetimeEarnings || 0) / 100).toFixed(2)}`],
        ].map(([label, val]) => (
          <div key={label as string} style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .6 }}>{label}</div>
            <div style={{ fontWeight: 900, fontSize: 24, color: '#fff', marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 16, fontWeight: 800, color: '#8890A4', textTransform: 'uppercase', letterSpacing: 1 }}>
          Recent Transactions
        </div>
        {transactions.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', fontSize: 16, color: '#4F5568' }}>No transactions</div>
        ) : transactions.map((tx: any) => (
          <div key={tx._id} style={{
            display: 'grid', gridTemplateColumns: '110px 80px 90px 1fr 80px 110px',
            gap: 16, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
            fontSize: 16, color: '#DDE0EA', alignItems: 'center',
          }}>
            <span style={{ color: '#8890A4', fontWeight: 700 }}>{tx.type}</span>
            <span style={{ color: '#4F5568' }}>{tx.currency}</span>
            <span style={{ color: tx.amount >= 0 ? '#22c55e' : '#e8000d', fontWeight: 700 }}>
              {tx.amount >= 0 ? '+' : ''}{tx.currency === 'cash' ? `$${(tx.amount / 100).toFixed(2)}` : tx.amount.toLocaleString()}
            </span>
            <span style={{ color: '#4F5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</span>
            <span style={{ color: tx.status === 'completed' ? '#22c55e' : '#f59e0b', fontWeight: 700, fontSize: 13 }}>{tx.status}</span>
            <span style={{ color: '#4F5568' }}>{new Date(tx.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MatchesTab({ matches }: { matches: any[] }) {
  return (
    <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 16, fontWeight: 800, color: '#8890A4', textTransform: 'uppercase', letterSpacing: 1 }}>
        Match History (Last 25)
      </div>
      {matches.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 16, color: '#4F5568' }}>No matches</div>
      ) : matches.map((m: any) => (
        <div key={m._id} style={{
          display: 'grid', gridTemplateColumns: '100px 80px 90px 90px 90px 1fr',
          gap: 16, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
          fontSize: 16, color: '#DDE0EA', alignItems: 'center',
        }}>
          <span style={{ color: '#8890A4', fontWeight: 700 }}>{m.game}</span>
          <span style={{ color: '#4F5568' }}>{m.type}</span>
          <span>{m.scoreA ?? '—'} - {m.scoreB ?? '—'}</span>
          <span style={{ color: m.type === 'cash' ? '#22c55e' : '#3b82f6', fontWeight: 700 }}>
            {m.type === 'cash' ? `$${((m.wager || 0) / 100).toFixed(2)}` : `${m.wager || 0} XP`}
          </span>
          <span style={{
            fontSize: 13, fontWeight: 700,
            color: m.status === 'completed' ? '#22c55e' : m.status === 'disputed' ? '#e8000d' : m.status === 'live' ? '#3b82f6' : '#4F5568',
          }}>
            {m.status?.toUpperCase()}
          </span>
          <span style={{ color: '#4F5568' }}>{new Date(m.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  )
}

function TeamsTab({ teams, userId }: { teams: any[]; userId: string }) {
  return (
    <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 16, fontWeight: 800, color: '#8890A4', textTransform: 'uppercase', letterSpacing: 1 }}>
        Team Memberships
      </div>
      {teams.length === 0 ? (
        <div style={{ padding: 30, textAlign: 'center', fontSize: 16, color: '#4F5568' }}>No teams</div>
      ) : teams.map((t: any) => {
        const member = t.roster?.find((r: any) => r.user?.toString() === userId || r.user?._id?.toString() === userId)
        return (
          <div key={t._id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
          }}>
            <EmojiSolar emoji={t.emoji || '🛡️'} size={22} inline={false} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#DDE0EA' }}>{t.name}</div>
              <div style={{ fontSize: 13, color: '#4F5568' }}>{t.game} · {member?.role || 'Member'}</div>
            </div>
            {t.isDisbanded && <span style={{ fontSize: 13, color: '#e8000d', fontWeight: 700 }}>DISBANDED</span>}
          </div>
        )
      })}
    </div>
  )
}

function BadgesTab({ badges, user }: { badges: any[]; user: any }) {
  const RARITY_COLORS: Record<string, string> = {
    Common: '#6b7280', Rare: '#3b82f6', Epic: '#a855f7', Legendary: '#f59e0b',
  }

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#8890A4', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
        Earned Badges ({badges.length})
      </div>
      {badges.length === 0 ? (
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 12, padding: 30, textAlign: 'center', fontSize: 16, color: '#4F5568' }}>
          No badges earned
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {badges.map((b: any, i: number) => (
            <div key={b._id} style={{
              background: '#13131E', border: `1px solid ${RARITY_COLORS[b.rarity] || '#4F5568'}44`,
              borderRadius: 12, padding: 18, textAlign: 'center',
            }}>
              {b.img && <img src={b.img} alt={b.name} style={{ width: 48, height: 48, marginBottom: 8 }} />}
              <div style={{ fontSize: 13, fontWeight: 700, color: '#DDE0EA' }}>{b.name}</div>
              <div style={{ fontSize: 13, color: RARITY_COLORS[b.rarity] || '#4F5568', fontWeight: 700, marginTop: 3 }}>
                {b.rarity}
              </div>
              {user.badgesEarnedAt?.[i] && (
                <div style={{ fontSize: 12, color: '#4F5568', marginTop: 4 }}>
                  {new Date(user.badgesEarnedAt[i]).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
