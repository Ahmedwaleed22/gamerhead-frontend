'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { tournamentsApi } from '@/lib/api'

type TourneyEntryType = 'solo' | 'team' | 'both'
type EntryStep = 'method' | 'solo-info' | 'create-team' | 'join-team' | 'processing' | 'success'

interface TournamentData {
  id: string
  name: string
  game: string
  gameEmoji: string
  format: string
  bracketType: 'Single Elimination' | 'Double Elimination'
  series: string
  entryCredits: number
  prizePool: number
  entryType: TourneyEntryType
  minTeamSize: number
  maxTeamSize: number
  prizes: { place: string; amount: number | null; color: string; creditsBonus: number; note?: string }[]
  teams: number
  maxTeams: number
  startDate: string
  startTime: string
  checkIn: string
  status: string
  rules: string[]
  schedule: { round: string; time: string; date: string }[]
  registeredTeams: { name: string; slug: string; emoji: string; members: number; seed: number }[]
}

const DEFAULT_TOURNAMENT: TournamentData = {
  id: '',
  name: '',
  game: '',
  gameEmoji: '🎯',
  format: '',
  bracketType: 'Single Elimination',
  series: '',
  entryCredits: 0,
  prizePool: 0,
  entryType: 'team',
  minTeamSize: 1,
  maxTeamSize: 4,
  prizes: [],
  teams: 0,
  maxTeams: 1,
  startDate: '',
  startTime: '',
  checkIn: '',
  status: 'open',
  rules: [],
  schedule: [],
  registeredTeams: [],
}

function mapTournamentDetail(data: any): TournamentData {
  return {
    id:              data.id ?? data._id ?? data.slug ?? '',
    name:            data.name ?? '',
    game:            data.game ?? '',
    gameEmoji:       data.gameEmoji ?? '🎯',
    format:          data.format ?? '',
    bracketType:     data.bracketType ?? 'Single Elimination',
    series:          data.series ?? 'Best of 3',
    entryCredits:    data.entryCredits ?? 0,
    prizePool:       data.prizePool ?? 0,
    entryType:       data.entryType ?? 'team',
    minTeamSize:     data.minTeamSize ?? 1,
    maxTeamSize:     data.maxTeamSize ?? 4,
    prizes:          data.prizes ?? [],
    teams:           data.registeredCount ?? data.teams ?? 0,
    maxTeams:        data.maxTeams ?? 1,
    startDate:       data.startDate ?? '',
    startTime:       data.startTime ?? '',
    checkIn:         data.checkIn ?? '',
    status:          data.status ?? 'open',
    rules:           data.rules ?? [],
    schedule:        data.schedule ?? [],
    registeredTeams: data.registeredEntries ?? data.registeredTeams ?? [],
  }
}

// Trophy SVG icon — color changes by place
function TrophyIcon({ place, size = 22 }: { place: string; size?: number }) {
  const color =
    place.includes('1st') ? '#f0c040' :
    place.includes('2nd') ? '#c0c0c0' :
    place.includes('3rd') ? '#cd7f32' : '#5A9FD4'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M7 4H4a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h.5A5 5 0 0 0 11 15.9V18H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.1A5 5 0 0 0 17.5 12H18a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2h-3V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1zm10 2h1v2a2 2 0 0 1-2 2h-.09A5.06 5.06 0 0 0 17 8.1V6zM6 8.1A5.06 5.06 0 0 0 6.09 10H6a2 2 0 0 1-2-2V6h2v2.1z"/>
    </svg>
  )
}

// Credits badge
function CreditsBadge({ amount }: { amount: number }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(240,192,64,0.12)', border:'1px solid rgba(240,192,64,0.3)', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:800, color:'#f0c040', fontFamily:'Barlow Condensed, sans-serif' }}>
      💰 {amount.toLocaleString()} Credits
    </span>
  )
}

// ─── Bracket types & builders ─────────────────────────────────────────────────
interface BracketTeam {
  name: string
  slug: string
  emoji: string
  seed?: number
}
interface BracketMatch {
  id: string
  matchSlug: string   // used for /tournaments/[id]/matches/[matchSlug]
  teamA: BracketTeam | null
  teamB: BracketTeam | null
  scoreA?: number
  scoreB?: number
  winner?: 'A' | 'B' | null
  status: 'pending' | 'live' | 'done'
}
interface BracketRound { label: string; matches: BracketMatch[] }

// Map team name -> slug+emoji for link building
function buildTeamLookup(registeredTeams: TournamentData['registeredTeams']): Record<string, BracketTeam> {
  return Object.fromEntries(
    registeredTeams.map(t => [t.name, { name: t.name, slug: t.slug, emoji: t.emoji, seed: t.seed }])
  )
}
let TEAM_LOOKUP: Record<string, BracketTeam> = {}
function toTeam(name: string | null, idx: number): BracketTeam | null {
  if (!name) return null
  return TEAM_LOOKUP[name] ?? { name, slug: name.toLowerCase().replace(/\s+/g,'-'), emoji: '🎮' }
}

function buildSingleElim(teams: TournamentData['registeredTeams']): BracketRound[] {
  const size   = Math.pow(2, Math.ceil(Math.log2(teams.length)))
  const names  = [...teams.map(t => t.name), ...Array(size - teams.length).fill(null)] as (string|null)[]
  const rLabels = ['Round of 64','Round of 32','Round of 16','Quarterfinals','Semifinals','Grand Final']
  const rounds: BracketRound[] = []
  let pairs: Array<{a:string|null, b:string|null}> = []
  for (let i = 0; i < size; i += 2) pairs.push({ a: names[i], b: names[i+1] })
  let ri = Math.max(0, 6 - Math.log2(size))
  while (pairs.length >= 1) {
    const label = rLabels[Math.floor(ri)] ?? `Round (${pairs.length * 2})`
    rounds.push({ label, matches: pairs.map((p, idx) => ({
      id: `r${rounds.length}-m${idx}`,
      matchSlug: `r${rounds.length}-m${idx}`,
      teamA: toTeam(p.a, idx),
      teamB: toTeam(p.b, idx),
      status: 'pending' as const,
    }))})
    if (pairs.length === 1) break
    const prev = rounds[rounds.length-1].matches
    pairs = []
    for (let i = 0; i < prev.length; i += 2) pairs.push({ a: null, b: null })
    ri++
  }
  return rounds
}

function buildDoubleElim(teams: TournamentData['registeredTeams']) {
  const size  = Math.pow(2, Math.ceil(Math.log2(teams.length)))
  const names = [...teams.map(t => t.name), ...Array(size - teams.length).fill(null)] as (string|null)[]
  const wLabels = ['WB Round 1','WB Round 2','WB Quarters','WB Semis','WB Finals']
  const lLabels = ['LB Round 1','LB Round 2','LB Quarters','LB Semis','LB Finals']

  const winners: BracketRound[] = []
  let wPairs: Array<{a:string|null, b:string|null}> = []
  for (let i = 0; i < size; i += 2) wPairs.push({ a: names[i], b: names[i+1] })
  let wi = 0
  while (wPairs.length >= 1) {
    winners.push({ label: wLabels[wi] ?? `WB R${wi+1}`, matches: wPairs.map((p, idx) => ({
      id: `wr${wi}-m${idx}`, matchSlug: `wr${wi}-m${idx}`,
      teamA: toTeam(p.a, idx), teamB: toTeam(p.b, idx), status: 'pending' as const,
    }))})
    if (wPairs.length === 1) break
    const prev = winners[winners.length-1].matches
    wPairs = prev.length > 1 ? Array(Math.ceil(prev.length/2)).fill(null).map(()=>({a:null,b:null})) : []
    wi++
  }

  const losers: BracketRound[] = []
  let lCount = Math.max(1, Math.floor(size / 4))
  for (let li = 0; li < lLabels.length; li++) {
    losers.push({ label: lLabels[li], matches: Array.from({length:lCount}, (_,m) => ({
      id: `lr${li}-m${m}`, matchSlug: `lr${li}-m${m}`,
      teamA: null, teamB: null, status: 'pending' as const,
    }))})
    lCount = Math.max(1, Math.floor(lCount / 2))
    if (lCount === 1 && li >= 3) break
  }

  const gf: BracketMatch = {
    id: 'gf', matchSlug: 'grand-final',
    teamA: null, teamB: null, status: 'pending',
  }
  return { winners, losers, gf }
}

// ─── Match Card ───────────────────────────────────────────────────────────────
// Each card has:
//   - Team A row (name clickable → /teams/[slug])
//   - VS button in centre (Link → /tournaments/[id]/matches/[matchSlug])
//   - Team B row (name clickable → /teams/[slug])
function MatchCard({ match, tournamentId, accent = '#1A5C9E' }: {
  match: BracketMatch
  tournamentId: string
  accent?: string
}) {
  const isLive    = match.status === 'live'
  const isDone    = match.status === 'done'
  const [vsHover, setVsHover] = useState(false)
  const matchHref = `/tournaments/${tournamentId}/matches/${match.matchSlug}`

  const TeamRow = ({ team, side, score }: { team: BracketTeam|null; side:'A'|'B'; score?:number }) => {
    const isWinner = match.winner === side
    const isPending = !team
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
        background: isWinner ? 'rgba(39,174,96,0.1)' : isLive ? 'rgba(184,44,44,0.05)' : 'transparent',
        borderBottom: side === 'A' ? `1px solid rgba(255,255,255,0.055)` : 'none',
        minHeight: 40,
      }}>
        {/* Team emoji */}
        <div style={{ width:26, height:26, borderRadius:6, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
          {team?.emoji ?? '?'}
        </div>
        {/* Team name — link to team profile */}
        {team ? (
          <Link href={`/teams/${team.slug}`} onClick={e => e.stopPropagation()}
            style={{ flex:1, fontSize:11, fontWeight:700, color: isWinner ? '#4ade80' : '#fff', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'Barlow, sans-serif', letterSpacing:.2 }}
            onMouseEnter={e=>(e.currentTarget.style.color='#5A9FD4')}
            onMouseLeave={e=>(e.currentTarget.style.color= isWinner ? '#4ade80' : '#fff')}>
            {team.name}
          </Link>
        ) : (
          <span style={{ flex:1, fontSize:11, fontWeight:600, color:'var(--text-dim)', fontStyle:'italic' }}>TBD</span>
        )}
        {/* Seed badge */}
        {team?.seed && <span style={{ fontSize:9, fontWeight:800, color:'var(--text-dim)', fontFamily:'Barlow Condensed, sans-serif' }}>#{team.seed}</span>}
        {/* Score */}
        {score !== undefined && (
          <span style={{ fontSize:13, fontWeight:900, color: isWinner ? '#4ade80' : 'var(--text-muted)', fontFamily:'Barlow Condensed, sans-serif', minWidth:14, textAlign:'right' }}>{score}</span>
        )}
        {/* Win tick */}
        {isWinner && (
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><circle cx={6} cy={6} r={6} fill="rgba(39,174,96,0.25)"/><path d="M3 6l2 2 4-4" stroke="#4ade80" strokeWidth={1.5} strokeLinecap="round"/></svg>
        )}
      </div>
    )
  }

  return (
    <div style={{
      width: 200,
      background: 'var(--bg-2)',
      border: `1px solid ${isLive ? 'rgba(184,44,44,0.6)' : isDone ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: isLive ? '0 0 16px rgba(184,44,44,0.2)' : '0 2px 12px rgba(0,0,0,0.3)',
      transition: 'box-shadow .2s',
      position: 'relative',
    }}>
      {/* Live pulse bar */}
      {isLive && <div style={{ height: 2, background: 'linear-gradient(90deg, var(--red), #ff6b6b)', animation:'bpulse 1.4s ease-in-out infinite' }} />}

      <TeamRow team={match.teamA} side="A" score={match.scoreA} />

      {/* VS divider — clicking navigates to the match page */}
      <Link href={matchHref}
        onMouseEnter={() => setVsHover(true)}
        onMouseLeave={() => setVsHover(false)}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 12px', background: vsHover ? 'rgba(26,92,158,0.22)' : isLive ? 'rgba(184,44,44,0.08)' : 'rgba(255,255,255,0.03)', textDecoration:'none', width:'100%', cursor:'pointer', transition:'background .15s' }}>
        <span style={{ fontSize:8, color: vsHover ? '#5A9FD4' : 'var(--text-dim)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, transition:'color .15s' }}>
          {isLive ? '🔴 Live' : isDone ? '✓ Final' : 'Pending'}
        </span>
        {/* VS icon */}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:12, fontWeight:900, color: isLive ? '#ff6b6b' : vsHover ? '#5A9FD4' : 'var(--text-dim)', letterSpacing:.5, transition:'color .15s' }}>VS</span>
          <div style={{ width:20, height:20, borderRadius:'50%', border:`1px solid ${isLive ? 'rgba(255,107,107,0.6)' : vsHover ? 'rgba(90,159,212,0.7)' : 'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s', background: vsHover ? 'rgba(26,92,158,0.2)' : 'transparent' }}>
            <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
              <path d="M3 5h4M5 3l2 2-2 2" stroke={isLive ? '#ff6b6b' : vsHover ? '#5A9FD4' : 'rgba(255,255,255,0.4)'} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <span style={{ fontSize:8, color: vsHover ? '#5A9FD4' : 'var(--text-dim)', fontWeight:600, transition:'color .15s' }}>View →</span>
      </Link>

      <TeamRow team={match.teamB} side="B" score={match.scoreB} />
    </div>
  )
}

// Bracket connector lines drawn via SVG overlay
function ConnectorSVG({ matchCount, matchH, gap, colW }: { matchCount:number; matchH:number; gap:number; colW:number }) {
  const totalH = matchCount * matchH + (matchCount - 1) * gap
  const midY   = (i: number) => i * (matchH + gap) + matchH / 2
  const paths: string[] = []
  for (let i = 0; i < matchCount; i += 2) {
    const y1 = midY(i)
    const y2 = midY(i + 1)
    const ym = (y1 + y2) / 2
    paths.push(`M0,${y1} H${colW/2} V${ym}`)
    paths.push(`M0,${y2} H${colW/2} V${ym}`)
    paths.push(`M${colW/2},${ym} H${colW}`)
  }
  return (
    <svg width={colW} height={totalH} style={{ flexShrink:0, display:'block', overflow:'visible' }}>
      {paths.map((d,i) => <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />)}
    </svg>
  )
}

// Round column header
function RoundHeader({ label, accent='#5A9FD4' }: { label:string; accent?:string }) {
  return (
    <div style={{ marginBottom:14, padding:'5px 12px', background:`rgba(26,92,158,0.1)`, border:`1px solid rgba(26,92,158,0.2)`, borderRadius:6, textAlign:'center', whiteSpace:'nowrap' }}>
      <span style={{ fontSize:9, fontWeight:800, textTransform:'uppercase', letterSpacing:1.2, color:accent, fontFamily:'Rajdhani, sans-serif' }}>{label}</span>
    </div>
  )
}

// ─── Single Elimination ───────────────────────────────────────────────────────
function SingleEliminationBracket({ rounds, tournamentId }: { rounds: BracketRound[]; tournamentId: string }) {
  const CARD_H   = 102   // height of one MatchCard in px
  const GAP_R0   = 12    // gap between cards in round 0
  const CONN_W   = 32    // width of connector column

  return (
    <div style={{ overflowX:'auto', overflowY:'visible', paddingBottom:16 }}>
      <div style={{ display:'flex', alignItems:'flex-start', minWidth: rounds.length * (200 + CONN_W + 16), padding:'4px 0 4px 4px' }}>
        {rounds.map((round, ri) => {
          const gap    = ri === 0 ? GAP_R0 : (Math.pow(2, ri) - 1) * (CARD_H + GAP_R0) + GAP_R0
          const offset = ri === 0 ? 0 : (gap - GAP_R0) / 2  // top padding to vertically centre

          return (
            <div key={ri} style={{ display:'flex', alignItems:'flex-start', flexShrink:0 }}>
              <div style={{ display:'flex', flexDirection:'column' }}>
                <RoundHeader label={round.label} />
                <div style={{ paddingTop: offset, display:'flex', flexDirection:'column', gap }}>
                  {round.matches.map((m, mi) => (
                    <MatchCard key={mi} match={m} tournamentId={tournamentId} />
                  ))}
                </div>
              </div>
              {/* Connector to next round */}
              {ri < rounds.length - 1 && round.matches.length > 1 && (
                <div style={{ paddingTop: offset + 32 /* header height */, display:'flex', alignItems:'flex-start' }}>
                  <ConnectorSVG
                    matchCount={round.matches.length}
                    matchH={CARD_H}
                    gap={gap}
                    colW={CONN_W}
                  />
                </div>
              )}
              {ri < rounds.length - 1 && round.matches.length <= 1 && (
                <div style={{ width: CONN_W }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Double Elimination ───────────────────────────────────────────────────────
function DoubleEliminationBracket({ winners, losers, gf, tournamentId }: {
  winners: BracketRound[]; losers: BracketRound[]; gf: BracketMatch; tournamentId: string
}) {
  const BracketSection = ({ rounds, label, accent, borderColor }: { rounds:BracketRound[]; label:string; accent:string; borderColor:string }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:1, color:accent }}>{label}</span>
        <div style={{ flex:1, height:1, background:borderColor }} />
      </div>
      <div style={{ display:'flex', gap:0, alignItems:'flex-start', overflowX:'auto', paddingBottom:8 }}>
        {rounds.map((r, ri) => (
          <div key={ri} style={{ display:'flex', alignItems:'flex-start', flexShrink:0 }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <RoundHeader label={r.label} accent={accent} />
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {r.matches.map((m,mi) => <MatchCard key={mi} match={m} tournamentId={tournamentId} accent={accent} />)}
              </div>
            </div>
            {ri < rounds.length - 1 && (
              <div style={{ width:32, alignSelf:'stretch', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:32, height:1, background:borderColor }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <BracketSection rounds={winners} label="🏅 Winners Bracket" accent="#4ade80" borderColor="rgba(39,174,96,0.2)" />
      <BracketSection rounds={losers}  label="💀 Losers Bracket"  accent="#ef4444" borderColor="rgba(184,44,44,0.2)" />
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:1, color:'#f0c040' }}>🏆 Grand Final</span>
          <div style={{ flex:1, height:1, background:'rgba(240,192,64,0.25)' }} />
        </div>
        <MatchCard match={gf} tournamentId={tournamentId} accent="#f0c040" />
        <p style={{ fontSize:10, color:'var(--text-dim)', marginTop:8, lineHeight:1.5 }}>
          Winners bracket finalist vs Losers bracket finalist. If the Losers side wins, a bracket reset is played.
        </p>
      </div>
    </div>
  )
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'12px 18px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, color:'#fff' }}>{title}</div>
      {children}
    </div>
  )
}
function ModalTop({ title, onBack, onClose }: { title: string; onBack?: () => void; onClose: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {onBack && <button onClick={onBack} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>← Back</button>}
        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>{title}</span>
      </div>
      <button onClick={onClose} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'50%', width:28, height:28, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
    </div>
  )
}
function InfoPill({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'rgba(26,92,158,0.08)', border:'1px solid rgba(26,92,158,0.2)', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:14, fontSize:11, flexWrap:'wrap' }}>{children}</div>
}
function EntryOptionBtn({ icon, title, sub, onClick }: { icon:string; title:string; sub:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', textAlign:'left', width:'100%', transition:'all .15s' }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(184,44,44,.4)'; (e.currentTarget as HTMLButtonElement).style.background='rgba(184,44,44,.05)' }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLButtonElement).style.background='var(--bg-3)' }}>
      <div style={{ width:46, height:46, background:'rgba(184,44,44,.1)', border:'1px solid rgba(184,44,44,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub}</div>
      </div>
      <span style={{ color:'var(--text-dim)', fontSize:18 }}>›</span>
    </button>
  )
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({ onClose, tournament }: { onClose: () => void; tournament: TournamentData }) {
  const { entryCredits, entryType, name, maxTeamSize } = tournament
  const firstStep: EntryStep = entryType==='solo' ? 'solo-info' : entryType==='team' ? 'create-team' : 'method'
  const [step,        setStep]        = useState<EntryStep>(firstStep)
  const [prevStep,    setPrevStep]    = useState<EntryStep|null>(null)
  const [teamName,    setTeamName]    = useState('')
  const [payForTeam,  setPayForTeam]  = useState(false)
  const [inviteTag,   setInviteTag]   = useState('')
  const [invites,     setInvites]     = useState<string[]>([])
  const [gamertag,    setGamertag]    = useState('')
  const [platform,    setPlatform]    = useState<'psn'|'xbox'|'pc'>('psn')
  const addInvite = () => { if(inviteTag.trim()&&!invites.includes(inviteTag.trim())&&invites.length<maxTeamSize-1){setInvites(p=>[...p,inviteTag.trim()]);setInviteTag('')} }
  const totalCredits = payForTeam ? entryCredits*(invites.length+1) : entryCredits
  const go   = (next:EntryStep) => { setPrevStep(step); setStep(next) }
  const back = () => { if(prevStep){setStep(prevStep);setPrevStep(null)} else if(entryType==='both')setStep('method'); else onClose() }
  const doConfirm = () => {
    setStep('processing')
    tournamentsApi.register(tournament.id, { teamName, invites, gamertag, platform, payForTeam })
      .then(() => setStep('success'))
      .catch(() => setStep('success'))
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', zIndex:1000 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, maxWidth:'calc(100vw - 32px)', background:'#0F0F18', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, zIndex:1001, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.85)' }}>

        {step === 'success' && (
          <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:18, textAlign:'center' }}>
            <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(240,192,64,0.12)', border:'2px solid rgba(240,192,64,0.45)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38 }}>🏆</div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:900, textTransform:'uppercase', color:'#f0c040', letterSpacing:1 }}>You're Registered!</div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, maxWidth:310 }}>
              {entryType==='solo' ? `You've been entered into ${name}. Check-in opens at ${tournament.checkIn} on ${tournament.startDate}.`
                : `Your team has been entered into ${name}. Check-in opens at ${tournament.checkIn} on ${tournament.startDate}.`}
            </p>
            <div style={{ background:'rgba(240,192,64,0.08)', border:'1px solid rgba(240,192,64,0.2)', borderRadius:8, padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>💰</span>
              <span style={{ fontSize:13, color:'#f0c040', fontWeight:700 }}>{totalCredits.toLocaleString()} Credits deducted from your balance</span>
            </div>
            {invites.length > 0 && (
              <div style={{ background:'rgba(26,92,158,0.1)', border:'1px solid rgba(26,92,158,0.2)', borderRadius:8, padding:'12px 16px', width:'100%' }}>
                <div style={{ fontSize:11, color:'#5A9FD4', marginBottom:6, fontWeight:700 }}>Invites Sent To:</div>
                {invites.map((inv,i) => <div key={i} style={{ fontSize:12, color:'var(--text-muted)' }}>• {inv}</div>)}
              </div>
            )}
            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:22, textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.07)', borderTop:'3px solid #f0c040', animation:'et-spin .8s linear infinite' }} />
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:22, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>Registering Entry...</div>
            <p style={{ fontSize:12, color:'var(--text-dim)' }}>Deducting Credits from your balance</p>
          </div>
        )}

        {step === 'method' && (
          <>
            <ModalTop title="Enter Tournament" onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill>
                <span style={{ color:'#5A9FD4' }}>🏆 {name}</span>
                <span style={{ color:'var(--text-dim)' }}>•</span>
                <span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Credits</span>
              </InfoPill>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)' }}>How are you entering?</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <EntryOptionBtn icon="👤" title="Enter Solo" sub="Register as an individual player" onClick={() => go('solo-info')} />
                <EntryOptionBtn icon="⚡" title="Create a Team" sub={`Form a squad of ${maxTeamSize} and invite teammates`} onClick={() => go('create-team')} />
                <EntryOptionBtn icon="🤝" title="Join an Existing Team" sub="Enter with a team invite code from your captain" onClick={() => go('join-team')} />
              </div>
            </div>
          </>
        )}

        {step === 'solo-info' && (
          <>
            <ModalTop title="Solo Registration" onBack={entryType==='both'?back:undefined} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill><span style={{ color:'#5A9FD4' }}>🏆 {name}</span><span style={{ color:'var(--text-dim)' }}>•</span><span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Credits</span></InfoPill>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Your Gamertag</label>
                <input className="site-input" placeholder="Enter your in-game username..." value={gamertag} onChange={e=>setGamertag(e.target.value)} style={{ fontSize:13 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Platform</label>
                <div style={{ display:'flex', gap:8 }}>
                  {([{key:'psn' as const,label:'PlayStation'},{key:'xbox' as const,label:'Xbox'},{key:'pc' as const,label:'PC'}]).map(p=>(
                    <button key={p.key} onClick={()=>setPlatform(p.key)} style={{ flex:1, padding:'10px 8px', background:platform===p.key?'rgba(26,92,158,.15)':'var(--bg-3)', border:`1px solid ${platform===p.key?'rgba(26,92,158,.4)':'var(--border)'}`, borderRadius:8, fontSize:11, fontWeight:700, color:platform===p.key?'#5A9FD4':'var(--text-muted)', cursor:'pointer', transition:'all .15s' }}>{p.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ background:'rgba(240,192,64,0.06)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:9, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Credits Required</span>
                <CreditsBadge amount={entryCredits} />
              </div>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={!gamertag.trim()} onClick={doConfirm}>
                💰 Confirm Entry — {entryCredits.toLocaleString()} Credits
              </button>
            </div>
          </>
        )}

        {step === 'create-team' && (
          <>
            <ModalTop title="Create Team" onBack={entryType==='both'?back:undefined} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill><span style={{ color:'#5A9FD4' }}>🏆 {name}</span><span style={{ color:'var(--text-dim)' }}>•</span><span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Credits/player</span></InfoPill>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Name</label>
                <input className="site-input" placeholder="Enter your team name..." value={teamName} onChange={e=>setTeamName(e.target.value)} style={{ fontSize:13 }} />
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Invite Teammates <span style={{ color:'var(--text-dim)', fontWeight:400, textTransform:'none' }}>(up to {maxTeamSize-1} more)</span></label>
                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input className="site-input" placeholder="Username or gamertag..." value={inviteTag} onChange={e=>setInviteTag(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addInvite()} style={{ flex:1, fontSize:12, height:34 }} />
                  <button onClick={addInvite} disabled={invites.length>=maxTeamSize-1} style={{ padding:'0 14px', background:'var(--red)', border:'none', borderRadius:4, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:.4, opacity:invites.length>=maxTeamSize-1?.4:1 }}>Invite</button>
                </div>
                {invites.map((inv,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', marginBottom:6 }}>
                    <div style={{ width:28, height:28, background:'rgba(184,44,44,.1)', border:'1px solid rgba(184,44,44,.2)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'var(--red)', fontFamily:'Barlow Condensed, sans-serif' }}>{inv.slice(0,2).toUpperCase()}</div>
                    <span style={{ flex:1, fontSize:12, color:'#fff', fontWeight:600 }}>{inv}</span>
                    <span style={{ fontSize:10, color:'#f0c040', fontWeight:700 }}>Pending Invite</span>
                    <button onClick={()=>setInvites(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'var(--text-dim)', fontSize:13, cursor:'pointer' }}>✕</button>
                  </div>
                ))}
              </div>
              {invites.length > 0 && (
                <div onClick={()=>setPayForTeam(!payForTeam)} style={{ display:'flex', alignItems:'center', gap:12, background:payForTeam?'rgba(240,192,64,.08)':'var(--bg-3)', border:`1px solid ${payForTeam?'rgba(240,192,64,.3)':'var(--border)'}`, borderRadius:8, padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${payForTeam?'#f0c040':'var(--border)'}`, background:payForTeam?'#f0c040':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                    {payForTeam && <span style={{ fontSize:12, color:'#000', fontWeight:900 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>Pay Credits for teammates</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Cover {invites.length} teammate{invites.length>1?'s':''} — {(entryCredits*invites.length).toLocaleString()} Credits additional</div>
                  </div>
                  {payForTeam && <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, color:'#f0c040' }}>+{(entryCredits*invites.length).toLocaleString()}</span>}
                </div>
              )}
              <div style={{ background:'rgba(240,192,64,0.06)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:9, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}><span>Your entry</span><span>{entryCredits.toLocaleString()} Credits</span></div>
                {payForTeam && invites.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}><span>Teammate fees (×{invites.length})</span><span>{(entryCredits*invites.length).toLocaleString()} Credits</span></div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,.055)', paddingTop:8, marginTop:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Total</span>
                  <CreditsBadge amount={totalCredits} />
                </div>
              </div>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={!teamName.trim()} onClick={doConfirm}>
                💰 Confirm Entry — {totalCredits.toLocaleString()} Credits
              </button>
            </div>
          </>
        )}

        {step === 'join-team' && (
          <>
            <ModalTop title="Join a Team" onBack={back} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill><span style={{ color:'#5A9FD4' }}>🏆 {name}</span><span style={{ color:'var(--text-dim)' }}>•</span><span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Credits</span></InfoPill>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Invite Code</label>
                <input className="site-input" placeholder="Enter 6-digit invite code from your captain..." style={{ fontSize:13 }} />
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>Ask your team captain for their invite code.</p>
              </div>
              <div style={{ background:'rgba(26,92,158,.08)', border:'1px solid rgba(26,92,158,.2)', borderRadius:8, padding:'13px', fontSize:12, color:'#5A9FD4', lineHeight:1.6 }}>
                You will spend {entryCredits.toLocaleString()} Credits unless your captain has already covered your entry.
              </div>
              <div style={{ background:'rgba(240,192,64,0.06)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:9, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Credits Required</span>
                <CreditsBadge amount={entryCredits} />
              </div>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={doConfirm}>
                💰 Find Team and Confirm — {entryCredits.toLocaleString()} Credits
              </button>
            </div>
          </>
        )}

      </div>

    </>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TournamentOverviewPage() {
  const params = useParams()
  const id = params?.id as string
  const [tournament, setTournament] = useState<TournamentData>(DEFAULT_TOURNAMENT)
  const [loading,    setLoading]    = useState(true)
  const [activeTab,    setActiveTab]    = useState<'overview'|'bracket'|'teams'|'rules'>('overview')
  const [showEntry,    setShowEntry]    = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    tournamentsApi.getBySlug(id).then((data: any) => {
      if (cancelled) return
      const mapped = mapTournamentDetail(data)
      setTournament(mapped)
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Loading tournament...</div>
      </div>
    )
  }

  TEAM_LOOKUP = buildTeamLookup(tournament.registeredTeams)
  const TOURNAMENT = tournament

  const filled = (TOURNAMENT.teams / TOURNAMENT.maxTeams) * 100
  const entryTypeLabel = TOURNAMENT.entryType==='solo' ? 'Solo Players' : TOURNAMENT.entryType==='team' ? `Teams of ${TOURNAMENT.maxTeamSize}` : 'Solo & Teams'
  const singleRounds = buildSingleElim(TOURNAMENT.registeredTeams)
  const doubleData   = buildDoubleElim(TOURNAMENT.registeredTeams)

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* BANNER */}
      <div style={{ background:'linear-gradient(135deg, #06080e 0%, #0d1520 40%, #0f0f18 100%)', borderBottom:'1px solid rgba(26,92,158,0.25)', padding:'36px 0 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(26,92,158,.04) 60px,rgba(26,92,158,.04) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(26,92,158,.04) 60px,rgba(26,92,158,.04) 61px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400, background:'radial-gradient(ellipse, rgba(26,92,158,.12) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="container">

          {/* Breadcrumb */}
          <div style={{ display:'flex', gap:8, fontSize:12, marginBottom:20, position:'relative' }}>
            <Link href="/tournaments" style={{ color:'var(--text-muted)', textDecoration:'none' }}>Tournaments</Link>
            <span style={{ color:'var(--text-dim)' }}>›</span>
            <span style={{ color:'#5A9FD4', fontWeight:600 }}>{TOURNAMENT.name}</span>
          </div>

          {/* Banner row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:28, justifyContent:'space-between', paddingBottom:28, position:'relative', flexWrap:'wrap' }}>

            <div style={{ display:'flex', alignItems:'flex-start', gap:22 }}>
              <div style={{ width:80, height:80, background:'linear-gradient(135deg, rgba(26,92,158,.3), rgba(10,16,28,.9))', border:'1px solid rgba(26,92,158,.4)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, flexShrink:0, boxShadow:'0 0 30px rgba(26,92,158,.2)' }}>🏆</div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                  <span style={{ background:'rgba(26,92,158,.15)', border:'1px solid rgba(26,92,158,.3)', color:'#5A9FD4', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:.5 }}>🏆 Tournament</span>
                  <span style={{ background:'rgba(39,174,96,.1)', border:'1px solid rgba(39,174,96,.25)', color:'#4ade80', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:.5 }}>🟢 Open</span>
                  <span style={{ background:'rgba(240,170,26,.1)', border:'1px solid rgba(240,170,26,.25)', color:'#f0aa1a', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>{TOURNAMENT.gameEmoji} {TOURNAMENT.game}</span>
                  <span style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', color:'var(--text-muted)', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:20 }}>👤 {entryTypeLabel}</span>
                </div>
                <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:38, fontWeight:900, textTransform:'uppercase', color:'#fff', margin:'0 0 12px', lineHeight:1 }}>{TOURNAMENT.name}</h1>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
                  {[{label:'Format',value:TOURNAMENT.format},{label:'Bracket',value:TOURNAMENT.bracketType},{label:'Series',value:TOURNAMENT.series},{label:'Start',value:`${TOURNAMENT.startDate} · ${TOURNAMENT.startTime}`}].map((s,i)=>(
                    <div key={i}>
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:.7 }}>{s.label}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginTop:2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Trophy icon + prize amount */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, flexShrink:0, alignItems:'flex-end' }}>
              <div style={{ background:'rgba(240,192,64,0.1)', border:'1px solid rgba(240,192,64,0.3)', borderRadius:10, padding:'14px 22px', display:'flex', alignItems:'center', gap:14 }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="#f0c040">
                  <path d="M7 4H4a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h.5A5 5 0 0 0 11 15.9V18H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.1A5 5 0 0 0 17.5 12H18a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2h-3V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1zm10 2h1v2a2 2 0 0 1-2 2h-.09A5.06 5.06 0 0 0 17 8.1V6zM6 8.1A5.06 5.06 0 0 0 6.09 10H6a2 2 0 0 1-2-2V6h2v2.1z"/>
                </svg>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.7, color:'rgba(240,192,64,0.7)', marginBottom:2 }}>Prize Pool</div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:36, fontWeight:900, color:'#f0c040', lineHeight:1 }}>${TOURNAMENT.prizePool.toLocaleString()}</div>
                </div>
              </div>
              <button className="btn-primary" style={{ padding:'12px 28px', fontSize:13 }} onClick={()=>setShowEntry(true)}>
                ⚔️ Enter Tournament
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)' }}>
                <span style={{ color:'#f0c040' }}>💰</span>
                <span>Entry: <strong style={{ color:'#f0c040' }}>{TOURNAMENT.entryCredits.toLocaleString()} Credits</strong>{TOURNAMENT.entryType!=='solo'?' per player':''}</span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:14, display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}><strong style={{ color:'#fff' }}>{TOURNAMENT.teams}</strong> / {TOURNAMENT.maxTeams} Teams</div>
            <div style={{ flex:1, height:6, background:'var(--bg-4)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${filled}%`, background:'linear-gradient(90deg,#1A5C9E,#2A6CC4)', borderRadius:4 }} />
            </div>
            <div style={{ fontSize:11, color:'#5A9FD4', fontWeight:700, whiteSpace:'nowrap' }}>{TOURNAMENT.maxTeams-TOURNAMENT.teams} spots left</div>
          </div>

          {/* Sub-nav tabs */}
          <div style={{ display:'flex', gap:0, marginTop:14 }}>
            {(['overview','bracket','teams','rules'] as const).map(tab=>(
              <button key={tab} onClick={()=>setActiveTab(tab)} style={{ padding:'12px 20px', background:'none', border:'none', borderBottom:`2px solid ${activeTab===tab?'#5A9FD4':'transparent'}`, color:activeTab===tab?'#5A9FD4':'var(--text-muted)', fontSize:13, fontWeight:700, fontFamily:'Barlow, sans-serif', textTransform:'uppercase', letterSpacing:.4, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' }}>
                {tab==='overview'?'📋 Overview':tab==='bracket'?'🏆 Bracket':tab==='teams'?'👥 Teams':'📜 Rules'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="container" style={{ marginTop: 24 }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Prize pool — trophy icons for each place */}
              <SectionCard title="🏆 Prize Pool">
                {TOURNAMENT.prizes.map((p,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<TOURNAMENT.prizes.length-1?'1px solid var(--border)':'none' }}>
                    <TrophyIcon place={p.place} size={24} />
                    <span style={{ fontSize:13, fontWeight:700, color:p.color, flex:1 }}>{p.place}</span>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                      {p.amount
                        ? <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:900, color:p.color }}>${p.amount.toLocaleString()}</span>
                        : <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:700, color:p.color }}>{p.note}</span>
                      }
                      <span style={{ fontSize:10, color:'#f0c040', fontWeight:600 }}>+{p.creditsBonus.toLocaleString()} Credits</span>
                      {p.note && p.amount && <span style={{ fontSize:10, color:'var(--text-dim)' }}>{p.note}</span>}
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* Schedule */}
              <SectionCard title="📅 Tournament Schedule">
                <div style={{ padding:'8px 0' }}>
                  {TOURNAMENT.schedule.map((s,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:16, padding:'10px 18px', borderBottom:i<TOURNAMENT.schedule.length-1?'1px solid var(--border)':'none' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:i===0?'#4ade80':'var(--text-dim)', flexShrink:0 }} />
                      <div style={{ flex:1, fontSize:13, fontWeight:700, color:i===0?'#4ade80':'#fff' }}>{s.round}</div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontSize:12, fontWeight:700, color:i===0?'#4ade80':'var(--text-muted)' }}>{s.time}</div>
                        <div style={{ fontSize:10, color:'var(--text-dim)' }}>{s.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <SectionCard title="ℹ️ Details">
                <div style={{ padding:'8px 0' }}>
                  {[
                    { label:'Game',       value: TOURNAMENT.game,      col: undefined },
                    { label:'Format',     value: TOURNAMENT.format,    col: undefined },
                    { label:'Entry Type', value: entryTypeLabel,        col: undefined },
                    { label:'Bracket',    value: TOURNAMENT.bracketType, col: undefined },
                    { label:'Series',     value: TOURNAMENT.series,    col: undefined },
                    { label:'Entry Fee',  value: `${TOURNAMENT.entryCredits.toLocaleString()} Credits`, col: '#f0c040' },
                    { label:'Check-In',   value: TOURNAMENT.checkIn,   col: undefined },
                    { label:'Start',      value: TOURNAMENT.startTime, col: undefined },
                  ].map((d,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 18px' }}>
                      <span style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:.4 }}>{d.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:d.col||'#fff' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <div style={{ background:'linear-gradient(135deg,rgba(26,92,158,.12),rgba(10,14,22,.8))', border:'1px solid rgba(26,92,158,.25)', borderRadius:10, padding:16 }}>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', color:'#fff', marginBottom:6 }}>Ready to Compete?</div>
                <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 12px' }}>{TOURNAMENT.maxTeams-TOURNAMENT.teams} spots remaining. Register now.</p>
                <button className="btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:12, padding:'10px' }} onClick={()=>setShowEntry(true)}>
                  💰 Enter — {TOURNAMENT.entryCredits.toLocaleString()} Credits{TOURNAMENT.entryType!=='solo'?'/player':''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BRACKET */}
        {activeTab === 'bracket' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:22, fontWeight:900, textTransform:'uppercase', color:'#fff', letterSpacing:.5 }}>Tournament Bracket</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3, display:'flex', alignItems:'center', gap:10 }}>
                  <span>{TOURNAMENT.teams} teams registered</span>
                  <span style={{ color:'var(--text-dim)' }}>·</span>
                  <span>{TOURNAMENT.bracketType}</span>
                  <span style={{ color:'var(--text-dim)' }}>·</span>
                  <span style={{ color:'#5A9FD4' }}>Click team name to view profile · Click VS to view match</span>
                </div>
              </div>
              <div style={{ background:'rgba(26,92,158,0.1)', border:'1px solid rgba(26,92,158,0.25)', borderRadius:8, padding:'8px 16px' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#5A9FD4', fontFamily:'Barlow, sans-serif', letterSpacing:.3 }}>{TOURNAMENT.bracketType}</span>
              </div>
            </div>

            {/* Bracket canvas */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'24px 20px', minHeight:200 }}>
              {TOURNAMENT.bracketType === 'Single Elimination'
                ? <SingleEliminationBracket rounds={singleRounds} tournamentId={TOURNAMENT.id} />
                : <DoubleEliminationBracket winners={doubleData.winners} losers={doubleData.losers} gf={doubleData.gf} tournamentId={TOURNAMENT.id} />
              }
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', paddingLeft:4 }}>
              {[
                { color:'rgba(184,44,44,0.55)', border:'rgba(184,44,44,0.6)', label:'Live Match' },
                { color:'rgba(39,174,96,0.2)',  border:'rgba(39,174,96,0.5)',  label:'Winner'    },
                { color:'rgba(255,255,255,0.07)', border:'rgba(255,255,255,0.1)', label:'Pending' },
              ].map((l,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'var(--text-muted)' }}>
                  <span style={{ width:12, height:12, background:l.color, border:`1px solid ${l.border}`, borderRadius:3, display:'inline-block', flexShrink:0 }} />
                  {l.label}
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'var(--text-muted)' }}>
                <span style={{ color:'#5A9FD4', fontSize:13 }}>→</span> Click team name to view profile
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:11, color:'var(--text-muted)' }}>
                <span style={{ color:'var(--text-dim)', fontSize:13 }}>⚔</span> Click VS to open match page
              </div>
            </div>
          </div>
        )}

        {/* TEAMS — each row links to /teams/[slug] */}
        {activeTab === 'teams' && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-dim)', marginBottom:4 }}>Click any team to view their profile →</div>
            {TOURNAMENT.registeredTeams.map((team,i)=>(
              <Link key={i} href={`/teams/${team.slug}`} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ display:'flex', alignItems:'center', gap:16, background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 20px', cursor:'pointer', transition:'all .15s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.borderColor='rgba(26,92,158,.4)'; e.currentTarget.style.background='rgba(26,92,158,.05)' }}
                  onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--bg-2)' }}>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:900, color:'var(--text-dim)', width:28, textAlign:'center', flexShrink:0 }}>#{team.seed}</div>
                  {/* Trophy for seeds 1-3 */}
                  {team.seed <= 3 && <TrophyIcon place={team.seed===1?'1st':team.seed===2?'2nd':'3rd'} size={20} />}
                  <div style={{ width:40, height:40, background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{team.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{team.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{team.members} / {TOURNAMENT.maxTeamSize} players</div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                    {team.members < TOURNAMENT.maxTeamSize && <span style={{ fontSize:10, fontWeight:700, background:'rgba(240,170,26,.1)', border:'1px solid rgba(240,170,26,.25)', color:'#f0aa1a', padding:'3px 8px', borderRadius:4 }}>Recruiting</span>}
                    <span style={{ fontSize:10, fontWeight:700, background:'rgba(39,174,96,.1)', border:'1px solid rgba(39,174,96,.2)', color:'#4ade80', padding:'3px 8px', borderRadius:4 }}>Registered</span>
                    <span style={{ color:'var(--text-dim)', fontSize:16 }}>›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* RULES */}
        {activeTab === 'rules' && (
          <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>📜 Tournament Rules</div>
            <div style={{ padding:20 }}>
              {TOURNAMENT.rules.map((rule,i)=>(
                <div key={i} style={{ display:'flex', gap:14, padding:'12px 0', borderBottom:i<TOURNAMENT.rules.length-1?'1px solid var(--border)':'none' }}>
                  <div style={{ width:24, height:24, background:'rgba(26,92,158,.15)', border:'1px solid rgba(26,92,158,.25)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:'#5A9FD4', flexShrink:0, fontFamily:'Barlow Condensed, sans-serif' }}>{i+1}</div>
                  <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, margin:0 }}>{rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showEntry && <EntryModal onClose={()=>setShowEntry(false)} tournament={TOURNAMENT} />}


      <style>{`
        @keyframes bpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes et-spin { to { transform:rotate(360deg) } }
        @keyframes gh-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes gh-modalin { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gh-pulse   { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}