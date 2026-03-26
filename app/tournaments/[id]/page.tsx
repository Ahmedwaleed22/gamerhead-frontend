'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/lib/auth-context'
import { tournamentsApi } from '@/lib/api'
import { Solar } from '@/lib/solar-duotone'

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
  gamemode: string
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
  gameRules: string[]
  prizePoolType: string
  schedule: { round: string; time: string; date: string }[]
  registeredTeams: { name: string; slug: string; emoji: string; members: number; seed: number }[]
  bracketJson: string | null
}

const DEFAULT_TOURNAMENT: TournamentData = {
  id: '',
  name: '',
  game: '',
  gameEmoji: '🎯',
  format: '',
  bracketType: 'Single Elimination',
  series: '',
  gamemode: '',
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
  gameRules: [],
  prizePoolType: 'cash',
  schedule: [],
  registeredTeams: [],
  bracketJson: null,
}

function fmtDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return timeStr || '—'
  try {
    const d = new Date(`${dateStr}T${timeStr || '00:00'}`)
    if (isNaN(d.getTime())) return `${dateStr} · ${timeStr || ''}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return `${dateStr} · ${timeStr || ''}` }
}

function mapTournamentDetail(data: any): TournamentData {
  return {
    id:              String(data.slug ?? data.id ?? data._id ?? ''),
    name:            data.name ?? '',
    game:            data.game ?? '',
    gameEmoji:       data.gameEmoji ?? '🎯',
    format:          data.format ?? '',
    bracketType:     data.bracketType ?? 'Single Elimination',
    series:          data.series ?? 'Best of 3',
    gamemode:        data.gamemode ?? '',
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
    gameRules:       data.gameRules ?? [],
    prizePoolType:   data.prizePoolType ?? 'cash',
    schedule:        data.schedule ?? [],
    registeredTeams: data.registeredEntries ?? data.registeredTeams ?? [],
    bracketJson:     data.bracketJson ?? null,
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

// Tickets badge
function TicketsBadge({ amount }: { amount: number }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(240,192,64,0.12)', border:'1px solid rgba(240,192,64,0.3)', borderRadius:6, padding:'3px 10px', fontSize:12, fontWeight:800, color:'#f0c040', fontFamily:'Barlow Condensed, sans-serif' }}>
      <Icon icon={Solar.tickets} width={16} height={16} style={{ flexShrink: 0 }} />
      {amount.toLocaleString()} Tickets
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

// ─── Live bracket JSON → frontend BracketRound format ────────────────────────
function buildFromLiveBracket(bracketJson: string, bracketType: string): {
  singleRounds?: BracketRound[]
  doubleData?: { winners: BracketRound[]; losers: BracketRound[]; gf: BracketMatch }
} {
  try {
    const data = JSON.parse(bracketJson)

    if (data.type === 'single') {
      const roundMap = new Map<number, any[]>()
      for (const m of data.matches) {
        if (!roundMap.has(m.round)) roundMap.set(m.round, [])
        roundMap.get(m.round)!.push(m)
      }
      const rLabels = ['Round of 64','Round of 32','Round of 16','Quarterfinals','Semifinals','Grand Final']
      const rounds: BracketRound[] = []
      const sortedRounds = Array.from(roundMap.keys()).sort((a,b) => a - b)
      const startLabel = Math.max(0, 6 - sortedRounds.length)

      for (let i = 0; i < sortedRounds.length; i++) {
        const roundNum = sortedRounds[i]
        const matches = roundMap.get(roundNum)!.sort((a: any, b: any) => a.position - b.position)
        rounds.push({
          label: rLabels[startLabel + i] ?? `Round ${roundNum}`,
          matches: matches.map((m: any) => ({
            id: `r${roundNum}-m${m.position}`,
            matchSlug: m.matchId || `r${roundNum}-m${m.position}`,
            teamA: m.teamA ? { name: m.teamA.name, slug: m.teamA.slug, emoji: m.teamA.emoji, seed: m.teamA.seed } : null,
            teamB: m.teamB ? { name: m.teamB.name, slug: m.teamB.slug, emoji: m.teamB.emoji, seed: m.teamB.seed } : null,
            scoreA: undefined,
            scoreB: undefined,
            winner: m.winnerSide || null,
            status: m.status === 'completed' ? 'done' as const : m.status === 'live' || m.status === 'ready' ? 'live' as const : 'pending' as const,
          })),
        })
      }
      return { singleRounds: rounds }
    }

    if (data.type === 'double') {
      const convertMatches = (matches: any[], prefix: string): BracketRound[] => {
        const roundMap = new Map<number, any[]>()
        for (const m of matches) {
          if (!roundMap.has(m.round)) roundMap.set(m.round, [])
          roundMap.get(m.round)!.push(m)
        }
        const rounds: BracketRound[] = []
        for (const [roundNum, rMatches] of Array.from(roundMap.entries()).sort(([a],[b]) => a - b)) {
          rounds.push({
            label: `${prefix} Round ${roundNum}`,
            matches: rMatches.sort((a: any, b: any) => a.position - b.position).map((m: any) => ({
              id: `${prefix.toLowerCase().replace(/\s/g,'')}-r${roundNum}-m${m.position}`,
              matchSlug: m.matchId || `${prefix.toLowerCase()}-r${roundNum}-m${m.position}`,
              teamA: m.teamA ? { name: m.teamA.name, slug: m.teamA.slug, emoji: m.teamA.emoji, seed: m.teamA.seed } : null,
              teamB: m.teamB ? { name: m.teamB.name, slug: m.teamB.slug, emoji: m.teamB.emoji, seed: m.teamB.seed } : null,
              winner: m.winnerSide || null,
              status: m.status === 'completed' ? 'done' as const : m.status === 'live' || m.status === 'ready' ? 'live' as const : 'pending' as const,
            })),
          })
        }
        return rounds
      }

      const gfData = data.grandFinal
      const gf: BracketMatch = {
        id: 'gf', matchSlug: gfData?.matchId || 'grand-final',
        teamA: gfData?.teamA ? { name: gfData.teamA.name, slug: gfData.teamA.slug, emoji: gfData.teamA.emoji, seed: gfData.teamA.seed } : null,
        teamB: gfData?.teamB ? { name: gfData.teamB.name, slug: gfData.teamB.slug, emoji: gfData.teamB.emoji, seed: gfData.teamB.seed } : null,
        winner: gfData?.winnerSide || null,
        status: gfData?.status === 'completed' ? 'done' : gfData?.status === 'live' ? 'live' : 'pending',
      }

      return {
        doubleData: {
          winners: convertMatches(data.winnersMatches || [], 'WB'),
          losers: convertMatches(data.losersMatches || [], 'LB'),
          gf,
        },
      }
    }
  } catch { /* fall through to client-side bracket */ }
  return {}
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
        <div style={{ width:26, height:26, borderRadius:6, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {team?.emoji ? <Icon icon={Solar.shield} width={16} height={16} /> : '?'}
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
        <span style={{ fontSize:8, color: vsHover ? '#5A9FD4' : 'var(--text-dim)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, transition:'color .15s', display:'inline-flex', alignItems:'center', gap:4 }}>
          {isLive ? (<><Icon icon={Solar.live} width={10} height={10} style={{ color: '#ff6b6b' }} /> Live</>) : isDone ? (<><Icon icon={Solar.checkRead} width={10} height={10} /> Final</>) : 'Pending'}
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
function WinnerSpot({ match }: { match?: BracketMatch }) {
  const winner = match?.winner === 'A' ? match.teamA : match?.winner === 'B' ? match.teamB : null
  return (
    <div style={{ display:'flex', flexDirection:'column', flexShrink:0 }}>
      <RoundHeader label="Winner" accent="#f0c040" />
      <div style={{
        width: 200, minHeight: 80,
        background: winner ? 'linear-gradient(135deg, rgba(240,192,64,.08), rgba(240,192,64,.02))' : 'var(--bg-2)',
        border: `1px solid ${winner ? 'rgba(240,192,64,.35)' : 'rgba(255,255,255,.07)'}`,
        borderRadius: 10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:16,
        boxShadow: winner ? '0 0 24px rgba(240,192,64,.12)' : '0 2px 12px rgba(0,0,0,.3)',
      }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill={winner ? '#f0c040' : 'rgba(255,255,255,.15)'}>
          <path d="M7 4H4a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h.5A5 5 0 0 0 11 15.9V18H8a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2h-3v-2.1A5 5 0 0 0 17.5 12H18a4 4 0 0 0 4-4V6a2 2 0 0 0-2-2h-3V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1zm10 2h1v2a2 2 0 0 1-2 2h-.09A5.06 5.06 0 0 0 17 8.1V6zM6 8.1A5.06 5.06 0 0 0 6.09 10H6a2 2 0 0 1-2-2V6h2v2.1z"/>
        </svg>
        {winner ? (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <Icon icon={Solar.trophy} width={18} height={18} />
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:15, color:'#f0c040', textAlign:'center' }}>{winner.name}</span>
            </div>
            <span style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'rgba(240,192,64,.6)', fontFamily:'Rajdhani, sans-serif' }}>Champion</span>
          </>
        ) : (
          <span style={{ fontSize:11, fontWeight:600, color:'var(--text-dim)', fontStyle:'italic' }}>TBD</span>
        )}
      </div>
    </div>
  )
}

function SingleEliminationBracket({ rounds, tournamentId }: { rounds: BracketRound[]; tournamentId: string }) {
  const CARD_H   = 102   // height of one MatchCard in px
  const GAP_R0   = 12    // gap between cards in round 0
  const CONN_W   = 32    // width of connector column
  const finalMatch = rounds.length > 0 ? rounds[rounds.length - 1].matches[0] : undefined

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
        {/* Winner spot after final round */}
        <div style={{ display:'flex', alignItems:'flex-start', flexShrink:0 }}>
          <div style={{ width: CONN_W, display:'flex', alignItems:'center', justifyContent:'center', paddingTop: 32 + (rounds.length > 1 ? ((Math.pow(2, rounds.length - 1) - 1) * (CARD_H + GAP_R0) + GAP_R0 - GAP_R0) / 2 : 0) + CARD_H / 2 - 1 }}>
            <div style={{ width: CONN_W, height: 1, background: 'rgba(240,192,64,.25)' }} />
          </div>
          <div style={{ paddingTop: rounds.length > 1 ? ((Math.pow(2, rounds.length - 1) - 1) * (CARD_H + GAP_R0) + GAP_R0 - GAP_R0) / 2 : 0 }}>
            <WinnerSpot match={finalMatch} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Double Elimination ───────────────────────────────────────────────────────
function DoubleEliminationBracket({ winners, losers, gf, tournamentId }: {
  winners: BracketRound[]; losers: BracketRound[]; gf: BracketMatch; tournamentId: string
}) {
  const BracketSection = ({ rounds, label, labelIcon, accent, borderColor }: { rounds:BracketRound[]; label:string; labelIcon?: string; accent:string; borderColor:string }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:1, color:accent, display:'flex', alignItems:'center', gap:6 }}>
          {labelIcon ? <Icon icon={labelIcon} width={16} height={16} /> : null}
          {label}
        </span>
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
      <BracketSection rounds={winners} label="Winners Bracket" labelIcon={Solar.medal} accent="#4ade80" borderColor="rgba(39,174,96,0.2)" />
      <BracketSection rounds={losers}  label="Losers Bracket"  labelIcon={Solar.skull} accent="#ef4444" borderColor="rgba(184,44,44,0.2)" />
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:1, color:'#f0c040', display:'flex', alignItems:'center', gap:6 }}>
            <Icon icon={Solar.trophy} width={16} height={16} /> Grand Final
          </span>
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
function SectionCard({ title, children }: { title: ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'12px 18px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:.5, color:'#fff', display:'flex', alignItems:'center', gap:8 }}>{title}</div>
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
      <button onClick={onClose} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'50%', width:28, height:28, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} aria-label="Close"><Icon icon={Solar.close} width={14} height={14} /></button>
    </div>
  )
}
function InfoPill({ children }: { children: React.ReactNode }) {
  return <div style={{ background:'rgba(26,92,158,0.08)', border:'1px solid rgba(26,92,158,0.2)', borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:14, fontSize:11, flexWrap:'wrap' }}>{children}</div>
}
function TeamEmojiCell({ gameImgUrl, teamEmoji }: { gameImgUrl: string | null | undefined; teamEmoji: string }) {
  const [imgErr, setImgErr] = useState(false)
  const showImg = gameImgUrl && !imgErr
  if (showImg) {
    return <img src={gameImgUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setImgErr(true)} />
  }
  return <Icon icon={Solar.shield} width={22} height={22} />
}
function EntryOptionBtn({ icon, title, sub, onClick }: { icon: ReactNode; title:string; sub:string; onClick:()=>void }) {
  return (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', textAlign:'left', width:'100%', transition:'all .15s' }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='rgba(184,44,44,.4)'; (e.currentTarget as HTMLButtonElement).style.background='rgba(184,44,44,.05)' }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)'; (e.currentTarget as HTMLButtonElement).style.background='var(--bg-3)' }}>
      <div style={{ width:46, height:46, background:'rgba(184,44,44,.1)', border:'1px solid rgba(184,44,44,.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3 }}>{title}</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{sub}</div>
      </div>
      <span style={{ color:'var(--text-dim)', fontSize:18 }}>›</span>
    </button>
  )
}

// ─── Entry Modal ──────────────────────────────────────────────────────────────
function EntryModal({ onClose, tournament, onRegistered }: { onClose: (refresh?: boolean) => void; tournament: TournamentData; onRegistered?: () => void }) {
  const { entryCredits, name, maxTeamSize } = tournament
  const entryType = 'team' as TourneyEntryType
  const firstStep: EntryStep = 'create-team'
  const [step,        setStep]        = useState<EntryStep>(firstStep)
  const [prevStep,    setPrevStep]    = useState<EntryStep|null>(null)
  const [teamName,    setTeamName]    = useState('')
  const [payForTeam,  setPayForTeam]  = useState(false)
  const [inviteTag,   setInviteTag]   = useState('')
  const [invites,     setInvites]     = useState<string[]>([])
  const gameImageUrl = (tournament.gameEmoji && (tournament.gameEmoji.startsWith('/') || tournament.gameEmoji.startsWith('http'))) ? tournament.gameEmoji : null
  const [logoPreview,   setLogoPreview]   = useState<string|null>(gameImageUrl)
  const [bannerPreview, setBannerPreview] = useState<string|null>(gameImageUrl)
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'logo'|'banner') {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2*1024*1024) { alert('File must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => { const url = ev.target?.result as string; type==='logo'?setLogoPreview(url):setBannerPreview(url) }
    reader.readAsDataURL(file); e.target.value = ''
  }
  const [gamertag,    setGamertag]    = useState('')
  const [platform,    setPlatform]    = useState<'psn'|'xbox'|'pc'>('psn')
  const [registered,  setRegistered]  = useState(false)
  const [error,       setError]       = useState('')
  const addInvite = () => { if(inviteTag.trim()&&!invites.includes(inviteTag.trim())&&invites.length<maxTeamSize-1){setInvites(p=>[...p,inviteTag.trim()]);setInviteTag('')} }
  const totalCredits = payForTeam ? entryCredits*(invites.length+1) : entryCredits
  const go   = (next:EntryStep) => { setPrevStep(step); setStep(next) }
  const back = () => { if(prevStep){setStep(prevStep);setPrevStep(null)} else if(entryType==='both')setStep('method'); else onClose(registered) }
  const doConfirm = () => {
    setStep('processing')
    setError('')
    tournamentsApi.register(tournament.id, { teamName, invites, gamertag, platform, payForTeam, logoUrl: logoPreview || undefined, bannerUrl: bannerPreview || undefined })
      .then(() => { setRegistered(true); setStep('success'); onRegistered?.() })
      .catch((err: any) => { setError(err?.message || 'Registration failed. Please try again.'); setStep(firstStep) })
  }

  return (
    <>
      <div onClick={() => onClose(registered)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(4px)', zIndex:1000 }} />
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, maxWidth:'calc(100vw - 32px)', background:'#0F0F18', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, zIndex:1001, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.85)' }}>

        {step === 'success' && (
          <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:18, textAlign:'center' }}>
            <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(240,192,64,0.12)', border:'2px solid rgba(240,192,64,0.45)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={Solar.trophy} width={44} height={44} /></div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:900, textTransform:'uppercase', color:'#f0c040', letterSpacing:1 }}>You're Registered!</div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, maxWidth:310 }}>
              {entryType==='solo' ? `You've been entered into ${name}. Check-in opens at ${tournament.checkIn} on ${tournament.startDate}.`
                : `Your team has been entered into ${name}. Check-in opens at ${tournament.checkIn} on ${tournament.startDate}.`}
            </p>
            <div style={{ background:'rgba(240,192,64,0.08)', border:'1px solid rgba(240,192,64,0.2)', borderRadius:8, padding:'12px 20px', display:'flex', alignItems:'center', gap:10 }}>
              <Icon icon={Solar.tickets} width={20} height={20} style={{ flexShrink: 0 }} />
              <span style={{ fontSize:13, color:'#f0c040', fontWeight:700 }}>{totalCredits.toLocaleString()} Tickets deducted from your balance</span>
            </div>
            {invites.length > 0 && (
              <div style={{ background:'rgba(26,92,158,0.1)', border:'1px solid rgba(26,92,158,0.2)', borderRadius:8, padding:'12px 16px', width:'100%' }}>
                <div style={{ fontSize:11, color:'#5A9FD4', marginBottom:6, fontWeight:700 }}>Invites Sent To:</div>
                {invites.map((inv,i) => <div key={i} style={{ fontSize:12, color:'var(--text-muted)' }}>• {inv}</div>)}
              </div>
            )}
            <button className="btn-primary" onClick={() => onClose(registered)}>Done</button>
          </div>
        )}

        {step === 'processing' && (
          <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:22, textAlign:'center' }}>
            <div style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.07)', borderTop:'3px solid #f0c040', animation:'et-spin .8s linear infinite' }} />
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:22, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>Registering Entry...</div>
            <p style={{ fontSize:12, color:'var(--text-dim)' }}>Deducting Tickets from your balance</p>
          </div>
        )}

        {step === 'method' && (
          <>
            <ModalTop title="Enter Tournament" onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill>
                <span style={{ color:'#5A9FD4', display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.trophy} width={14} height={14} /> {name}</span>
                <span style={{ color:'var(--text-dim)' }}>•</span>
                <span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Tickets</span>
              </InfoPill>
              <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)' }}>How are you entering?</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <EntryOptionBtn icon={<Icon icon={Solar.user} width={26} height={26} />} title="Enter Solo" sub="Register as an individual player" onClick={() => go('solo-info')} />
                <EntryOptionBtn icon={<Icon icon={Solar.bolt} width={26} height={26} />} title="Create a Team" sub={`Form a squad of ${maxTeamSize} and invite teammates`} onClick={() => go('create-team')} />
                <EntryOptionBtn icon={<Icon icon={Solar.handshake} width={26} height={26} />} title="Join an Existing Team" sub="Enter with a team invite code from your captain" onClick={() => go('join-team')} />
              </div>
            </div>
          </>
        )}

        {step === 'solo-info' && (
          <>
            <ModalTop title="Solo Registration" onBack={entryType==='both'?back:undefined} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill><span style={{ color:'#5A9FD4', display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.trophy} width={14} height={14} /> {name}</span><span style={{ color:'var(--text-dim)' }}>•</span><span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Tickets</span></InfoPill>
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
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Tickets Required</span>
                <TicketsBadge amount={entryCredits} />
              </div>
              {error && <div style={{ background:'rgba(232,0,13,.1)', border:'1px solid rgba(232,0,13,.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#e8000d', fontWeight:600 }}>{error}</div>}
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={!gamertag.trim()} onClick={doConfirm}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}><Icon icon={Solar.tickets} width={18} height={18} /> Confirm Entry — {entryCredits.toLocaleString()} Tickets</span>
              </button>
            </div>
          </>
        )}

        {step === 'create-team' && (
          <>
            <ModalTop title="Create Team" onBack={entryType==='both'?back:undefined} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              {/* Tournament info header */}
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width:42, height:42, background:'rgba(240,192,64,0.12)', border:'1px solid rgba(240,192,64,0.3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon icon={Solar.trophy} width={22} height={22} /></div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{name}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{tournament.game} · Tournament · {tournament.format.replace(/\s*\(.*?\)/g, '')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:.4 }}>Entry</div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#f0c040' }}>{entryCredits.toLocaleString()} Tickets</div>
                </div>
              </div>

              {/* Team Name */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Name</label>
                <input className="site-input" placeholder="Enter your team name..." value={teamName} onChange={e=>setTeamName(e.target.value)} style={{ fontSize:13 }} />
              </div>

              {/* Team Profile Picture */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Profile Picture</label>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:52, height:52, background:'var(--bg-3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.08)', flexShrink:0, overflow:'hidden' }}>
                    {logoPreview
                      ? <img src={logoPreview} alt="Logo" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#4A5568' }}>{teamName?.charAt(0)?.toUpperCase()||'T'}</span>}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <label style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'7px 14px', fontSize:11, fontWeight:600, color:'#9CA3AF', cursor:'pointer' }}>
                      Upload
                      <input type="file" accept="image/*" onChange={e=>handleFileSelect(e,'logo')} style={{ display:'none' }} />
                    </label>
                    {logoPreview && <button onClick={()=>setLogoPreview(null)} style={{ background:'rgba(232,0,13,0.08)', border:'1px solid rgba(232,0,13,0.2)', borderRadius:6, padding:'7px 12px', fontSize:11, fontWeight:600, color:'#e8000d', cursor:'pointer' }}>Remove</button>}
                  </div>
                </div>
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>JPG or PNG, max 2MB</div>
              </div>

              {/* Team Banner */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Banner</label>
                <div style={{ height:64, background:bannerPreview?'none':'linear-gradient(135deg, #1a1a2a, #25252C)', borderRadius:8, border:'1px dashed rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                  {bannerPreview
                    ? <img src={bannerPreview} alt="Banner" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:11, color:'var(--text-dim)' }}>No banner</span>}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <label style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'7px 14px', fontSize:11, fontWeight:600, color:'#9CA3AF', cursor:'pointer' }}>
                    Upload Banner
                    <input type="file" accept="image/*" onChange={e=>handleFileSelect(e,'banner')} style={{ display:'none' }} />
                  </label>
                  {bannerPreview && <button onClick={()=>setBannerPreview(null)} style={{ background:'rgba(232,0,13,0.08)', border:'1px solid rgba(232,0,13,0.2)', borderRadius:6, padding:'7px 12px', fontSize:11, fontWeight:600, color:'#e8000d', cursor:'pointer' }}>Remove</button>}
                </div>
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:4 }}>1200x300px recommended, max 2MB</div>
              </div>

              {/* Invite Teammates */}
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
                    <button type="button" onClick={()=>setInvites(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', display:'flex', alignItems:'center', padding:4 }} aria-label="Remove invite"><Icon icon={Solar.close} width={14} height={14} /></button>
                  </div>
                ))}
              </div>
              {invites.length > 0 && (
                <div onClick={()=>setPayForTeam(!payForTeam)} style={{ display:'flex', alignItems:'center', gap:12, background:payForTeam?'rgba(240,192,64,.08)':'var(--bg-3)', border:`1px solid ${payForTeam?'rgba(240,192,64,.3)':'var(--border)'}`, borderRadius:8, padding:'12px 14px', cursor:'pointer', transition:'all .15s' }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${payForTeam?'#f0c040':'var(--border)'}`, background:payForTeam?'#f0c040':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .15s' }}>
                    {payForTeam && <Icon icon={Solar.checkRead} width={14} height={14} style={{ color:'#000' }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>Pay Tickets for teammates</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>Cover {invites.length} teammate{invites.length>1?'s':''} — {(entryCredits*invites.length).toLocaleString()} Tickets additional</div>
                  </div>
                  {payForTeam && <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, color:'#f0c040' }}>+{(entryCredits*invites.length).toLocaleString()}</span>}
                </div>
              )}
              <div style={{ background:'rgba(240,192,64,0.06)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:9, padding:'12px 16px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}><span>Your entry</span><span>{entryCredits.toLocaleString()} Tickets</span></div>
                {payForTeam && invites.length > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}><span>Teammate fees (×{invites.length})</span><span>{(entryCredits*invites.length).toLocaleString()} Tickets</span></div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(255,255,255,.055)', paddingTop:8, marginTop:4 }}>
                  <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Total</span>
                  <TicketsBadge amount={totalCredits} />
                </div>
              </div>
              {error && <div style={{ background:'rgba(232,0,13,.1)', border:'1px solid rgba(232,0,13,.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#e8000d', fontWeight:600 }}>{error}</div>}
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={!teamName.trim()} onClick={doConfirm}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}><Icon icon={Solar.tickets} width={18} height={18} /> Confirm Entry — {totalCredits.toLocaleString()} Tickets</span>
              </button>
            </div>
          </>
        )}

        {step === 'join-team' && (
          <>
            <ModalTop title="Join a Team" onBack={back} onClose={onClose} />
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              <InfoPill><span style={{ color:'#5A9FD4', display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.trophy} width={14} height={14} /> {name}</span><span style={{ color:'var(--text-dim)' }}>•</span><span style={{ color:'#f0c040', fontWeight:700 }}>Entry: {entryCredits.toLocaleString()} Tickets</span></InfoPill>
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', display:'block', marginBottom:8 }}>Team Invite Code</label>
                <input className="site-input" placeholder="Enter 6-digit invite code from your captain..." style={{ fontSize:13 }} />
                <p style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>Ask your team captain for their invite code.</p>
              </div>
              <div style={{ background:'rgba(26,92,158,.08)', border:'1px solid rgba(26,92,158,.2)', borderRadius:8, padding:'13px', fontSize:12, color:'#5A9FD4', lineHeight:1.6 }}>
                You will spend {entryCredits.toLocaleString()} Tickets unless your captain has already covered your entry.
              </div>
              <div style={{ background:'rgba(240,192,64,0.06)', border:'1px solid rgba(240,192,64,0.15)', borderRadius:9, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Tickets Required</span>
                <TicketsBadge amount={entryCredits} />
              </div>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }} onClick={doConfirm}>
                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 }}><Icon icon={Solar.tickets} width={18} height={18} /> Find Team and Confirm — {entryCredits.toLocaleString()} Tickets</span>
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
  const searchParams = useSearchParams()
  const id = params?.id as string
  const { user } = useAuth()
  const [tournament, setTournament] = useState<TournamentData>(DEFAULT_TOURNAMENT)
  const [loading,    setLoading]    = useState(true)
  const tabParam = searchParams?.get('tab')
  const initialTab = (tabParam === 'bracket' || tabParam === 'teams' || tabParam === 'rules') ? tabParam : 'overview'
  const [activeTab,    setActiveTab]    = useState<'overview'|'bracket'|'teams'|'rules'>(initialTab)
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
  const fmtPrize = (cents: number) => TOURNAMENT.prizePoolType === 'cash' ? `$${(cents / 100).toLocaleString()}` : TOURNAMENT.prizePoolType === 'credits' ? `${cents.toLocaleString()} Tickets` : `$${cents.toLocaleString()}`
  const isRegistered = user && TOURNAMENT.registeredTeams.some((e: any) => e.userId === (user as any)._id || e.userId === user.id)
  // Use live bracket data from backend when available — bracket is empty until tournament starts
  const liveBracket = TOURNAMENT.bracketJson ? buildFromLiveBracket(TOURNAMENT.bracketJson, TOURNAMENT.bracketType) : null
  const singleRounds = liveBracket?.singleRounds ?? null
  const doubleData   = liveBracket?.doubleData   ?? null
  const hasBracket = !!(singleRounds || doubleData)

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* BANNER */}
      <div style={{ background:'linear-gradient(135deg, #06080e 0%, #0d1520 40%, #0f0f18 100%)', borderBottom:'1px solid rgba(26,92,158,0.25)', padding:'36px 0 0', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 60px,rgba(26,92,158,.04) 60px,rgba(26,92,158,.04) 61px),repeating-linear-gradient(90deg,transparent,transparent 60px,rgba(26,92,158,.04) 60px,rgba(26,92,158,.04) 61px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-80, right:-80, width:400, height:400, background:'radial-gradient(ellipse, rgba(26,92,158,.12) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div className="container">

          {/* Banner row */}
          <div style={{ display:'flex', alignItems:'flex-start', gap:28, justifyContent:'space-between', paddingBottom:28, position:'relative', flexWrap:'wrap' }}>

            <div style={{ display:'flex', alignItems:'flex-start', gap:22 }}>
              {TOURNAMENT.gameEmoji && (TOURNAMENT.gameEmoji.startsWith('/') || TOURNAMENT.gameEmoji.startsWith('http')) ? (
                <img src={TOURNAMENT.gameEmoji} alt={TOURNAMENT.game} style={{ width:100, height:100, borderRadius:16, objectFit:'cover', border:'1px solid rgba(26,92,158,.4)', flexShrink:0, boxShadow:'0 0 30px rgba(26,92,158,.2)' }} />
              ) : (
                <div style={{ width:100, height:100, background:'linear-gradient(135deg, rgba(26,92,158,.3), rgba(10,16,28,.9))', border:'1px solid rgba(26,92,158,.4)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 30px rgba(26,92,158,.2)' }}><Icon icon={Solar.gamepad} width={50} height={50} /></div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background: TOURNAMENT.status==='live'?'rgba(39,174,96,.1)':TOURNAMENT.status==='open'?'rgba(59,130,246,.1)':TOURNAMENT.status==='checkin'?'rgba(240,192,64,.1)':'rgba(79,85,104,.1)', border:`1px solid ${TOURNAMENT.status==='live'?'rgba(39,174,96,.25)':TOURNAMENT.status==='open'?'rgba(59,130,246,.25)':TOURNAMENT.status==='checkin'?'rgba(240,192,64,.25)':'rgba(79,85,104,.25)'}`, color: TOURNAMENT.status==='live'?'#4ade80':TOURNAMENT.status==='open'?'#3b82f6':TOURNAMENT.status==='checkin'?'#f0c040':'#8890A4', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, textTransform:'uppercase', letterSpacing:.5 }}>{TOURNAMENT.status === 'checkin' ? 'Starting' : TOURNAMENT.status}</span>
                </div>
                <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:44, fontWeight:900, textTransform:'uppercase', color:'#fff', margin:0, lineHeight:1.1 }}>{TOURNAMENT.name}</h1>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.gamepad} width={16} height={16} /> {TOURNAMENT.game || 'Game TBR'}</span>
                  <span>•</span>
                  <span>{TOURNAMENT.format || 'Format TBR'}</span>
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
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:36, fontWeight:900, color:'#f0c040', lineHeight:1 }}>{fmtPrize(TOURNAMENT.prizePool)}</div>
                </div>
              </div>
              {isRegistered ? (
                <div style={{ padding:'12px 28px', fontSize:13, fontWeight:700, color:'#4ade80', background:'rgba(39,174,96,.1)', border:'1px solid rgba(39,174,96,.25)', borderRadius:8, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Icon icon={Solar.check} width={16} height={16} /> Registered</div>
              ) : TOURNAMENT.status === 'open' ? (
                <button className="btn-primary" style={{ padding:'12px 28px', fontSize:13, display:'inline-flex', alignItems:'center', gap:8 }} onClick={()=>setShowEntry(true)}><Icon icon={Solar.sword} width={16} height={16} /> Enter Tournament</button>
              ) : (
                <div style={{ padding:'12px 28px', fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'rgba(255,255,255,.04)', border:'1px solid var(--border)', borderRadius:8, textAlign:'center' }}>Registration Closed</div>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-muted)' }}>
                <Icon icon={Solar.tickets} width={14} height={14} style={{ color:'#f0c040' }} />
                <span>Entry: <strong style={{ color:'#f0c040' }}>{TOURNAMENT.entryCredits.toLocaleString()} Tickets</strong>{TOURNAMENT.entryType!=='solo'?' per player':''}</span>
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
                {tab==='overview' ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.clipboard} width={14} height={14} /> Overview</span>
                ) : tab==='bracket' ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.trophy} width={14} height={14} /> Bracket</span>
                ) : tab==='teams' ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.users} width={14} height={14} /> Teams</span>
                ) : (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Icon icon={Solar.rules} width={14} height={14} /> Rules</span>
                )}
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
              <SectionCard title={<><Icon icon={Solar.trophy} width={16} height={16} /> Prize Pool</>}>
                {TOURNAMENT.prizes.map((p,i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:i<TOURNAMENT.prizes.length-1?'1px solid var(--border)':'none' }}>
                    <TrophyIcon place={p.place} size={24} />
                    <span style={{ fontSize:13, fontWeight:700, color:p.color, flex:1 }}>{p.place}</span>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
                      {p.amount
                        ? <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:900, color:p.color }}>{fmtPrize(p.amount)}</span>
                        : <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:700, color:p.color }}>{p.note}</span>
                      }
                      {TOURNAMENT.prizePoolType === 'cash' && p.creditsBonus > 0 && <span style={{ fontSize:10, color:'#f0c040', fontWeight:600 }}>+{p.creditsBonus.toLocaleString()} Tickets</span>}
                      {p.note && p.amount && <span style={{ fontSize:10, color:'var(--text-dim)' }}>{p.note}</span>}
                    </div>
                  </div>
                ))}
              </SectionCard>

              {/* Schedule */}
              <SectionCard title={<><Icon icon={Solar.calendar} width={16} height={16} /> Tournament Schedule</>}>
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
              <SectionCard title={<><Icon icon={Solar.info} width={16} height={16} /> Details</>}>
                <div style={{ padding:'8px 0' }}>
                  {[
                    { label:'Game',       value: TOURNAMENT.game || '—',      col: undefined },
                    { label:'Format',     value: TOURNAMENT.format || '—',    col: undefined },
                    { label:'Bracket',    value: TOURNAMENT.bracketType,      col: undefined },
                    { label:'Series',     value: TOURNAMENT.series || '—',    col: undefined },
                    { label:'Gamemode',   value: TOURNAMENT.gamemode || '—',    col: undefined },
                    { label:'Prize Pool', value: fmtPrize(TOURNAMENT.prizePool), col: '#22c55e' },
                    { label:'Entry Fee',  value: `${TOURNAMENT.entryCredits.toLocaleString()} Tickets`, col: '#f0c040' },
                    { label:'Start',      value: fmtDateTime(TOURNAMENT.startDate, TOURNAMENT.startTime), col: undefined },
                  ].map((d,i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 18px' }}>
                      <span style={{ fontSize:11, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:.4 }}>{d.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:d.col||'#fff' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <div style={{ background:'linear-gradient(135deg,rgba(26,92,158,.12),rgba(10,14,22,.8))', border:'1px solid rgba(26,92,158,.25)', borderRadius:10, padding:16 }}>
                {isRegistered ? (
                  <>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', color:'#4ade80', marginBottom:6 }}>You're Registered!</div>
                    <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6, margin:0 }}>Your entry has been confirmed. Good luck!</p>
                  </>
                ) : TOURNAMENT.status === 'open' ? (
                  <>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', color:'#fff', marginBottom:6 }}>Ready to Compete?</div>
                    <p style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6, margin:'0 0 12px' }}>{TOURNAMENT.maxTeams-TOURNAMENT.teams} spots remaining. Register now.</p>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center', fontSize:12, padding:'10px', display:'flex', alignItems:'center', gap:8 }} onClick={()=>setShowEntry(true)}>
                      <Icon icon={Solar.tickets} width={16} height={16} /> Enter — {TOURNAMENT.entryCredits.toLocaleString()} Tickets{TOURNAMENT.entryType!=='solo'?'/player':''}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>Registration Closed</div>
                    <p style={{ fontSize:11, color:'var(--text-dim)', lineHeight:1.6, margin:0 }}>This tournament has already started.</p>
                  </>
                )}
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
              </div>
              <div style={{ background:'rgba(26,92,158,0.1)', border:'1px solid rgba(26,92,158,0.25)', borderRadius:8, padding:'8px 16px' }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#5A9FD4', fontFamily:'Barlow, sans-serif', letterSpacing:.3 }}>{TOURNAMENT.bracketType}</span>
              </div>
            </div>

            {/* Bracket canvas */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding:'24px 20px', minHeight:200 }}>
              {hasBracket ? (
                TOURNAMENT.bracketType === 'Single Elimination'
                  ? <SingleEliminationBracket rounds={singleRounds!} tournamentId={TOURNAMENT.id} />
                  : <DoubleEliminationBracket winners={doubleData!.winners} losers={doubleData!.losers} gf={doubleData!.gf} tournamentId={TOURNAMENT.id} />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:200, gap:12 }}>
                  <div style={{ opacity:0.3 }}><Icon icon={Solar.trophy} width={48} height={48} /></div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:800, textTransform:'uppercase', color:'var(--text-muted)', letterSpacing:.5 }}>Bracket Not Yet Generated</div>
                  <div style={{ fontSize:12, color:'var(--text-dim)', maxWidth:400, textAlign:'center', lineHeight:1.6 }}>
                    The bracket will be generated when the tournament starts{TOURNAMENT.startDate ? ` on ${fmtDateTime(TOURNAMENT.startDate, TOURNAMENT.startTime)}` : ''}. Register your team now to secure your spot!
                  </div>
                </div>
              )}
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
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, color:'var(--text-dim)', fontSize:13 }}><Icon icon={Solar.sword} width={14} height={14} /> Click VS to open match page</span>
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
                  {TOURNAMENT.status === 'completed' && (
                    <>
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:900, color:'var(--text-dim)', width:28, textAlign:'center', flexShrink:0 }}>#{team.seed}</div>
                      {team.seed <= 3 && <TrophyIcon place={team.seed===1?'1st':team.seed===2?'2nd':'3rd'} size={20} />}
                    </>
                  )}
                  <div style={{ width:40, height:40, background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                    <TeamEmojiCell
                      gameImgUrl={(TOURNAMENT.gameEmoji && (TOURNAMENT.gameEmoji.startsWith('/') || TOURNAMENT.gameEmoji.startsWith('http'))) ? TOURNAMENT.gameEmoji : null}
                      teamEmoji={team.emoji}
                    />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{team.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{team.members} / {TOURNAMENT.format?.toLowerCase().includes('solo') || TOURNAMENT.format?.includes('1v1') ? 1 : TOURNAMENT.format?.toLowerCase().includes('duo') || TOURNAMENT.format?.includes('2v2') ? 2 : TOURNAMENT.maxTeamSize} players</div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                    <span style={{ fontSize:10, fontWeight:700, background:'rgba(39,174,96,.1)', border:'1px solid rgba(39,174,96,.2)', color:'#4ade80', padding:'3px 8px', borderRadius:4 }}>Registered</span>
                    <span style={{ color:'var(--text-dim)', fontSize:16 }}>›</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* RULES — same accordion style as game profile page */}
        {activeTab === 'rules' && (
          <div>
            <div className="section-header">
              <h2 className="section-title"><span>{TOURNAMENT.game}</span> — Game Rules</h2>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:16 }}>
              {['General Match Rules', 'Wager Match Rules', 'Reporting Results', 'Dispute Process'].map((section, i) => (
                <div key={i} className="accordion-item-custom open">
                  <div className="accordion-header-custom" style={{ cursor:'default', color:'var(--red)' }}><span>{section}</span></div>
                  <div className="accordion-body-custom">All matches must be played under fair conditions. Results must be submitted within 15 minutes with screenshot proof. Exploits or cheating result in an immediate ban.</div>
                </div>
              ))}
              {TOURNAMENT.gameRules.map((rule, i) => (
                <div key={`gr-${i}`} className="accordion-item-custom open">
                  <div className="accordion-header-custom" style={{ cursor:'default', color:'var(--red)' }}><span>Rule {i + 1}</span></div>
                  <div className="accordion-body-custom">{rule}</div>
                </div>
              ))}
              {TOURNAMENT.rules.map((rule, i) => (
                <div key={`tr-${i}`} className="accordion-item-custom open">
                  <div className="accordion-header-custom" style={{ cursor:'default', color:'var(--red)' }}><span>Tournament Rule {i + 1}</span></div>
                  <div className="accordion-body-custom">{rule}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {showEntry && <EntryModal onClose={(refresh?: boolean)=>{ setShowEntry(false); if(refresh) tournamentsApi.getBySlug(id).then((d:any)=>setTournament(mapTournamentDetail(d))).catch(()=>{}) }} onRegistered={()=>tournamentsApi.getBySlug(id).then((d:any)=>setTournament(mapTournamentDetail(d))).catch(()=>{})} tournament={TOURNAMENT} />}


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