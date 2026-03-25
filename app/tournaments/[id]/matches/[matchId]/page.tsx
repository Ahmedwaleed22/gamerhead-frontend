'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { matchesApi, supportApi } from '@/lib/api'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// ─── ACCENT COLOR: Blue / Tournament ─────────────────────
const ACCENT     = '#5A9FD4'
const ACCENT_DIM = 'rgba(26,92,158,.15)'
const ACCENT_BDR = 'rgba(26,92,158,.25)'

interface Player {
  initials: string; name: string; slug: string; platform: 'psn'|'xbox'|'pc'; platformHandle: string
  online: boolean; premium: boolean; isCoach: boolean; rep: number; repLabel: string; repColor: string
  goldTrophies: number; silverTrophies: number; bronzeTrophies: number
  wins: number; losses: number; gameRank: number | null
  socials: { ttv?: string; tw?: string; yt?: string }
  avatarGrad: string; avatarBorder: string; isYou?: boolean; usernameColor?: string
  avatarUrl?: string
}
interface Team {
  name: string; slug: string; emoji: string; ladderRank: number; record: string; winPct: string
  wins: number; losses: number
  bannerGrad: string; teamBorder: string; players: Player[]
  logoUrl?: string; bannerUrl?: string
}

// ─── SHARED COMPONENTS ─────────────────────────────────
function TrophySvg({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill={color}/>
      <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill={color}/>
      <rect x="10" y="14" width="4" height="4" fill={color}/>
      <rect x="7" y="18" width="10" height="3" rx="1" fill={color}/>
    </svg>
  )
}

function PlatformPill({ platform, handle }: { platform:'psn'|'xbox'|'pc'; handle:string }) {
  const c = {
    psn:  { bg:'rgba(0,112,243,.1)',  border:'rgba(0,112,243,.3)',  color:'#4A9EFF' },
    xbox: { bg:'rgba(16,124,16,.1)',  border:'rgba(16,124,16,.3)',  color:'#5CDB5C' },
    pc:   { bg:'rgba(212,146,10,.1)', border:'rgba(212,146,10,.3)', color:'#F0AA1A' },
  }[platform]
  if (!handle) return null
  return <span style={{ display:'inline-flex', alignItems:'center', background:c.bg, border:`1px solid ${c.border}`, borderRadius:3, padding:'1px 7px', fontSize:9, fontWeight:700, color:c.color, fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, whiteSpace:'nowrap' }}>{handle}</span>
}

function RepBar({ rep, color, label }: { rep:number; color:string; label:string }) {
  const repPct = Math.min(rep, 100)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:9, color:'#4A5568', fontFamily:'Rajdhani, sans-serif', fontWeight:700 }}>Rep</span>
      <div style={{ width:70, height:5, background:'rgba(255,255,255,.07)', borderRadius:10, overflow:'hidden', flexShrink:0 }}>
        <div style={{ height:5, width:`${repPct}%`, background:color, borderRadius:10, transition:'width .3s' }} />
      </div>
      <span style={{ fontSize:10, fontWeight:700, color, fontFamily:'Rajdhani, sans-serif', whiteSpace:'nowrap' }}>{rep}</span>
    </div>
  )
}

function SocialRow({ socials }: { socials:Player['socials'] }) {
  const items: { icon: React.ReactNode; l: string; url?: string }[] = []
  if (socials.ttv) items.push({ l:'Twitch', url:`https://twitch.tv/${socials.ttv}`, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3.5 2L2 5.5V20h5v3h3l3-3h4l5-5V2H3.5zm15 11l-3.5 3.5H11L8 20v-3.5H4.5V4H18.5v9z" fill="#9146FF"/><path d="M15.5 7h-2v5h2V7zm-5 0h-2v5h2V7z" fill="#9146FF"/></svg> })
  if (socials.tw) items.push({ l:'Twitter', url:`https://twitter.com/${socials.tw}`, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.32 3.91A12.16 12.16 0 013.16 4.86a4.28 4.28 0 001.32 5.72 4.24 4.24 0 01-1.94-.53v.05a4.28 4.28 0 003.43 4.2 4.27 4.27 0 01-1.93.07 4.29 4.29 0 004 2.98A8.59 8.59 0 012 19.54a12.13 12.13 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2 0-.19 0-.37-.01-.56A8.72 8.72 0 0024 6.56a8.49 8.49 0 01-2.54.7z" fill="#1DA1F2"/></svg> })
  if (socials.yt) items.push({ l:'YouTube', url:`https://youtube.com/@${socials.yt}`, icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.56A3.02 3.02 0 00.5 6.2 31.7 31.7 0 000 12a31.7 31.7 0 00.5 5.8 3.02 3.02 0 002.12 2.14c1.84.56 9.38.56 9.38.56s7.54 0 9.38-.56a3.02 3.02 0 002.12-2.14A31.7 31.7 0 0024 12a31.7 31.7 0 00-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" fill="#FF0000"/></svg> })
  if (!items.length) return null
  return (
    <div style={{ display:'flex', gap:4 }}>
      {items.map(s => (
        <span key={s.l} role="button" title={s.l} onClick={e=>{e.preventDefault();e.stopPropagation();window.open(s.url,'_blank')}}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', opacity:.5, transition:'opacity .15s', cursor:'pointer' }}
          onMouseEnter={e=>{e.currentTarget.style.opacity='1'}} onMouseLeave={e=>{e.currentTarget.style.opacity='.5'}}>
          {s.icon}
        </span>
      ))}
    </div>
  )
}

function PlayerRow({ player, side }: { player:Player; side:'left'|'right' }) {
  const [hover, setHover] = useState(false)
  const isR = side === 'right'
  return (
    <Link href={`/profile/${player.slug}`} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:'flex', flexDirection:'column', padding:'10px 14px', margin:'2px 6px', borderRadius:8, background:hover?'rgba(255,255,255,.03)':'transparent', border:`1px solid ${hover?'rgba(255,255,255,.08)':'transparent'}`, transition:'all .15s', textDecoration:'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexDirection:isR?'row-reverse':'row' }}>
        <span style={{ width:6,height:6,borderRadius:3,background:player.online?'#27AE60':'#4F5568',flexShrink:0 }} />
        <div style={{ width:38,height:38,borderRadius:7,background:player.avatarGrad,border:`1.5px solid ${player.avatarBorder}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,position:'relative',overflow:'hidden' }}>
          {player.avatarUrl && (player.avatarUrl.startsWith('http') || player.avatarUrl.startsWith('/') || player.avatarUrl.startsWith('data:image'))
            ? <img src={player.avatarUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
            : <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:14,color:'#fff' }}>{player.initials}</span>}
          {player.isYou && <div style={{ position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',background:'rgba(90,159,212,.9)',borderRadius:3,padding:'1px 4px',fontSize:6,fontWeight:900,color:'#000',whiteSpace:'nowrap' }}>YOU</div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexDirection:isR?'row-reverse':'row',flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Rajdhani, sans-serif',fontWeight:700,fontSize:13,color:hover?ACCENT:(player.usernameColor||'#fff'),whiteSpace:'nowrap',transition:'color .15s' }}>{player.name}</span>
            {player.premium && <span style={{ background:'rgba(243,156,18,0.15)',border:'1px solid rgba(243,156,18,0.4)',borderRadius:3,padding:'1px 5px',fontSize:7,fontWeight:700,color:'#F39C12',fontFamily:'Rajdhani, sans-serif',lineHeight:'14px',letterSpacing:0.4 }}>★ Premium</span>}
            {player.isCoach && <span style={{ background:'rgba(90,159,212,.2)',border:'1px solid rgba(90,159,212,.3)',borderRadius:3,padding:'1px 5px',fontSize:7,fontWeight:700,color:'#5A9FD4',fontFamily:'Rajdhani, sans-serif',lineHeight:'14px' }}>COACH</span>}
            <PlatformPill platform={player.platform} handle={player.platformHandle} />
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:2 }}><TrophySvg color="#F0C040" /><span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:10,color:'#F0C040' }}>{player.goldTrophies}</span></div>
          <div style={{ display:'flex',alignItems:'center',gap:2 }}><TrophySvg color="#C0C0C0" /><span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:10,color:'#C0C0C0' }}>{player.silverTrophies}</span></div>
          <div style={{ display:'flex',alignItems:'center',gap:2 }}><TrophySvg color="#CD7F32" /><span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:10,color:'#CD7F32' }}>{player.bronzeTrophies}</span></div>
        </div>
      </div>
      <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:7,paddingLeft:isR?0:54,paddingRight:isR?54:0,flexDirection:isR?'row-reverse':'row',flexWrap:'wrap' }}>
        <RepBar rep={player.rep} color={player.repColor} label={player.repLabel} />
        <div style={{ display:'flex',gap:10,flexShrink:0,flexDirection:isR?'row-reverse':'row',alignItems:'center' }}>
          {player.gameRank && <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12,fontFamily:'Barlow Condensed, sans-serif',fontWeight:800,color:ACCENT,lineHeight:1 }}>#{player.gameRank}</div>
            <div style={{ fontSize:8,color:'#4F5568',marginTop:1 }}>Rank</div>
          </div>}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:12,lineHeight:1 }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:800,color:'#4ade80' }}>{player.wins}</span>
              <span style={{ color:'#4F5568',margin:'0 2px' }}>/</span>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:800,color:'#ef4444' }}>{player.losses}</span>
            </div>
            <div style={{ fontSize:8,color:'#4F5568',marginTop:1 }}>W/L</div>
          </div>
        </div>
        <SocialRow socials={player.socials} />
      </div>
    </Link>
  )
}

function TeamLogoSlot({ logoUrl, emoji }: { logoUrl?: string; emoji: string }) {
  const [err, setErr] = useState(false)
  if (logoUrl && !err) {
    return <img src={logoUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={() => setErr(true)} />
  }
  return <Icon icon={Solar.shield} width={28} height={28} />
}

function TeamBanner({ team, side }: { team:Team; side:'left'|'right' }) {
  const isR = side === 'right'
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position:'relative',height:100,overflow:'hidden' }}>
      <div style={{ position:'absolute',inset:0,background:team.bannerGrad }} />
      {team.bannerUrl && <img src={team.bannerUrl} alt="" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.45 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 0%,rgba(15,15,24,.96) 100%)' }} />
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'flex-end',padding:'0 16px 10px',flexDirection:isR?'row-reverse':'row',gap:12 }}>
        <div style={{ width:54,height:54,background:'#13131E',border:`2px solid ${team.teamBorder}`,boxShadow:`0 0 14px ${team.teamBorder}66`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,overflow:'hidden' }}>
          <TeamLogoSlot logoUrl={team.logoUrl} emoji={team.emoji} />
        </div>
        <div style={{ flex:1,textAlign:isR?'right':'left' }}>
          <Link href={`/teams/${team.slug}`} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
            style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:20,color:hover?ACCENT:'#fff',lineHeight:1,textDecoration:'none',transition:'color .15s' }}>
            {team.name}
          </Link>
          <div style={{ display:'flex',gap:8,marginTop:5,justifyContent:isR?'flex-end':'flex-start',alignItems:'center' }}>
            {team.ladderRank > 0 && <span style={{ background:ACCENT_DIM,border:`1px solid ${ACCENT_BDR}`,borderRadius:3,padding:'2px 8px',fontSize:9,fontWeight:700,color:ACCENT,fontFamily:'Rajdhani, sans-serif' }}>#{team.ladderRank}</span>}
            <span style={{ fontSize:9,fontFamily:'Rajdhani, sans-serif' }}>
              <span style={{ color:'#4ade80', fontWeight:700 }}>{team.wins}W</span>
              <span style={{ color:'#4F5568' }}> / </span>
              <span style={{ color:'#ef4444', fontWeight:700 }}>{team.losses}L</span>
              <span style={{ color:'#DDE0EA', fontWeight:600 }}> · {team.winPct}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectLabel({ children }: { children:React.ReactNode }) {
  return (
    <div style={{ display:'flex',alignItems:'center',gap:10,padding:'8px 16px 6px' }}>
      <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:800,fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#4F5568',whiteSpace:'nowrap' }}>{children}</span>
      <div style={{ flex:1,height:1,background:'rgba(255,255,255,.055)' }} />
    </div>
  )
}

// ─── MODALS ──────────────────────────────────────────────
function ReportScoreModal({ bestOf, onSubmit, onClose }: { bestOf: string; onSubmit: (myWins: number, myLosses: number) => void; onClose: () => void }) {
  const [myScore, setMyScore] = useState('')
  const [oppScore, setOppScore] = useState('')
  const maxScore = bestOf === 'BO5' ? 3 : bestOf === 'BO3' ? 2 : 1
  const canSubmit = myScore !== '' && oppScore !== '' && Number(myScore) >= 0 && Number(oppScore) >= 0

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.7)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#13131E',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:24,width:340 }}>
        <div style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:18,color:'#fff',marginBottom:4 }}>Report Match Score</div>
        <div style={{ fontSize:11,color:'#8890A4',marginBottom:16,fontFamily:'Rajdhani, sans-serif' }}>Enter the final series score.</div>
        <div style={{ display:'flex',gap:12,marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:4 }}>Your Score</div>
            <input type="number" min={0} max={maxScore} value={myScore} onChange={e=>setMyScore(e.target.value)}
              style={{ width:'100%',padding:'8px 10px',background:'#0B0B12',border:'1px solid rgba(255,255,255,.1)',borderRadius:5,fontSize:16,fontWeight:700,color:'#fff',outline:'none',fontFamily:'Barlow Condensed, sans-serif',textAlign:'center' }} />
          </div>
          <div style={{ display:'flex',alignItems:'center',paddingTop:16 }}>
            <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:18,color:'#4F5568' }}>-</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:4 }}>Opponent</div>
            <input type="number" min={0} max={maxScore} value={oppScore} onChange={e=>setOppScore(e.target.value)}
              style={{ width:'100%',padding:'8px 10px',background:'#0B0B12',border:'1px solid rgba(255,255,255,.1)',borderRadius:5,fontSize:16,fontWeight:700,color:'#fff',outline:'none',fontFamily:'Barlow Condensed, sans-serif',textAlign:'center' }} />
          </div>
        </div>
        <button onClick={()=>canSubmit && onSubmit(Number(myScore), Number(oppScore))} disabled={!canSubmit}
          style={{ width:'100%',padding:'9px',background:ACCENT,border:'none',borderRadius:6,fontSize:12,fontWeight:700,color:'#000',cursor:canSubmit?'pointer':'not-allowed',fontFamily:'Rajdhani, sans-serif',opacity:canSubmit?1:0.4,marginBottom:8 }}>
          Submit Report
        </button>
        <button onClick={onClose} style={{ width:'100%',padding:'8px',background:'#191926',border:'1px solid rgba(255,255,255,.07)',borderRadius:6,fontSize:11,fontWeight:700,color:'#8890A4',cursor:'pointer',fontFamily:'Rajdhani, sans-serif' }}>Cancel</button>
      </div>
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────
function buildTeam(match: any, side: 'A' | 'B'): Team {
  const name    = side === 'A' ? match.teamAName : match.teamBName
  const slug    = side === 'A' ? match.teamASlug : match.teamBSlug
  const emoji   = side === 'A' ? (match.teamAEmoji || '🎮') : (match.teamBEmoji || '🎮')
  const players = (side === 'A' ? match.teamAPlayers : match.teamBPlayers) || []
  const teamStats = side === 'A' ? match.teamAStats : match.teamBStats
  const w = teamStats?.wins ?? 0
  const l = teamStats?.losses ?? 0
  const pct = (w + l) > 0 ? ((w / (w + l)) * 100).toFixed(1) + '%' : '0%'
  const rank = teamStats?.ladderRank ?? 0
  return {
    name:       name || 'TBD',
    slug:       slug || '',
    emoji,
    ladderRank: rank,
    record:     `${w}W / ${l}L`,
    winPct:     pct,
    wins:       w,
    losses:     l,
    bannerGrad: side === 'A' ? 'linear-gradient(135deg,#1C0606 0%,#320A0A 35%,#0E0E1C 100%)' : 'linear-gradient(135deg,#060C1C 0%,#0A1432 35%,#0E0E1C 100%)',
    teamBorder: side === 'A' ? '#B82C2C' : '#2A6CC4',
    logoUrl:    teamStats?.logoUrl || '',
    bannerUrl:  teamStats?.bannerUrl || '',
    players:    players.map((p: any) => {
      const gt = (p.gamertags || [])[0]
      const platform: 'psn'|'xbox'|'pc' = gt?.platform === 'xbox' ? 'xbox' : gt?.platform === 'pc' ? 'pc' : 'psn'
      const handle = gt?.tag || p.psnId || p.xboxGamertag || p.activisionId || ''
      const socialsArr = Array.isArray(p.socials) ? p.socials : []
      const socials: any = {}
      for (const s of socialsArr) {
        const lbl = (s.label || '').toLowerCase()
        const url = s.url || ''
        if (lbl.includes('twitch') || lbl === 'ttv') socials.ttv = url.replace(/^https?:\/\/(www\.)?twitch\.tv\/?/,'')
        else if (lbl.includes('twitter') || lbl.includes('x.com') || lbl === 'tw') socials.tw = url.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\/?/,'')
        else if (lbl.includes('youtube') || lbl === 'yt') socials.yt = url.replace(/^https?:\/\/(www\.)?youtube\.com\/@?/,'')
      }
      return {
        initials:       p.initials || (p.username || '??').slice(0, 2).toUpperCase(),
        name:           p.username || 'Player',
        slug:           p.slug || '',
        platform,
        platformHandle: handle,
        online:         p.isOnline ?? p.online ?? false,
        premium:        p.isPremium ?? p.premium ?? false,
        isCoach:        p.isCoach ?? false,
        rep:            p.rep ?? p.reputation ?? 50,
        repLabel:       p.repLabel || 'Regular',
        repColor:       p.repColor || '#8890A4',
        goldTrophies:   p.goldTrophies ?? 0,
        silverTrophies: p.silverTrophies ?? 0,
        bronzeTrophies: p.bronzeTrophies ?? 0,
        wins:           p.wins ?? 0,
        losses:         p.losses ?? 0,
        gameRank:       p.gameRank ?? null,
        socials,
        avatarGrad:     'linear-gradient(135deg,#13131E,#191926)',
        avatarBorder:   side === 'A' ? 'rgba(184,44,44,.4)' : 'rgba(42,108,196,.4)',
        isYou:          false,
        usernameColor:  p.usernameColor || p.color || '',
        avatarUrl:      p.avatarUrl || '',
      }
    }),
  }
}

// ─── PAGE ──────────────────────────────────────────────
export default function TournamentMatchPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; matchId: string }>
}) {
  const params = use(paramsPromise)
  const tournamentId = params.id
  const matchIdParam = params.matchId
  const { user } = useAuth()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (matchIdParam) {
      matchesApi.getById(matchIdParam).then((data: any) => {
        setMatch(data)
      }).catch((e: any) => {
        setError(e?.message || 'Match not found')
        console.error(e)
      }).finally(() => setLoading(false))
    }
  }, [matchIdParam])

  const REAL_MATCH_ID = match?.matchId || matchIdParam || ''

  // Build teams from API data
  const teamA = match ? buildTeam(match, 'A') : null
  const teamB = match ? buildTeam(match, 'B') : null

  // Mark current user
  if (user && teamA && teamB) {
    const markYou = (players: Player[]) => players.map(p => ({
      ...p,
      isYou: p.slug === (user as any).slug || p.name === user.username,
    }))
    teamA.players = markYou(teamA.players)
    teamB.players = markYou(teamB.players)
  }

  // Determine which team the current user is on
  const userSide: 'A' | 'B' | null = (() => {
    if (!user || !match) return null
    const uid = (user as any)._id || (user as any).id
    if (match.teamAPlayers?.some((p: any) => p.userId === uid)) return 'A'
    if (match.teamBPlayers?.some((p: any) => p.userId === uid)) return 'B'
    return null
  })()

  const matchStatus  = match?.status || 'live'
  const gameName     = match?.game || ''
  const gamemode     = match?.assignedGamemode || match?.gamemode || ''
  const assignedMap  = match?.assignedMap || ''
  const assignedMaps: string[] = match?.assignedMaps?.length ? match.assignedMaps : (assignedMap ? [assignedMap] : [])
  const bestOf       = match?.bestOf || 'BO3'
  const formatStr    = match?.format || 'Squad'

  const [chatMsg, setChatMsg] = useState('')
  const [msgs, setMsgs] = useState<any[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [staffRequested, setStaffRequested] = useState(false)

  useEffect(() => {
    if (match?.chat?.length) {
      setMsgs(match.chat.map((c: any) => ({
        from:     c.username || 'System',
        initials: c.initials || (c.username || 'SY').slice(0, 2).toUpperCase(),
        color:    c.type === 'system' ? ACCENT : '#8890A4',
        bg:       c.type === 'system' ? ACCENT_DIM : '#13131E',
        text:     c.text,
        type:     c.type || 'recv',
      })))
    } else if (match) {
      setMsgs([
        { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:`Tournament match ${REAL_MATCH_ID} created. ${match.tournamentRound || ''} · ${bestOf === 'BO1' ? 'Best of 1' : bestOf === 'BO3' ? 'Best of 3' : 'Best of 5'}`, type:'system' },
      ])
    }
  }, [match])

  // Poll for match updates while live
  useEffect(() => {
    if (!REAL_MATCH_ID || !['live','accepted','pending'].includes(matchStatus)) return
    const poll = setInterval(() => {
      matchesApi.getById(REAL_MATCH_ID).then(setMatch).catch(console.error)
    }, 5000)
    return () => clearInterval(poll)
  }, [REAL_MATCH_ID, matchStatus])

  const refreshMatch = () => matchesApi.getById(REAL_MATCH_ID).then(setMatch).catch(console.error)

  const send = () => {
    if (!chatMsg.trim()) return
    const username = user?.username || 'You'
    setMsgs(p => [...p, { from: username, initials: username.slice(0, 2).toUpperCase(), color:'#8890A4', bg:'#B82C2C', text:chatMsg.trim(), type:'sent' }])
    matchesApi.sendChat(REAL_MATCH_ID, { text: chatMsg.trim() }).catch(console.error)
    setChatMsg('')
  }

  const handleReportScore = (myWins: number, myLosses: number) => {
    const scoreA = userSide === 'A' ? myWins : myLosses
    const scoreB = userSide === 'A' ? myLosses : myWins
    matchesApi.submitResult(REAL_MATCH_ID, { scoreA, scoreB }).then(() => {
      setShowReportModal(false)
      refreshMatch()
    }).catch((err: any) => {
      const msg = err?.message || 'Failed to report score'
      setMsgs(p => [...p, { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:`Error: ${msg}`, type:'system' }])
      setShowReportModal(false)
    })
  }

  if (loading) return (
    <div style={{ background:'#0B0B12', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Rajdhani, sans-serif', fontSize:14, color:'#8890A4' }}>Loading match...</div>
    </div>
  )
  if (error || !match || !teamA || !teamB) return (
    <div style={{ background:'#0B0B12', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Rajdhani, sans-serif', fontSize:14, color:'#ef4444' }}>{error || 'Match not found'}</div>
    </div>
  )

  const isActive = ['live','accepted','pending'].includes(matchStatus)

  return (
    <div style={{ background:'#0B0B12', minHeight:'100vh' }}>

      {showReportModal && <ReportScoreModal bestOf={bestOf} onSubmit={handleReportScore} onClose={()=>setShowReportModal(false)} />}

      {/* ── Page Header ── */}
      <div style={{ maxWidth:1200, width:'100%', margin:'20px auto 0', padding:'0 16px', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ background:'linear-gradient(135deg,#1A5C9E,#2A6CC4)', boxShadow:'0 0 14px rgba(26,92,158,.3)', borderRadius:8, padding:'6px 14px', fontSize:11, fontWeight:700, color:'#fff', fontFamily:'Rajdhani, sans-serif', letterSpacing:.6, flexShrink:0 }}>
              TOURNAMENT MATCH
            </div>
            <div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff', lineHeight:1 }}>
                {teamA.name} <span style={{ color:'#4F5568', fontSize:16, fontWeight:400 }}>vs</span> {teamB.name}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:6, padding:'5px 12px' }}>
              <span style={{ fontSize:9, color:'#4F5568', fontFamily:'Rajdhani, sans-serif', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Match</span>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:14, color:'#fff', letterSpacing:1 }}>{REAL_MATCH_ID}</span>
              <span style={{ background: matchStatus==='completed'?'rgba(74,222,128,.15)':'rgba(184,44,44,.2)', border:`1px solid ${matchStatus==='completed'?'rgba(74,222,128,.35)':'rgba(184,44,44,.4)'}`, borderRadius:3, padding:'1px 6px', fontSize:9, fontWeight:700, color:matchStatus==='completed'?'#4ade80':'#ff6b6b', fontFamily:'Rajdhani, sans-serif', letterSpacing:.4 }}>{matchStatus.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3-Col Grid ── */}
      <div style={{ maxWidth:1200, width:'100%', margin:'0 auto 32px', padding:'0 16px', boxSizing:'border-box' }}>
        <div style={{ background:'#0F0F18', border:'1px solid rgba(255,255,255,.055)', borderRadius:10, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 300px 1fr' }}>

          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', borderRight:'1px solid rgba(255,255,255,.055)' }}>
            <TeamBanner team={teamA} side="left" />
            <SectLabel>Players</SectLabel>
            {teamA.players.length > 0 ? teamA.players.map((p,i) => <PlayerRow key={i} player={p} side="left" />) : (
              <div style={{ padding:'20px 16px', fontSize:11, color:'#4F5568', fontStyle:'italic' }}>No players listed</div>
            )}
          </div>

          {/* CENTER */}
          <div style={{ display:'flex', flexDirection:'column', background:'#0B0B12', borderRight:'1px solid rgba(255,255,255,.055)' }}>

            {/* Result / Tournament Info bar */}
            <div style={{ margin:'12px 14px 4px', background:ACCENT_DIM, border:`1px solid ${ACCENT_BDR}`, borderRadius:6, padding:'10px 14px', textAlign:'center' }}>
              {matchStatus === 'completed' && match?.winnerId ? (
                <>
                  <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'#4F5568', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Match Result</div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'#4ade80', lineHeight:1, marginBottom:4 }}>
                    {match.winnerName || 'Winner'} wins!
                  </div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:24, color:'#fff', lineHeight:1 }}>
                    {match.scoreA} - {match.scoreB}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'#4F5568', textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>Tournament</div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:16, color:ACCENT, lineHeight:1 }}>{match.tournamentRound || 'Round 1'}</div>
                  <div style={{ fontSize:9, color:'#8890A4', marginTop:4, fontFamily:'Rajdhani, sans-serif' }}>
                    {gameName} · {formatStr} · {bestOf === 'BO1' ? 'Best of 1' : bestOf === 'BO3' ? 'Best of 3' : 'Best of 5'}
                  </div>
                </>
              )}
            </div>

            <SectLabel>Match Details</SectLabel>
            <div style={{ padding:'4px 16px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
              {[
                { label:'Match ID',  val:REAL_MATCH_ID, color:'#DDE0EA' },
                { label:'Type',      val:'Tournament',         color:ACCENT },
                { label:'Game',      val:gameName,              color:'#DDE0EA' },
                { label:'Format',    val:formatStr,             color:'#DDE0EA' },
                { label:'Series',    val:bestOf === 'BO1' ? 'Best of 1' : bestOf === 'BO3' ? 'Best of 3' : bestOf === 'BO5' ? 'Best of 5' : bestOf, color:'#DDE0EA' },
                { label:'Ruleset',   val:gamemode || 'Standard', color:'#8890A4' },
              ].map((d,i) => (
                <div key={i} style={{ paddingBottom:8 }}>
                  <div style={{ fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:.8, color:'#4F5568', fontFamily:'Rajdhani, sans-serif', marginBottom:2 }}>{d.label}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:d.color, fontFamily:'Rajdhani, sans-serif', lineHeight:1.3 }}>{d.val}</div>
                </div>
              ))}
            </div>

            <SectLabel>Maps &amp; Host</SectLabel>
            <div style={{ padding:'4px 16px 12px' }}>
              {Array.from({ length: bestOf === 'BO5' ? 5 : bestOf === 'BO3' ? 3 : 1 }).map((_, idx) => {
                const mapName = assignedMaps[idx] || 'Pending'
                const hostTeam = idx % 2 === 0 ? teamA : teamB
                const hostColor = idx % 2 === 0 ? '#B82C2C' : '#2A6CC4'
                return (
                  <div key={idx} style={{ display:'grid', gridTemplateColumns:'22px 26px 1fr auto', gap:6, alignItems:'center', padding:'5px 0', borderBottom: idx < (bestOf === 'BO5' ? 4 : bestOf === 'BO3' ? 2 : 0) ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12, color:'#4F5568', textAlign:'center' }}>{idx + 1}</span>
                    <div style={{ width:24, height:24, background:`linear-gradient(135deg,${hostColor}40,${hostColor}14)`, border:`1px solid ${hostColor}4D`, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={Solar.map} width={14} height={14} /></div>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color: mapName === 'Pending' ? '#4F5568' : '#DDE0EA', fontFamily:'Rajdhani, sans-serif', lineHeight:1.2 }}>{mapName}</div>
                      <div style={{ fontSize:9, color:'#4F5568', marginTop:1 }}>{gamemode || 'Standard'}</div>
                    </div>
                    <span style={{ background:`${hostColor}22`, border:`1px solid ${hostColor}44`, borderRadius:3, padding:'2px 6px', fontSize:8, fontWeight:700, color:hostColor, fontFamily:'Rajdhani, sans-serif', textTransform:'uppercase', whiteSpace:'nowrap' }}>{hostTeam.name}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,.055)' }}>
              <SectLabel>Match Chat</SectLabel>
              <div style={{ height:150, overflowY:'auto', padding:'4px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                {msgs.map((msg,i) => (
                  <div key={i} style={{ display:'flex', gap:8, flexDirection:msg.type==='sent'?'row-reverse':'row', alignItems:'flex-start' }}>
                    <div style={{ width:18, height:18, background:msg.bg, border:'1px solid rgba(255,255,255,.09)', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', fontSize:7, fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, color:msg.color, flexShrink:0 }}>{msg.initials}</div>
                    <div style={{ maxWidth:'80%' }}>
                      <div style={{ fontSize:9, color:'#8890A4', marginBottom:3, textAlign:msg.type==='sent'?'right':'left' }}>{msg.from}</div>
                      <div style={{ fontSize:9, padding:'5px 8px', color:msg.type==='system'?ACCENT:'#fff', lineHeight:1.5, background:msg.type==='sent'?'#B82C2C':msg.type==='system'?ACCENT_DIM:'#13131E', border:`1px solid ${msg.type==='system'?ACCENT_BDR:'rgba(255,255,255,.055)'}`, borderRadius:msg.type==='sent'?'5px 5px 0 5px':msg.type==='system'?5:'5px 5px 5px 0' }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,.055)', padding:'8px 16px', display:'flex', gap:8 }}>
                {['completed','disputed','cancelled'].includes(matchStatus) ? (
                  <div style={{ flex:1, padding:'6px 10px', background:'#13131E', border:'1px solid rgba(255,255,255,.05)', borderRadius:5, fontSize:11, color:'#4F5568', fontFamily:'Rajdhani, sans-serif', textAlign:'center' }}>Match ended</div>
                ) : (
                  <>
                    <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Message your opponent..." style={{ flex:1, background:'#13131E', border:'1px solid rgba(255,255,255,.09)', borderRadius:5, padding:'6px 10px', fontSize:11, color:'#fff', outline:'none', fontFamily:'Rajdhani, sans-serif' }} />
                    <button onClick={send} style={{ background:ACCENT, border:'none', borderRadius:5, padding:'6px 14px', fontSize:11, fontWeight:700, color:'#000', cursor:'pointer', fontFamily:'Rajdhani, sans-serif' }}>Send</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,.055)', padding:'10px 16px', display:'flex', gap:8, flexWrap:'wrap' }}>
              {isActive && (
                <button onClick={() => {
                  if (staffRequested) return
                  setStaffRequested(true)
                  supportApi.requestStaff({
                    category: 'tournament',
                    contextId: REAL_MATCH_ID,
                    contextLabel: `Tournament Match: ${teamA?.name || 'Team A'} vs ${teamB?.name || 'Team B'}`,
                    message: `Staff requested for tournament match ${REAL_MATCH_ID}`,
                  }).then(() => {
                    setMsgs(p => [...p, { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:'Staff has been notified. A team member will join shortly.', type:'system' }])
                  }).catch(() => setStaffRequested(false))
                }} style={{ flex:1, padding:'7px 6px', background:'#191926', border:'1px solid rgba(255,255,255,.07)', borderRadius:7, fontSize:10, fontWeight:700, color: staffRequested ? '#4ade80' : '#F0AA1A', cursor:'pointer', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, whiteSpace:'nowrap', transition:'all .15s', minWidth:60 }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#252535'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#191926'}}>
                  {staffRequested ? 'Staff Requested' : 'Request Staff'}
                </button>
              )}
              {isActive && userSide && (
                <button onClick={() => setShowReportModal(true)} style={{ flex:1, padding:'7px 6px', background:'#191926', border:'1px solid rgba(255,255,255,.07)', borderRadius:7, fontSize:10, fontWeight:700, color:'#ef4444', cursor:'pointer', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, whiteSpace:'nowrap', transition:'all .15s', minWidth:60 }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#252535'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#191926'}}>
                  Report Match
                </button>
              )}
              <button onClick={() => { window.location.href = `/tournaments/${tournamentId}` }} style={{ flex:1, padding:'7px 6px', background:'#191926', border:'1px solid rgba(255,255,255,.07)', borderRadius:7, fontSize:10, fontWeight:700, color:ACCENT, cursor:'pointer', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, whiteSpace:'nowrap', transition:'all .15s', minWidth:60 }}
                onMouseEnter={e=>{e.currentTarget.style.background='#252535'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#191926'}}>
                View Bracket
              </button>
            </div>

          </div>

          {/* RIGHT */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            <TeamBanner team={teamB} side="right" />
            <SectLabel>Players</SectLabel>
            {teamB.players.length > 0 ? teamB.players.map((p,i) => <PlayerRow key={i} player={p} side="right" />) : (
              <div style={{ padding:'20px 16px', fontSize:11, color:'#4F5568', fontStyle:'italic' }}>No players listed</div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes tm-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}