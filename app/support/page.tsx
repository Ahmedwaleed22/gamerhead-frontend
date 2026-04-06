'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supportApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { RichEditor, RichContent } from '@/app/components/RichEditor'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

const STATUS_MAP: Record<string, string> = { open: 'Open', claimed: 'In Progress', closed: 'Complete' }
const STATUS_COLOR: Record<string, string> = { Open: '#E74C3C', 'In Progress': '#F39C12', Complete: '#4ade80' }

function fmtTime(d: string | Date) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── CREATE TICKET MODAL ───────────────────────────────────────────────────────

function CreateModal({ isPremium, onClose, onCreated }: { isPremium: boolean; onClose: () => void; onCreated: () => void }) {
  const [department, setDepartment] = useState('General')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Shared
  const [proofLink, setProofLink] = useState('')

  // Department-specific fields
  const [matchId, setMatchId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [disputeReason, setDisputeReason] = useState('Score not recorded')
  const [paymentMethod, setPaymentMethod] = useState('Wallet')
  const [transactionId, setTransactionId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [issueType, setIssueType] = useState('Bug')
  const [platform, setPlatform] = useState('Web')
  const [accountIssue, setAccountIssue] = useState('Login Problem')

  const inputS: React.CSSProperties = { background: '#0C0C11', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '11px 14px', ...R, fontSize: 13, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectS: React.CSSProperties = { ...inputS, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%236B7280\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M8 11L3 6h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }
  const labelS: React.CSSProperties = { ...R, fontWeight: 700, fontSize: 11, color: '#9CA3AF', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }

  // Build description from department-specific fields
  const buildDescription = () => {
    const parts: string[] = []
    if (department === 'General') {
      parts.push(`Issue Type: ${accountIssue}`)
      parts.push(description.trim())
    } else if (department === 'Match Dispute') {
      parts.push(`Match ID: ${matchId.trim()}`)
      parts.push(`Team ID: ${teamId.trim()}`)
      parts.push(`Reason: ${disputeReason}`)
      parts.push(description.trim())
      if (proofLink.trim()) parts.push(`Proof: ${proofLink.trim()}`)
    } else if (department === 'Payment Issue') {
      parts.push(`Payment Method: ${paymentMethod}`)
      parts.push(`Amount: $${paymentAmount.trim()}`)
      parts.push(`Transaction ID: ${transactionId.trim()}`)
      parts.push(description.trim())
    } else if (department === 'Technical') {
      parts.push(`Issue Type: ${issueType}`)
      parts.push(`Platform: ${platform}`)
      parts.push(description.trim())
    }
    return parts.join('\n')
  }

  const submit = async () => {
    if (!subject.trim()) return setError('Subject is required')
    if (department === 'Match Dispute') {
      if (!matchId.trim()) return setError('Match ID is required')
      if (!teamId.trim()) return setError('Team ID is required')
      if (!description.trim() || description.trim().length < 50) return setError('Please describe what happened (at least 50 characters)')
      if (!proofLink.trim()) return setError('Proof link is required')
    } else if (department === 'Payment Issue') {
      if (!paymentAmount.trim()) return setError('Amount is required')
      if (!transactionId.trim()) return setError('Transaction / Order ID is required')
      if (!description.trim() || description.trim().length < 50) return setError('Please describe the issue in detail (at least 50 characters)')
    } else if (department === 'Technical') {
      if (!description.trim() || description.trim().length < 50) return setError('Please describe the steps to reproduce (at least 50 characters)')
    } else {
      if (!description.trim() || description.trim().length < 50) return setError('Please provide details (at least 50 characters)')
    }
    setLoading(true)
    setError('')
    try {
      await supportApi.create({
        game: '',
        department,
        subject: subject.trim(),
        description: buildDescription(),
        urgent: isPremium ? urgent : false,
      })
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to create ticket')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 580, maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', border: '1px solid #25252C', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: 0.3 }}>Create a Ticket</div>
          <button type="button" onClick={onClose} style={{ background: '#25252C', border: 'none', width: 30, height: 30, borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><Icon icon={Solar.close} width={14} height={14} /></button>
        </div>

        {/* Department tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#0C0C11', borderRadius: 10, padding: 4 }}>
          {['General', 'Match Dispute', 'Payment Issue', 'Technical'].map(t => (
            <button key={t} onClick={() => { setDepartment(t); setError('') }} style={{ flex: 1, padding: '10px 0', background: department === t ? '#B22D2D' : 'transparent', border: 'none', borderRadius: 8, ...R, fontWeight: 700, fontSize: 12, color: department === t ? '#fff' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Subject — shared across all */}
          <div>
            <label style={labelS}>Subject</label>
            <input style={inputS} placeholder={
              department === 'General' ? 'Briefly describe your issue' :
              department === 'Match Dispute' ? 'e.g. Score not recorded after win' :
              department === 'Payment Issue' ? 'e.g. Withdrawal not received' :
              'e.g. Page not loading correctly'
            } value={subject} onChange={e => setSubject(e.target.value)} />
          </div>

          {/* ── GENERAL fields ─────────────────────────── */}
          {department === 'General' && (
            <>
              <div>
                <label style={labelS}>What type of issue? *</label>
                <select style={selectS} value={accountIssue} onChange={e => setAccountIssue(e.target.value)}>
                  <option>Login Problem</option>
                  <option>Account Verification</option>
                  <option>Profile Issue</option>
                  <option>Team / Roster Issue</option>
                  <option>Premium / Subscription</option>
                  <option>Report a User</option>
                  <option>Feedback / Suggestion</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={labelS}>Details * <span style={{ fontWeight: 400, textTransform: 'none', color: description.trim().length >= 50 ? '#4ade80' : '#6B7280' }}>({description.trim().length}/50 min)</span></label>
                <textarea style={{ ...inputS, height: 110, resize: 'none', lineHeight: '1.6' }} placeholder="Describe your issue in detail..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </>
          )}

          {/* ── MATCH DISPUTE fields ───────────────────── */}
          {department === 'Match Dispute' && (
            <>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Match ID *</label>
                  <input style={inputS} placeholder="e.g. M-A1B2C3" value={matchId} onChange={e => setMatchId(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Team ID *</label>
                  <input style={inputS} placeholder="Your team ID" value={teamId} onChange={e => setTeamId(e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelS}>Dispute Reason *</label>
                <select style={selectS} value={disputeReason} onChange={e => setDisputeReason(e.target.value)}>
                  <option>Score not recorded</option>
                  <option>Opponent left mid-match</option>
                  <option>Wrong score reported</option>
                  <option>Opponent cheating / exploiting</option>
                  <option>Connection issue during match</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label style={labelS}>What happened? * <span style={{ fontWeight: 400, textTransform: 'none', color: description.trim().length >= 50 ? '#4ade80' : '#6B7280' }}>({description.trim().length}/50 min)</span></label>
                <textarea style={{ ...inputS, height: 100, resize: 'none', lineHeight: '1.6' }} placeholder="Explain what happened in detail..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Proof (Screenshot / Video Link) *</label>
                <input style={inputS} placeholder="Paste a link to your screenshot, video, or image (Imgur, YouTube, etc.)" value={proofLink} onChange={e => setProofLink(e.target.value)} />
                <div style={{ ...R, fontSize: 10, color: '#6B7280', marginTop: 6 }}>Upload your proof to Imgur, YouTube, Streamable, etc. and paste the link here</div>
              </div>
            </>
          )}

          {/* ── PAYMENT ISSUE fields ───────────────────── */}
          {department === 'Payment Issue' && (
            <>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Payment Method *</label>
                  <select style={selectS} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option>Wallet</option>
                    <option>PayPal</option>
                    <option>Credit / Debit Card</option>
                    <option>Crypto</option>
                    <option>Tickets</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Amount ($) *</label>
                  <input style={inputS} placeholder="e.g. 25.00" type="text" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
                </div>
              </div>
              <div>
                <label style={labelS}>Transaction / Order ID *</label>
                <input style={inputS} placeholder="e.g. TXN-123456 or order number" value={transactionId} onChange={e => setTransactionId(e.target.value)} />
              </div>
              <div>
                <label style={labelS}>Describe the issue * <span style={{ fontWeight: 400, textTransform: 'none', color: description.trim().length >= 50 ? '#4ade80' : '#6B7280' }}>({description.trim().length}/50 min)</span></label>
                <textarea style={{ ...inputS, height: 100, resize: 'none', lineHeight: '1.6' }} placeholder="e.g. Funds deducted but not credited, withdrawal pending for 3 days..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </>
          )}

          {/* ── TECHNICAL fields ───────────────────────── */}
          {department === 'Technical' && (
            <>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Issue Type *</label>
                  <select style={selectS} value={issueType} onChange={e => setIssueType(e.target.value)}>
                    <option>Bug</option>
                    <option>Page Not Loading</option>
                    <option>Performance Issue</option>
                    <option>Feature Not Working</option>
                    <option>Display / UI Issue</option>
                    <option>Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelS}>Platform *</label>
                  <select style={selectS} value={platform} onChange={e => setPlatform(e.target.value)}>
                    <option>Web</option>
                    <option>Mobile (iOS)</option>
                    <option>Mobile (Android)</option>
                    <option>Desktop App</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelS}>Steps to reproduce * <span style={{ fontWeight: 400, textTransform: 'none', color: description.trim().length >= 50 ? '#4ade80' : '#6B7280' }}>({description.trim().length}/50 min)</span></label>
                <textarea style={{ ...inputS, height: 100, resize: 'none', lineHeight: '1.6' }} placeholder="1. Go to page...\n2. Click on...\n3. Error appears..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </>
          )}

          {/* Urgent toggle — Premium only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0C0C11', borderRadius: 10, padding: '14px 18px', opacity: isPremium ? 1 : 0.5 }}>
            <div>
              <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>Requires urgent attention</div>
              <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                {isPremium ? 'Mark if this is a time-sensitive issue' : 'Premium members only'}
              </div>
            </div>
            <div
              onClick={() => isPremium && setUrgent(p => !p)}
              style={{ width: 44, height: 24, background: urgent && isPremium ? '#B22D2D' : '#25252C', borderRadius: 12, cursor: isPremium ? 'pointer' : 'not-allowed', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', top: 3, left: urgent && isPremium ? 22 : 3, width: 18, height: 18, background: '#fff', borderRadius: 9, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
            </div>
          </div>
        </div>

        {error && <div style={{ ...R, fontSize: 12, color: '#E74C3C', marginTop: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button onClick={submit} disabled={loading} style={{ flex: 1, background: '#B22D2D', border: 'none', borderRadius: 10, padding: '13px 0', ...R, fontWeight: 700, fontSize: 14, color: '#fff', cursor: loading ? 'wait' : 'pointer', letterSpacing: 0.5, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
          <button onClick={onClose} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '13px 24px', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── LIVE SUPPORT MODAL ──────────────────────────────────────────────────────────

const LIVE_DEPARTMENTS = [
  { label: 'Tournament Support', category: 'tournament', desc: 'Issues with tournament matches, brackets, or scheduling', icon: Solar.trophy },
  { label: 'Technical Issue', category: 'technical', desc: 'Bugs, errors, or things not working correctly', icon: Solar.tools },
  { label: 'General', category: 'general', desc: 'General questions or account help', icon: Solar.chat },
]

function LiveSupportModal({ onClose, onStarted }: { onClose: () => void; onStarted: (session: any) => void }) {
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inputS: React.CSSProperties = { background: '#0C0C11', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '11px 14px', ...R, fontSize: 13, color: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }

  const submit = async () => {
    if (!message.trim() || message.trim().length < 10) return setError('Please describe your issue (at least 10 characters)')
    setLoading(true)
    setError('')
    try {
      const res = await supportApi.requestStaff({ category, message: message.trim() })
      onStarted(res)
    } catch (e: any) {
      setError(e?.message || 'Failed to start live chat')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 500, maxHeight: '90vh', overflowY: 'auto', padding: '32px 36px', border: '1px solid #25252C', boxShadow: '0 32px 80px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', letterSpacing: 0.3 }}>Live Support</div>
          <button type="button" onClick={onClose} style={{ background: '#25252C', border: 'none', width: 30, height: 30, borderRadius: 8, color: '#9CA3AF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Close"><Icon icon={Solar.close} width={14} height={14} /></button>
        </div>

        <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
          Connect with a staff member in real-time. Select a department and describe your issue.
        </div>

        {/* Department selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {LIVE_DEPARTMENTS.map(d => (
            <div
              key={d.category}
              onClick={() => setCategory(d.category)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 10, cursor: 'pointer',
                background: category === d.category ? 'rgba(178,45,45,0.12)' : '#0C0C11',
                border: `1px solid ${category === d.category ? 'rgba(178,45,45,0.4)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'all 0.15s',
              }}
            >
              <Icon icon={d.icon} width={22} height={22} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...R, fontWeight: 700, fontSize: 13, color: category === d.category ? '#fff' : '#9CA3AF' }}>{d.label}</div>
                <div style={{ ...R, fontSize: 11, color: '#6B7280', marginTop: 2 }}>{d.desc}</div>
              </div>
              {category === d.category && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#B22D2D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Message */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ ...R, fontWeight: 700, fontSize: 11, color: '#9CA3AF', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            How can we help? *
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Describe your issue so our team can assist you..."
            style={{ ...inputS, height: 100, resize: 'none', lineHeight: '1.6' }}
          />
        </div>

        {error && <div style={{ ...R, fontSize: 12, color: '#E74C3C', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={submit} disabled={loading} style={{ flex: 1, background: '#22c55e', border: 'none', borderRadius: 10, padding: '13px 0', ...R, fontWeight: 700, fontSize: 14, color: '#fff', cursor: loading ? 'wait' : 'pointer', letterSpacing: 0.5, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Connecting...' : 'Start Live Chat'}
          </button>
          <button onClick={onClose} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '13px 24px', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── LIVE CHAT VIEW ──────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = { tournament: 'Tournament Support', technical: 'Technical Issue', general: 'General', wager: 'Wager Match', match: 'Match Support', premium: 'Premium Match' }

function LiveChatView({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [session, setSession] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Poll for session updates
  useEffect(() => {
    const poll = async () => {
      try {
        const s = await supportApi.getMyLiveChat()
        if (!s) { onClose(); return }
        setSession(s)
        setMessages(s.messages || [])
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || sending || !session) return
    setSending(true)
    try {
      const updated = await supportApi.sendLiveChatMessage(session.sessionId, { text: text.trim() })
      setMessages(updated.messages || [])
      setText('')
    } catch {}
    setSending(false)
  }

  const isQueued = session?.status === 'queued'
  const isClosed = session?.status === 'closed'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff' }}>Live Support</div>
          <div style={{ ...R, fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            {CATEGORY_LABELS[session?.category] || 'General'}
            {session?.adminName && <span> · Agent: <span style={{ color: '#3B82F6', fontWeight: 700 }}>{session.adminName}</span></span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isQueued && (
            <span style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#F39C12' }}>Waiting for Agent</span>
          )}
          {session?.status === 'active' && (
            <span style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#22c55e' }}>Connected</span>
          )}
          {isClosed && (
            <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#4ade80' }}>Chat Ended</span>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Waiting indicator */}
          {isQueued && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 16, padding: 40 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #25252C', borderTopColor: '#F39C12', animation: 'spin 1s linear infinite' }} />
              <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#fff' }}>Waiting for an agent...</div>
              <div style={{ ...R, fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                Your request has been added to the queue. A staff member will be with you shortly.
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg: any, i: number) => {
            const isMe = msg.senderId?.toString() === userId || msg.senderId === userId
            const isAdmin = msg.isAdmin

            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, maxWidth: '75%' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: isAdmin ? '50%' : 8, flexShrink: 0,
                    background: isMe ? 'rgba(178,45,45,0.2)' : 'rgba(59,130,246,0.15)',
                    border: `1.5px solid ${isMe ? '#B22D2D66' : '#3B82F666'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13,
                    color: isMe ? '#B22D2D' : '#3B82F6',
                  }}>
                    {isAdmin ? <Icon icon={Solar.shield} width={18} height={18} /> : (msg.senderName?.slice(0, 2).toUpperCase() || '??')}
                  </div>
                  <div style={{
                    background: isMe ? 'rgba(178,45,45,0.12)' : '#202023',
                    border: `1px solid ${isMe ? 'rgba(178,45,45,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '10px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ ...R, fontSize: 12, fontWeight: 700, color: isMe ? '#E74C3C' : '#3B82F6' }}>
                        {msg.senderName || 'Unknown'}
                      </span>
                      {isAdmin && <span style={{ ...R, fontSize: 9, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Staff</span>}
                      <span style={{ ...R, fontSize: 10, color: '#555' }}>·</span>
                      <span style={{ ...R, fontSize: 10, color: '#6B7280' }}>{fmtTime(msg.sentAt)}</span>
                    </div>
                    <RichContent text={msg.text} style={{ fontSize: 13, lineHeight: '1.55' }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {!isClosed ? (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <RichEditor
              value={text}
              onChange={setText}
              onSubmit={send}
              placeholder="Type your message... (Shift+Enter for new line)"
              minHeight={80}
              disabled={isQueued}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={send} disabled={sending || !text.trim() || isQueued} style={{ background: '#22c55e', border: 'none', borderRadius: 10, padding: '10px 28px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: sending || isQueued ? 'not-allowed' : 'pointer', opacity: !text.trim() || isQueued ? 0.5 : 1 }}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', textAlign: 'center', flexShrink: 0 }}>
            <span style={{ ...R, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>This chat has been resolved</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CONFIRM DIALOG ─────────────────────────────────────────────────────────────

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onCancel}>
      <div style={{ background: '#18181C', borderRadius: 14, width: 400, padding: '28px 32px', border: '1px solid #25252C' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 12 }}>{title}</div>
        <div style={{ ...R, fontSize: 13, color: '#9CA3AF', lineHeight: '1.6', marginBottom: 24 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} style={{ flex: 1, background: '#B22D2D', border: 'none', borderRadius: 10, padding: '12px 0', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>Yes, Close Ticket</button>
          <button onClick={onCancel} style={{ flex: 1, background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 0', ...R, fontWeight: 600, fontSize: 13, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── TICKET CHAT VIEW ───────────────────────────────────────────────────────────

function TicketChat({ ticket, userId, userRole, onBack, onRefresh }: { ticket: any; userId: string; userRole: string; onBack: () => void; onRefresh: () => void }) {
  const [messages, setMessages] = useState<any[]>(ticket.messages || [])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const status = STATUS_MAP[ticket.status] || ticket.status
  const isClosed = ticket.status === 'closed'
  const isAdmin = userRole === 'admin'

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const updated = await supportApi.getTicket(ticket.ticketId)
        setMessages(updated.messages || [])
      } catch {}
    }, 5000)
    return () => clearInterval(poll)
  }, [ticket.ticketId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const updated = await supportApi.sendMessage(ticket.ticketId, { text: text.trim() })
      setMessages(updated.messages || [])
      setText('')
    } catch {}
    setSending(false)
  }

  const closeTicket = async () => {
    try {
      await supportApi.close(ticket.ticketId)
      setShowCloseConfirm(false)
      onRefresh()
      onBack()
    } catch {}
  }

  const reopenTicket = async () => {
    try {
      await supportApi.reopen(ticket.ticketId)
      onRefresh()
      onBack()
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', minHeight: 0 }}>
      {showCloseConfirm && (
        <ConfirmDialog
          title="Close Ticket"
          message="Are you sure you want to close this ticket? You can reopen it later if needed."
          onConfirm={closeTicket}
          onCancel={() => setShowCloseConfirm(false)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 14px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 22, color: '#fff' }}>{ticket.subject || 'Support Ticket'}</div>
          <div style={{ ...R, fontSize: 12, color: '#6B7280', marginTop: 3 }}>
            #{ticket.ticketId} · {ticket.department} · {new Date(ticket.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ticket.urgent && (
            <span style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#E74C3C' }}>URGENT</span>
          )}
          <span style={{ background: (STATUS_COLOR[status] || '#fff') + '18', border: `1px solid ${STATUS_COLOR[status] || '#fff'}44`, borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 12, color: STATUS_COLOR[status] || '#fff' }}>{status}</span>
          {!isClosed && (
            <button onClick={() => setShowCloseConfirm(true)} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>Close Ticket</button>
          )}
          {isClosed && isAdmin && (
            <button onClick={reopenTicket} style={{ background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>Reopen</button>
          )}
        </div>
      </div>

      {/* Chat area — flex:1 fills remaining height, no page scroll */}
      <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((msg: any, i: number) => {
            const isMe = msg.senderId?.toString() === userId || msg.senderId === userId
            const isSystem = msg.isSystem
            const isStaff = !isMe && !isSystem

            if (isSystem) {
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 10, padding: '12px 20px', maxWidth: '80%' }}>
                    <div style={{ ...R, fontSize: 12, color: '#a78bfa', whiteSpace: 'pre-line', lineHeight: '1.6' }}>{msg.text}</div>
                    <div style={{ ...R, fontSize: 10, color: '#6B7280', marginTop: 6, textAlign: 'center' }}>
                      {fmtTime(msg.sentAt)}
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, maxWidth: '75%' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 36, height: 36, borderRadius: isStaff ? '50%' : 8, flexShrink: 0,
                    background: isMe ? 'rgba(178,45,45,0.2)' : 'rgba(59,130,246,0.15)',
                    border: `1.5px solid ${isMe ? '#B22D2D66' : '#3B82F666'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 13,
                    color: isMe ? '#B22D2D' : '#3B82F6',
                  }}>
                    {isStaff ? <Icon icon={Solar.shield} width={18} height={18} /> : (msg.initials || msg.senderName?.slice(0, 2).toUpperCase() || '??')}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    background: isMe ? 'rgba(178,45,45,0.12)' : '#202023',
                    border: `1px solid ${isMe ? 'rgba(178,45,45,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '10px 16px',
                  }}>
                    {/* Name + time row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ ...R, fontSize: 12, fontWeight: 700, color: isMe ? '#E74C3C' : '#3B82F6' }}>
                        {msg.senderName || 'Unknown'}
                      </span>
                      {isStaff && <span style={{ ...R, fontSize: 9, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Staff</span>}
                      {isAdmin && msg.senderId && (
                        <span style={{ ...R, fontSize: 10, color: '#6B7280', fontFamily: 'monospace' }}>
                          ID: {String(msg.senderId?.$oid || msg.senderId._id || msg.senderId)}
                        </span>
                      )}
                      <span style={{ ...R, fontSize: 10, color: '#555' }}>·</span>
                      <span style={{ ...R, fontSize: 10, color: '#6B7280' }}>
                        {fmtTime(msg.sentAt)}
                      </span>
                    </div>
                    <RichContent text={msg.text} style={{ fontSize: 13, lineHeight: '1.55' }} />
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        {!isClosed ? (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <RichEditor
              value={text}
              onChange={setText}
              onSubmit={send}
              placeholder="Type your message... (Shift+Enter for new line)"
              minHeight={90}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={send} disabled={sending || !text.trim()} style={{ background: '#B22D2D', border: 'none', borderRadius: 10, padding: '10px 28px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: sending ? 'wait' : 'pointer', opacity: !text.trim() ? 0.5 : 1 }}>
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', textAlign: 'center', flexShrink: 0 }}>
            <span style={{ ...R, fontSize: 13, color: '#4ade80', fontWeight: 600 }}>This ticket has been resolved</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showLiveSupport, setShowLiveSupport] = useState(false)
  const [showLiveChat, setShowLiveChat] = useState(false)
  const [filterSt, setFilterSt] = useState('All')
  const [filterAttn, setFilterAttn] = useState('All')
  const [search, setSearch] = useState('')
  const [viewTicket, setViewTicket] = useState<any | null>(null)

  const fetchTickets = async () => {
    try {
      const data = await supportApi.getMine()
      setTickets(data)
    } catch {}
    setLoading(false)
  }

  // Check for existing live chat on load — only restore if actively claimed
  useEffect(() => {
    fetchTickets()
    supportApi.getMyLiveChat().then((s: any) => {
      if (s && s.status === 'active') setShowLiveChat(true)
    }).catch(() => {})
  }, [])

  const openTicket = async (t: any) => {
    try {
      const full = await supportApi.getTicket(t.ticketId)
      setViewTicket(full)
    } catch {
      setViewTicket(t)
    }
  }

  const filtered = tickets.filter(t => {
    const status = STATUS_MAP[t.status] || t.status
    if (filterSt !== 'All' && status !== filterSt) return false
    if (filterAttn !== 'All') {
      if (filterAttn === 'Urgent' && !t.urgent) return false
      if (filterAttn === 'Normal' && t.urgent) return false
    }
    if (search.trim()) {
      const s = search.toLowerCase()
      if (!(t.subject || '').toLowerCase().includes(s) && !(t.ticketId || '').toLowerCase().includes(s)) return false
    }
    return true
  })

  const stats = [
    { label: 'Open', value: tickets.filter(t => t.status === 'open').length, color: '#E74C3C' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'claimed').length, color: '#F39C12' },
    { label: 'Complete', value: tickets.filter(t => t.status === 'closed').length, color: '#4ade80' },
    { label: 'Total', value: tickets.length, color: '#fff' },
  ]

  // If viewing live chat, show that
  if (showLiveChat) {
    return (
      <div style={{ background: 'var(--bg)', height: '100vh', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: 1440, padding: '0 30px', height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, height: '100%', alignItems: 'start' }}>
            <DashSidebar active="support" />
            <LiveChatView userId={user?.id || ''} onClose={() => setShowLiveChat(false)} />
          </div>
        </div>
      </div>
    )
  }

  // If viewing a ticket, show chat — lock page height so only chat scrolls
  if (viewTicket) {
    return (
      <div style={{ background: 'var(--bg)', height: '100vh', overflow: 'hidden' }}>
        <div className="container" style={{ maxWidth: 1440, padding: '0 30px', height: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, height: '100%', alignItems: 'start' }}>
            <DashSidebar active="support" />
            <TicketChat
              ticket={viewTicket}
              userId={user?.id || ''}
              userRole={user?.role || ''}
              onBack={() => setViewTicket(null)}
              onRefresh={fetchTickets}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
      {showCreate && <CreateModal isPremium={user?.isPremium || false} onClose={() => setShowCreate(false)} onCreated={fetchTickets} />}
      {showLiveSupport && <LiveSupportModal onClose={() => setShowLiveSupport(false)} onStarted={() => { setShowLiveSupport(false); setShowLiveChat(true) }} />}

      <div className="container" style={{ maxWidth: 1440, padding: '0 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, alignItems: 'start' }}>
          <DashSidebar active="support" />

          <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', margin: 0 }}>Support Center</h1>
                <div style={{ ...R, fontSize: 13, color: '#9CA3AF', marginTop: 6 }}>Submit and track your support tickets</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowLiveSupport(true)} style={{ background: '#22c55e', border: 'none', borderRadius: 10, padding: '12px 28px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 0 20px rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse 2s ease-in-out infinite' }} />
                  Live Support
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }`}</style>
                </button>
                <button onClick={() => setShowCreate(true)} style={{ background: '#B22D2D', border: 'none', borderRadius: 10, padding: '12px 28px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 0 20px rgba(178,45,45,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Ticket
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ background: '#18181C', borderRadius: 12, padding: '18px 22px', border: `1px solid ${s.color}18` }}>
                  <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>{s.label} Tickets</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 36, color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Main card */}
            <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden' }}>
              {/* Filter bar */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <input
                  style={{ background: '#0C0C11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', ...R, fontSize: 12, color: '#fff', outline: 'none', width: 240 }}
                  placeholder="Search by subject or ticket ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <select value={filterSt} onChange={e => setFilterSt(e.target.value)} style={{ background: '#0C0C11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', ...R, fontSize: 12, color: '#fff', outline: 'none', cursor: 'pointer' }}>
                  <option value="All">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Complete">Complete</option>
                </select>
                <select value={filterAttn} onChange={e => setFilterAttn(e.target.value)} style={{ background: '#0C0C11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 14px', ...R, fontSize: 12, color: '#fff', outline: 'none', cursor: 'pointer' }}>
                  <option value="All">All Priority</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Normal">Normal</option>
                </select>
                <div style={{ marginLeft: 'auto', ...R, fontSize: 12, color: '#4A5568' }}>{filtered.length} of {tickets.length} tickets</div>
              </div>

              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 110px 110px 100px', padding: '12px 24px', background: '#0C0C11', gap: 12 }}>
                {['Subject', 'Ticket ID', 'Department', 'Date', 'Status', 'Priority'].map((h, i) => (
                  <span key={i} style={{ ...R, fontWeight: 700, fontSize: 11, color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {loading ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ ...R, fontSize: 13, color: '#6B7280' }}>Loading tickets...</div>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Icon icon={Solar.ticket} width={40} height={40} /></div>
                  <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 6 }}>No tickets found</div>
                  <div style={{ ...R, fontSize: 13, color: '#4A5568' }}>Try adjusting your filters or create a new ticket</div>
                </div>
              ) : filtered.map(t => {
                const status = STATUS_MAP[t.status] || t.status
                const lastMsg = t.messages?.length ? t.messages[t.messages.length - 1] : null
                return (
                  <div
                    key={t.ticketId}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 110px 110px 100px', padding: '18px 24px', borderTop: '1px solid #25252C', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background 0.1s' }}
                    onClick={() => openTicket(t)}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1f')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ ...R, fontWeight: 600, fontSize: 14, color: '#fff', marginBottom: 2 }}>{t.subject || 'No subject'}</div>
                      {lastMsg && !lastMsg.isSystem && (
                        <div style={{ ...R, fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                          {lastMsg.senderName}: {lastMsg.text}
                        </div>
                      )}
                      {t.urgent && <span style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 4, padding: '2px 7px', ...R, fontWeight: 700, fontSize: 10, color: '#E74C3C', letterSpacing: 0.3, marginTop: 4, display: 'inline-block' }}>URGENT</span>}
                    </div>
                    <div style={{ ...R, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>{t.ticketId}</div>
                    <div>
                      <span style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 10px', ...R, fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{t.department}</span>
                    </div>
                    <div style={{ ...R, fontSize: 12, color: '#6B7280' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                    <div>
                      <span style={{ background: (STATUS_COLOR[status] || '#fff') + '18', border: `1px solid ${STATUS_COLOR[status] || '#fff'}44`, borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: STATUS_COLOR[status] || '#fff' }}>{status}</span>
                    </div>
                    <div>
                      <span style={{ background: t.urgent ? 'rgba(231,76,60,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${t.urgent ? 'rgba(231,76,60,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: t.urgent ? '#E74C3C' : '#4A5568' }}>{t.urgent ? 'Urgent' : 'Normal'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
