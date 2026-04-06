'use client'

// FILE: app/matches/xp/[matchId]/page.tsx

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { matchesApi, supportApi } from '@/lib/api'
import { sendActivity } from '@/lib/socket'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// ─── ACCENT COLOR: Purple / XP ─────────────────────────
const ACCENT      = '#A78BFA'
const ACCENT_DARK = '#7C3AED'
const ACCENT_DIM  = 'rgba(124,58,237,.15)'
const ACCENT_BDR  = 'rgba(124,58,237,.25)'


interface Player {
  initials: string; name: string; slug: string; platform: 'psn'|'xbox'|'pc'; platformHandle: string
  online: boolean; premium: boolean; isCoach: boolean; rep: number; repLabel: string; repColor: string
  goldTrophies: number; silverTrophies: number; bronzeTrophies: number
  wins: number; losses: number; gameRank: number | null
  socials: { ttv?: string; tw?: string; yt?: string }
  avatarGrad: string; avatarBorder: string; isYou?: boolean; usernameColor?: string
  avatarUrl?: string; xpDelta?: number
}
interface Team {
  name: string; slug: string; emoji: string; ladderRank: number; record: string; winPct: string
  wins: number; losses: number
  bannerGrad: string; teamBorder: string; players: Player[]; isHost?: boolean
  logoUrl?: string; bannerUrl?: string
}

const TEAM_A: Team = {
  name: 'Alpha Squad', slug: 'alpha-squad', emoji: '⚡', ladderRank: 3, record: '61W / 12L', winPct: '83.6%',
  wins: 61, losses: 12,
  bannerGrad: 'linear-gradient(135deg,#1C0606 0%,#320A0A 35%,#0E0E1C 100%)',
  teamBorder: '#B82C2C', isHost: true,
  players: [
    { initials:'JS', name:'JSDesigner',  slug:'jsdesigner',  platform:'psn',  platformHandle:'JSDesign_PS5',   online:true,  premium:true, isCoach:false, rep:88, repLabel:'Elite',   repColor:'#F0AA1A', goldTrophies:5, silverTrophies:6, bronzeTrophies:3, wins:87,  losses:22, gameRank:12,  socials:{ttv:'jsdesigner',tw:'jsdesigner_tv'}, avatarGrad:'linear-gradient(135deg,#13131E,#191926)', avatarBorder:'#F0AA1A', isYou:true },
    { initials:'VX', name:'VortexX',     slug:'vortexx',     platform:'psn',  platformHandle:'VortexX_PSN',    online:true,  premium:true, isCoach:false, rep:76, repLabel:'Veteran', repColor:'#3CC8C8', goldTrophies:3, silverTrophies:4, bronzeTrophies:2, wins:64,  losses:31, gameRank:28,  socials:{ttv:'vortexx_tv',yt:'vortexx'},        avatarGrad:'linear-gradient(135deg,#0D1A0D,#102010)', avatarBorder:'rgba(184,44,44,.4)' },
    { initials:'RZ', name:'RaZor_99',    slug:'razor-99',    platform:'pc',   platformHandle:'RaZor99#Battle', online:true,  premium:false, isCoach:true,  rep:62, repLabel:'Skilled', repColor:'#4A9EFF', goldTrophies:1, silverTrophies:2, bronzeTrophies:2, wins:48,  losses:29, gameRank:41,  socials:{tw:'razor99gg'},                       avatarGrad:'linear-gradient(135deg,#0D0D1A,#10102A)', avatarBorder:'rgba(184,44,44,.3)' },
    { initials:'NK', name:'NightKing',   slug:'nightking',   platform:'xbox', platformHandle:'NightKing XBOX', online:false, premium:false, isCoach:false, rep:44, repLabel:'Regular', repColor:'#8890A4', goldTrophies:0, silverTrophies:1, bronzeTrophies:2, wins:33,  losses:28, gameRank:77,  socials:{},                                    avatarGrad:'linear-gradient(135deg,#1A0D0D,#2A1010)', avatarBorder:'rgba(184,44,44,.3)' },
    { initials:'CE', name:'CE_Blake',    slug:'ce-blake',    platform:'psn',  platformHandle:'CE_BlakePS',     online:true,  premium:false, isCoach:false, rep:55, repLabel:'Skilled', repColor:'#4A9EFF', goldTrophies:1, silverTrophies:1, bronzeTrophies:2, wins:39,  losses:27, gameRank:59,  socials:{ttv:'ceblake',tw:'ceblake_gg',yt:'ceblake'}, avatarGrad:'linear-gradient(135deg,#0D1A1A,#102020)', avatarBorder:'rgba(184,44,44,.3)' },
  ],
}
const TEAM_B: Team = {
  name: 'Bravo Unit', slug: 'bravo-unit', emoji: '🛡️', ladderRank: 8, record: '44W / 9L', winPct: '83.0%',
  wins: 44, losses: 9,
  bannerGrad: 'linear-gradient(135deg,#060C1C 0%,#0A1432 35%,#0E0E1C 100%)',
  teamBorder: '#2A6CC4', isHost: false,
  players: [
    { initials:'GS', name:'GhostSniper', slug:'ghostsniper', platform:'psn',  platformHandle:'GhostSnpr_PS',    online:true,  premium:true, isCoach:false, rep:91, repLabel:'Legend',  repColor:'#F0AA1A', goldTrophies:8, silverTrophies:7, bronzeTrophies:6, wins:112, losses:18, gameRank:5,   socials:{ttv:'ghostsniper',tw:'ghostsniper_gg'}, avatarGrad:'linear-gradient(135deg,#1A0A2A,#251030)', avatarBorder:'rgba(184,44,44,.4)' },
    { initials:'TK', name:'TacticalKev', slug:'tacticalkev', platform:'xbox', platformHandle:'TacKev_XBX',      online:true,  premium:true, isCoach:false, rep:79, repLabel:'Veteran', repColor:'#3CC8C8', goldTrophies:4, silverTrophies:4, bronzeTrophies:3, wins:73,  losses:24, gameRank:19,  socials:{tw:'tacticalkev'},                     avatarGrad:'linear-gradient(135deg,#0A1A0A,#102010)', avatarBorder:'rgba(184,44,44,.3)' },
    { initials:'NW', name:'NightWolfe',  slug:'nightwolfe',  platform:'pc',   platformHandle:'NightWolfe#4892', online:true,  premium:false, isCoach:false, rep:58, repLabel:'Skilled', repColor:'#4A9EFF', goldTrophies:1, silverTrophies:3, bronzeTrophies:2, wins:51,  losses:33, gameRank:33,  socials:{ttv:'nightwolfe',yt:'nightwolfe_yt'},   avatarGrad:'linear-gradient(135deg,#0A0A1A,#101022)', avatarBorder:'rgba(184,44,44,.3)' },
    { initials:'KX', name:'KingXavier',  slug:'kingxavier',  platform:'psn',  platformHandle:'KingXav_PSN',     online:true,  premium:false, isCoach:false, rep:51, repLabel:'Skilled', repColor:'#4A9EFF', goldTrophies:0, silverTrophies:2, bronzeTrophies:2, wins:42,  losses:31, gameRank:50,  socials:{ttv:'kingxavier',tw:'kingxavier_tv',yt:'kingxavier'}, avatarGrad:'linear-gradient(135deg,#1A150A,#2A2010)', avatarBorder:'rgba(184,44,44,.3)' },
    { initials:'SQ', name:'Squid_G',     slug:'squid-g',     platform:'psn',  platformHandle:'SquidG_PS',       online:false, premium:false, isCoach:false, rep:38, repLabel:'Regular', repColor:'#8890A4', goldTrophies:0, silverTrophies:0, bronzeTrophies:2, wins:28,  losses:22, gameRank:88,  socials:{},                                    avatarGrad:'linear-gradient(135deg,#1A1A0A,#2A2A10)', avatarBorder:'rgba(184,44,44,.3)' },
  ],
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
          {player.isYou && <div style={{ position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',background:'rgba(167,139,250,.9)',borderRadius:3,padding:'1px 4px',fontSize:6,fontWeight:900,color:'#000',whiteSpace:'nowrap' }}>YOU</div>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:5,flexDirection:isR?'row-reverse':'row',flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Rajdhani, sans-serif',fontWeight:700,fontSize:13,color:hover?ACCENT:(player.usernameColor||'#fff'),whiteSpace:'nowrap',transition:'color .15s' }}>{player.name}</span>
            {player.xpDelta !== undefined && player.xpDelta !== 0 && (
              <span style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:800,fontSize:11,color:player.xpDelta>0?'#4ade80':'#ef4444',whiteSpace:'nowrap' }}>
                {player.xpDelta > 0 ? `+${player.xpDelta}` : player.xpDelta} XP
              </span>
            )}
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

function TeamBanner({ team, side }: { team:Team; side:'left'|'right' }) {
  const isR = side === 'right'
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position:'relative',height:100,overflow:'hidden' }}>
      <div style={{ position:'absolute',inset:0,background:team.bannerGrad }} />
      {team.bannerUrl && <img src={team.bannerUrl} alt="" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:.45 }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />}
      <div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 0%,rgba(15,15,24,.96) 100%)' }} />
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'flex-end',padding:'0 16px 10px',flexDirection:isR?'row-reverse':'row',gap:12 }}>
        <div style={{ width:54,height:54,background:'#13131E',border:`2px solid ${team.teamBorder}`,boxShadow:`0 0 14px ${team.teamBorder}66`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,flexShrink:0,overflow:'hidden' }}>
          {team.logoUrl ? <img src={team.logoUrl} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';e.currentTarget.parentElement!.textContent=team.emoji}} /> : team.emoji}
        </div>
        <div style={{ flex:1,textAlign:isR?'right':'left' }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,justifyContent:isR?'flex-end':'flex-start',flexWrap:'wrap' }}>
            <Link href={`/teams/${team.slug}`} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
              style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:20,color:hover?ACCENT:'#fff',lineHeight:1,textDecoration:'none',transition:'color .15s' }}>
              {team.name}
            </Link>
            {team.isHost
              ? <span style={{ background:'rgba(184,44,44,.2)',border:'1px solid rgba(184,44,44,.3)',borderRadius:3,padding:'2px 7px',fontSize:9,fontWeight:700,color:'#D94040',fontFamily:'Rajdhani, sans-serif',letterSpacing:.4 }}>HOST</span>
              : <span style={{ background:'rgba(42,108,196,.2)',border:'1px solid rgba(42,108,196,.3)',borderRadius:3,padding:'2px 7px',fontSize:9,fontWeight:700,color:'#5A9FD4',fontFamily:'Rajdhani, sans-serif',letterSpacing:.4 }}>AWAY</span>
            }
          </div>
          <div style={{ display:'flex',gap:8,marginTop:5,justifyContent:isR?'flex-end':'flex-start',alignItems:'center' }}>
            <span style={{ background:ACCENT_DIM,border:`1px solid ${ACCENT_BDR}`,borderRadius:3,padding:'2px 8px',fontSize:9,fontWeight:700,color:ACCENT,fontFamily:'Rajdhani, sans-serif' }}>#{team.ladderRank}</span>
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
function ReportScoreModal({ bestOf, onSubmit, onClose }: { bestOf: string; onSubmit: (myWins: number, myLosses: number, repRating: number) => void; onClose: () => void }) {
  const [myScore, setMyScore] = useState('')
  const [oppScore, setOppScore] = useState('')
  const [repRating, setRepRating] = useState<number>(3) // Good=5, Neutral=3, Bad=1
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

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:6 }}>Opponent Reputation</div>
          <div style={{ display:'flex',gap:8 }}>
            {([
              { label:'Good', value:5, color:'#4ade80', bg:'rgba(74,222,128,.1)', border:'rgba(74,222,128,.3)' },
              { label:'Neutral', value:3, color:'#8890A4', bg:'rgba(136,144,164,.1)', border:'rgba(136,144,164,.3)' },
              { label:'Bad', value:1, color:'#ef4444', bg:'rgba(239,68,68,.1)', border:'rgba(239,68,68,.3)' },
            ] as const).map(opt => (
              <button key={opt.value} onClick={()=>setRepRating(opt.value)}
                style={{ flex:1,padding:'7px 6px',background:repRating===opt.value?opt.bg:'transparent',border:`1px solid ${repRating===opt.value?opt.border:'rgba(255,255,255,.07)'}`,borderRadius:5,fontSize:11,fontWeight:700,color:repRating===opt.value?opt.color:'#4F5568',cursor:'pointer',fontFamily:'Rajdhani, sans-serif',transition:'all .15s' }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize:9,color:'#4F5568',marginTop:4,fontFamily:'Rajdhani, sans-serif' }}>Rate your opponent&apos;s sportsmanship</div>
        </div>

        <button onClick={()=>canSubmit && onSubmit(Number(myScore), Number(oppScore), repRating)} disabled={!canSubmit}
          style={{ width:'100%',padding:'9px',background:ACCENT_DARK,border:'none',borderRadius:6,fontSize:12,fontWeight:700,color:'#fff',cursor:canSubmit?'pointer':'not-allowed',fontFamily:'Rajdhani, sans-serif',opacity:canSubmit?1:0.4,marginBottom:8 }}>
          Submit Report
        </button>
        <button onClick={onClose} style={{ width:'100%',padding:'8px',background:'#191926',border:'1px solid rgba(255,255,255,.07)',borderRadius:6,fontSize:11,fontWeight:700,color:'#8890A4',cursor:'pointer',fontFamily:'Rajdhani, sans-serif' }}>Cancel</button>
      </div>
    </div>
  )
}

function CreateTicketModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [category, setCategory] = useState('Score Dispute')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await supportApi.create({ matchId, category, description: description.trim() })
      setDone(true)
    } catch (e) { console.error(e) }
    setSubmitting(false)
  }

  return (
    <div style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.7)' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'#13131E',border:'1px solid rgba(255,255,255,.1)',borderRadius:10,padding:24,width:380 }}>
        {done ? (
          <>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:18,color:'#4ade80',marginBottom:8 }}>Ticket Submitted</div>
            <div style={{ fontSize:11,color:'#8890A4',marginBottom:16,fontFamily:'Rajdhani, sans-serif' }}>Our support team will review your ticket shortly.</div>
            <button onClick={onClose} style={{ width:'100%',padding:'8px',background:ACCENT_DARK,border:'none',borderRadius:6,fontSize:11,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'Rajdhani, sans-serif' }}>Close</button>
          </>
        ) : (
          <>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif',fontWeight:900,fontSize:18,color:'#fff',marginBottom:4 }}>Create a Ticket</div>
            <div style={{ fontSize:11,color:'#8890A4',marginBottom:16,fontFamily:'Rajdhani, sans-serif' }}>Submit a support ticket for this match.</div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:4 }}>Match ID</div>
              <div style={{ padding:'6px 10px',background:'#0B0B12',border:'1px solid rgba(255,255,255,.07)',borderRadius:5,fontSize:12,color:'#8890A4',fontFamily:'Rajdhani, sans-serif' }}>#{matchId}</div>
            </div>
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:4 }}>Category</div>
              <select value={category} onChange={e=>setCategory(e.target.value)} style={{ width:'100%',padding:'6px 10px',background:'#0B0B12',border:'1px solid rgba(255,255,255,.07)',borderRadius:5,fontSize:11,color:'#fff',fontFamily:'Rajdhani, sans-serif',outline:'none' }}>
                <option>Score Dispute</option>
                <option>Player Conduct</option>
                <option>Technical Issue</option>
                <option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9,fontWeight:700,textTransform:'uppercase',letterSpacing:.8,color:'#4F5568',fontFamily:'Rajdhani, sans-serif',marginBottom:4 }}>Description</div>
              <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="Describe your issue..." style={{ width:'100%',padding:'6px 10px',background:'#0B0B12',border:'1px solid rgba(255,255,255,.07)',borderRadius:5,fontSize:11,color:'#fff',fontFamily:'Rajdhani, sans-serif',outline:'none',resize:'vertical' }} />
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={onClose} style={{ flex:1,padding:'8px',background:'#191926',border:'1px solid rgba(255,255,255,.07)',borderRadius:6,fontSize:11,fontWeight:700,color:'#8890A4',cursor:'pointer',fontFamily:'Rajdhani, sans-serif' }}>Cancel</button>
              <button onClick={submit} disabled={submitting || !description.trim()} style={{ flex:1,padding:'8px',background:ACCENT_DARK,border:'none',borderRadius:6,fontSize:11,fontWeight:700,color:'#fff',cursor:'pointer',fontFamily:'Rajdhani, sans-serif',opacity:submitting||!description.trim()?0.5:1 }}>{submitting ? 'Submitting...' : 'Submit Ticket'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────
function buildTeam(match: any, side: 'A' | 'B', fallback: Team): Team {
  if (!match) return fallback
  const name    = side === 'A' ? match.teamAName : match.teamBName
  const slug    = side === 'A' ? match.teamASlug : match.teamBSlug
  const emoji   = side === 'A' ? (match.teamAEmoji || '🎮') : (match.teamBEmoji || '🎮')
  const players = (side === 'A' ? match.teamAPlayers : match.teamBPlayers) || []
  const teamStats = side === 'A' ? match.teamAStats : match.teamBStats
  const w = teamStats?.wins ?? (side === 'A' ? match.teamAWins : match.teamBWins) ?? fallback.wins
  const l = teamStats?.losses ?? (side === 'A' ? match.teamALosses : match.teamBLosses) ?? fallback.losses
  const pct = (w + l) > 0 ? ((w / (w + l)) * 100).toFixed(1) + '%' : '0%'
  const rank = teamStats?.ladderRank ?? (side === 'A' ? match.teamARank : match.teamBRank) ?? fallback.ladderRank
  return {
    name:       name || fallback.name,
    slug:       slug || fallback.slug,
    emoji,
    ladderRank: rank,
    record:     `${w}W / ${l}L`,
    winPct:     pct,
    wins:       w,
    losses:     l,
    bannerGrad: side === 'A' ? 'linear-gradient(135deg,#1C0606 0%,#320A0A 35%,#0E0E1C 100%)' : 'linear-gradient(135deg,#060C1C 0%,#0A1432 35%,#0E0E1C 100%)',
    teamBorder: side === 'A' ? '#B82C2C' : '#2A6CC4',
    isHost:     side === 'A',
    logoUrl:    teamStats?.logoUrl || '',
    bannerUrl:  teamStats?.bannerUrl || '',
    players:    players.length > 0 ? players.map((p: any) => {
      // Determine primary platform from gamertags or psnId/xboxGamertag
      const gt = (p.gamertags || [])[0]
      const platform = gt?.platform === 'xbox' ? 'xbox' : gt?.platform === 'pc' ? 'pc' : 'psn'
      const handle = gt?.tag || p.psnId || p.xboxGamertag || p.activisionId || ''
      // Convert socials array [{label,url}] to {ttv?,tw?,yt?}
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
    }) : fallback.players,
  }
}

// ─── PAGE ──────────────────────────────────────────────
export default function MatchDetail({ matchType }: { matchType?: "universal" | "tournament" }) {
  const params = useParams()
  const matchId = params?.matchId as string
  const { user } = useAuth()
  const [match, setMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { sendActivity('In a Match') }, [])

  useEffect(() => {
    if (matchId) {
      setLoading(true)
      matchesApi.getById(matchId)
        .then(setMatch)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [matchId])

  const REAL_MATCH_ID = match?.matchId || matchId || ''

  const teamA = buildTeam(match, 'A', TEAM_A)
  const teamB = buildTeam(match, 'B', TEAM_B)

  // Mark current user + assign per-player XP deltas for completed non-tournament matches
  if (user && match) {
    const markYou = (players: Player[]) => players.map(p => ({
      ...p,
      isYou: p.slug === (user as any).slug || p.name === user.username,
    }))
    teamA.players = markYou(teamA.players)
    teamB.players = markYou(teamB.players)
  }
  if (match?.status === 'completed' && match.winnerId && !match.tournamentId) {
    const teamAWon = match.winnerId === match.teamAId
    const xpWin = match.xpWin || 0
    const xpLoss = match.xpLoss || 0
    teamA.players = teamA.players.map(p => ({ ...p, xpDelta: teamAWon ? xpWin : -xpLoss }))
    teamB.players = teamB.players.map(p => ({ ...p, xpDelta: teamAWon ? -xpLoss : xpWin }))
  }

  // Determine which team the current user is on
  const userTeamId = (() => {
    if (!user || !match) return null
    const uid = (user as any)._id || (user as any).id
    if (match.teamAPlayers?.some((p: any) => p.userId === uid)) return match.teamAId
    if (match.teamBPlayers?.some((p: any) => p.userId === uid)) return match.teamBId
    return null
  })()
  const userSide: 'A' | 'B' | null = (() => {
    if (!user || !match) return null
    const uid = (user as any)._id || (user as any).id
    if (match.teamAPlayers?.some((p: any) => p.userId === uid)) return 'A'
    if (match.teamBPlayers?.some((p: any) => p.userId === uid)) return 'B'
    return null
  })()

  const matchStatus = match?.status || 'live'
  const gameName    = match?.game || 'Warzone'
  const gamemode     = match?.assignedGamemode || match?.gamemode || ''
  const assignedMap  = match?.assignedMap || ''
  const assignedMaps: string[] = match?.assignedMaps?.length ? match.assignedMaps : (assignedMap ? [assignedMap] : [])
  const bestOf       = match?.bestOf || 'BO1'
  const ladderName  = match?.ladderName || match?.ladder || ''
  const formatStr   = match?.format || 'Squad'
  const isTournament = !!(match?.tournamentId)

  const [timer,   setTimer]   = useState(254)
  const [chatMsg, setChatMsg] = useState('')
  const [msgs, setMsgs] = useState<any[]>([])
  const [showReportModal, setShowReportModal] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [staffRequested, setStaffRequested] = useState(false)

  const chatBoxRef     = useRef<HTMLDivElement>(null)
  const atBottomRef    = useRef(true)
  const [unread, setUnread] = useState(0)

  const scrollToBottom = useCallback((force?: boolean) => {
    const el = chatBoxRef.current
    if (!el) return
    if (force || atBottomRef.current) {
      el.scrollTop = el.scrollHeight
      setUnread(0)
    }
  }, [])

  useEffect(() => {
    if (match?.chat?.length) {
      const myUsername = user?.username
      setMsgs(match.chat.map((c: any) => {
        const isSystem = c.type === 'system'
        const isMine   = !isSystem && myUsername && c.username === myUsername
        return {
          from:     c.username || 'System',
          initials: c.initials || (c.username || 'SY').slice(0, 2).toUpperCase(),
          color:    isSystem ? ACCENT : isMine ? '#fff' : '#8890A4',
          bg:       isSystem ? ACCENT_DIM : isMine ? '#B82C2C' : '#13131E',
          text:     c.text,
          type:     isSystem ? 'system' : isMine ? 'sent' : 'recv',
        }
      }))
    } else {
      setMsgs([
        { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:`Match ${REAL_MATCH_ID} created. XP ladder match.`, type:'system' },
      ])
    }
  }, [match, user?.username])

  useEffect(() => {
    const t = setInterval(() => setTimer(s => s > 0 ? s - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  // Poll for new chat messages every 3 seconds
  useEffect(() => {
    if (!REAL_MATCH_ID) return
    const myUsername = user?.username
    const poll = () => {
      matchesApi.getChat(REAL_MATCH_ID).then((data: any) => {
        const chatArr: any[] = Array.isArray(data) ? data : (data?.chat || [])
        if (!chatArr.length) return
        setMsgs(chatArr.map((c: any) => {
          const isSystem = c.type === 'system'
          const isMine   = !isSystem && myUsername && c.username === myUsername
          return {
            from:     c.username || 'System',
            initials: c.initials || (c.username || 'SY').slice(0, 2).toUpperCase(),
            color:    isSystem ? ACCENT : isMine ? '#fff' : '#8890A4',
            bg:       isSystem ? ACCENT_DIM : isMine ? '#B82C2C' : '#13131E',
            text:     c.text,
            type:     isSystem ? 'system' : isMine ? 'sent' : 'recv',
          }
        }))
      }).catch(() => {})
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [REAL_MATCH_ID, user?.username])

  // Auto-scroll or show unread badge, like WhatsApp
  const prevMsgCountRef = useRef(0)
  useEffect(() => {
    const newCount = msgs.length - prevMsgCountRef.current
    prevMsgCountRef.current = msgs.length
    if (newCount > 0 && !atBottomRef.current) {
      setUnread(u => u + newCount)
    } else {
      scrollToBottom()
    }
  }, [msgs, scrollToBottom])

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`
  const send = () => {
    if (!chatMsg.trim()) return
    const username = user?.username || 'You'
    setMsgs(p => [...p, { from: username, initials: username.slice(0, 2).toUpperCase(), color:'#fff', bg:'#B82C2C', text:chatMsg.trim(), type:'sent' }])
    matchesApi.sendChat(REAL_MATCH_ID, { text: chatMsg.trim() }).catch(console.error)
    setChatMsg('')
    // Always scroll to bottom when you send — force regardless of position
    setTimeout(() => scrollToBottom(true), 0)
  }

  const refreshMatch = () => matchesApi.getById(REAL_MATCH_ID).then(setMatch).catch(console.error)

  const handleReportScore = (myWins: number, myLosses: number, repRating: number) => {
    const scoreA = userSide === 'A' ? myWins : myLosses
    const scoreB = userSide === 'A' ? myLosses : myWins
    matchesApi.submitResult(REAL_MATCH_ID, { scoreA, scoreB }).then(() => {
      // Submit reputation feedback (fire-and-forget)
      matchesApi.submitFeedback(REAL_MATCH_ID, { rating: repRating, comment: '' }).catch(() => {})
      setShowReportModal(false)
      refreshMatch()
    }).catch((err: any) => {
      const msg = err?.message || err?.data?.message || 'Failed to report score'
      setMsgs(p => [...p, { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:`Error: ${msg}`, type:'system' }])
      setShowReportModal(false)
    })
  }

  const handleCancel = () => {
    if (!userTeamId) return
    matchesApi.requestCancel(REAL_MATCH_ID, userTeamId).then(() => {
      refreshMatch()
    }).catch(console.error)
  }

  if (loading) {
    return (
      <div style={{ background:'#0d121b', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ width:40, height:40, border:`3px solid ${ACCENT_BDR}`, borderTopColor:ACCENT, borderRadius:'50%', margin:'0 auto 16px', animation:'match-spin 0.8s linear infinite' }} />
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:16, color:'#4F5568', letterSpacing:1 }}>LOADING MATCH</div>
          {matchId && <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:12, color:'#2D3142', marginTop:6 }}>{matchId}</div>}
          <style>{`@keyframes match-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div style={{ background:'#0d121b', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 420, background:'#0F0F18', border:'1px solid rgba(255,255,255,.055)', borderRadius:12, padding:32, textAlign:'center', boxShadow:'0 10px 40px rgba(0,0,0,.5)' }}>
          <div style={{ width:56, height:56, background:'linear-gradient(135deg, rgba(239,68,68,.15), rgba(239,68,68,.02))', border:`1px solid rgba(239,68,68,.3)`, borderRadius:'50%', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(239,68,68,.1)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z" fill="#ef4444"/>
            </svg>
          </div>
          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:28, color:'#fff', letterSpacing:1, textTransform:'uppercase', lineHeight:1 }}>MATCH NOT FOUND</div>
          <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:600, fontSize:14, color:'#8890A4', marginTop:12, lineHeight:1.5 }}>
            The match you are looking for does not exist, has been cancelled, or you don't have permission to view it.
          </div>
          
          {matchId && (
            <div style={{ marginTop: 20, background:'#0B0B12', border:'1px solid rgba(255,255,255,.05)', borderRadius:6, padding:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, color:'#4F5568', fontFamily:'Rajdhani, sans-serif' }}>Match ID</span>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:16, color:'#DDE0EA', letterSpacing:1 }}>{matchId}</span>
            </div>
          )}
          
          <div style={{ marginTop: 28 }}>
            <Link href="/dashboard" style={{ display:'block', width:'100%', background:'#191926', border:'1px solid rgba(255,255,255,.07)', borderRadius:6, padding:'12px', fontSize:13, fontWeight:700, color:'#fff', textDecoration:'none', fontFamily:'Rajdhani, sans-serif', textTransform:'uppercase', letterSpacing:1, transition:'all .15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#252535'; e.currentTarget.style.borderColor='rgba(255,255,255,.15)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='#191926'; e.currentTarget.style.borderColor='rgba(255,255,255,.07)'}}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'#0d121b', minHeight:'100vh' }}>

      {showReportModal && <ReportScoreModal bestOf={bestOf} onSubmit={handleReportScore} onClose={()=>setShowReportModal(false)} />}
      {showTicketModal && <CreateTicketModal matchId={REAL_MATCH_ID} onClose={()=>setShowTicketModal(false)} />}

      {/* ── Page Header ── */}
      <div style={{ maxWidth:1200, width:'100%', margin:'20px auto 0', padding:'0 16px', boxSizing:'border-box' }}>

        {/* Title row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ background: isTournament ? 'linear-gradient(135deg,rgba(155,89,182,.6),rgba(155,89,182,.3))' : `linear-gradient(135deg,${ACCENT_DARK},rgba(124,58,237,.5))`, border:`1px solid ${isTournament ? 'rgba(155,89,182,.4)' : ACCENT_BDR}`, boxShadow:`0 0 14px ${isTournament ? 'rgba(155,89,182,.25)' : 'rgba(124,58,237,.25)'}`, borderRadius:8, padding:'6px 14px', fontSize:11, fontWeight:700, color:'#fff', fontFamily:'Rajdhani, sans-serif', letterSpacing:.6, flexShrink:0 }}>
              {isTournament ? 'TOURNAMENT MATCH' : 'XP LADDER MATCH'}
            </div>
            <div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff', lineHeight:1 }}>
                {teamA.name} <span style={{ color:'#4F5568', fontSize:16, fontWeight:400 }}>vs</span> {teamB.name}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Match ID */}
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:6, padding:'5px 12px' }}>
              <span style={{ fontSize:9, color:'#4F5568', fontFamily:'Rajdhani, sans-serif', fontWeight:700, letterSpacing:1, textTransform:'uppercase' }}>Match</span>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:14, color:'#fff', letterSpacing:1 }}>{REAL_MATCH_ID}</span>
              <span style={{ background: matchStatus==='completed'?'rgba(74,222,128,.15)':matchStatus==='disputed'?'rgba(239,68,68,.15)':matchStatus==='cancelled'?'rgba(136,144,164,.15)':'rgba(30,138,62,.2)', border:`1px solid ${matchStatus==='completed'?'rgba(74,222,128,.35)':matchStatus==='disputed'?'rgba(239,68,68,.35)':matchStatus==='cancelled'?'rgba(136,144,164,.35)':'rgba(30,138,62,.35)'}`, borderRadius:3, padding:'1px 6px', fontSize:9, fontWeight:700, color:matchStatus==='completed'?'#4ade80':matchStatus==='disputed'?'#ef4444':matchStatus==='cancelled'?'#8890A4':'#4ade80', fontFamily:'Rajdhani, sans-serif', letterSpacing:.4 }}>{matchStatus.toUpperCase()}</span>
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
            {teamA.players.map((p,i) => <PlayerRow key={i} player={p} side="left" />)}
          </div>

          {/* CENTER */}
          <div style={{ display:'flex', flexDirection:'column', background:'#0B0B12', borderRight:'1px solid rgba(255,255,255,.055)' }}>

            {/* XP stakes / Tournament result bar */}
            <div style={{ margin:'12px 14px 4px', background: isTournament ? 'rgba(155,89,182,.1)' : ACCENT_DIM, border:`1px solid ${isTournament ? 'rgba(155,89,182,.25)' : ACCENT_BDR}`, borderRadius:6, padding:'10px 14px', textAlign:'center' }}>
              {isTournament ? (
                <>
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
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:16, color:'#9B59B6', lineHeight:1 }}>{match?.tournamentRound || 'Round 1'}</div>
                      <div style={{ fontSize:9, color:'#8890A4', marginTop:4, fontFamily:'Rajdhani, sans-serif' }}>
                        {gameName} · {formatStr} · {bestOf === 'BO1' ? 'Best of 1' : bestOf === 'BO3' ? 'Best of 3' : 'Best of 5'}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'#4F5568', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>XP Stakes</div>
                  {matchStatus === 'completed' && match?.winnerId ? (
                    <>
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'#4ade80', lineHeight:1, marginBottom:6 }}>
                        {match.winnerName || 'Winner'} wins!
                      </div>
                      <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:24, color:'#fff', lineHeight:1, marginBottom:8 }}>
                        {match.scoreA} - {match.scoreB}
                      </div>
                      <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
                        <div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#4ade80', lineHeight:1 }}>{match.xpWin ? `+${match.xpWin}` : '+XP'}</div>
                          <div style={{ fontSize:9, color:'#4F5568', marginTop:2, fontFamily:'Rajdhani, sans-serif' }}>WINNER</div>
                        </div>
                        <div style={{ width:1, background:'rgba(255,255,255,.07)' }} />
                        <div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#ef4444', lineHeight:1 }}>{match.xpLoss ? `-${match.xpLoss}` : '-XP'}</div>
                          <div style={{ fontSize:9, color:'#4F5568', marginTop:2, fontFamily:'Rajdhani, sans-serif' }}>LOSER</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display:'flex', justifyContent:'center', gap:20 }}>
                        <div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#4ade80', lineHeight:1 }}>+XP</div>
                          <div style={{ fontSize:9, color:'#4F5568', marginTop:2, fontFamily:'Rajdhani, sans-serif' }}>WINNER</div>
                        </div>
                        <div style={{ width:1, background:'rgba(255,255,255,.07)' }} />
                        <div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#ef4444', lineHeight:1 }}>-XP</div>
                          <div style={{ fontSize:9, color:'#4F5568', marginTop:2, fontFamily:'Rajdhani, sans-serif' }}>LOSER</div>
                        </div>
                      </div>
                    </>
                  )}
                  <div style={{ fontSize:9, color:'#8890A4', marginTop:6, fontFamily:'Rajdhani, sans-serif' }}>XP applied to individual ladder rankings</div>
                </>
              )}
            </div>

            <SectLabel>Match Details</SectLabel>
            <div style={{ padding:'4px 16px 12px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px' }}>
              {[
                { label:'Match ID',  val:REAL_MATCH_ID,                                  color:'#DDE0EA' },
                { label:'Type',      val: isTournament ? 'Tournament' : 'XP Ladder',    color: isTournament ? '#9B59B6' : ACCENT },
                { label:'Game',      val:gameName,                                        color:'#DDE0EA' },
                { label: isTournament ? 'Round' : 'Ladder', val: isTournament ? (match?.tournamentRound || 'Round 1') : (ladderName || `${formatStr} XP`), color:'#DDE0EA' },
                { label:'Series',    val:bestOf === 'BO1' ? 'Best of 1' : bestOf === 'BO3' ? 'Best of 3' : bestOf === 'BO5' ? 'Best of 5' : bestOf, color:'#DDE0EA' },
                { label:'Premium',   val: match?.isPremium ? 'Yes' : 'No', color: match?.isPremium ? '#F39C12' : '#8890A4' },
                { label:'Ruleset',   val:gamemode || 'Standard', color:'#8890A4' },
              ].map((d,i) => (
                <div key={i} style={{ paddingBottom:8, gridColumn:i===6?'1 / -1':'auto' }}>
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
                  <div key={idx} style={{ display:'grid', gridTemplateColumns:'22px 26px 1fr auto', gap:6, alignItems:'center', padding:'5px 0' }}>
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12, color:'#4F5568', textAlign:'center' }}>{idx + 1}</span>
                    <div style={{ width:24, height:24, background:`linear-gradient(135deg,${hostColor}40,${hostColor}14)`, border:`1px solid ${hostColor}4D`, borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={Solar.building} width={14} height={14} style={{ opacity: 0.9 }} /></div>
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
              <div style={{ position:'relative' }}>
                <div
                  ref={chatBoxRef}
                  onScroll={() => {
                    const el = chatBoxRef.current
                    if (!el) return
                    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                    atBottomRef.current = isAtBottom
                    if (isAtBottom) setUnread(0)
                  }}
                  style={{ height:150, overflowY:'auto', padding:'4px 16px', display:'flex', flexDirection:'column', gap:8 }}
                >
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

                {/* Unread badge — shown when scrolled up and new messages arrive */}
                {unread > 0 && (
                  <button
                    onClick={() => scrollToBottom(true)}
                    style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:6, background:'#1C1C2E', border:'1px solid rgba(167,139,250,.35)', borderRadius:20, padding:'4px 12px 4px 8px', cursor:'pointer', boxShadow:'0 2px 12px rgba(0,0,0,.5)', zIndex:10 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 16l-6-6h12l-6 6z" fill={ACCENT}/></svg>
                    <span style={{ fontSize:10, fontWeight:700, color:ACCENT, fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>
                      {unread} new {unread === 1 ? 'message' : 'messages'}
                    </span>
                  </button>
                )}
              </div>
              <div style={{ borderTop:'1px solid rgba(255,255,255,.055)', padding:'8px 16px', display:'flex', gap:8 }}>
                {['completed','disputed','cancelled'].includes(matchStatus) ? (
                  <div style={{ flex:1, padding:'6px 10px', background:'#13131E', border:'1px solid rgba(255,255,255,.05)', borderRadius:5, fontSize:11, color:'#4F5568', fontFamily:'Rajdhani, sans-serif', textAlign:'center' }}>Match ended</div>
                ) : (
                  <>
                    <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Message your opponent..." style={{ flex:1, background:'#13131E', border:'1px solid rgba(255,255,255,.09)', borderRadius:5, padding:'6px 10px', fontSize:11, color:'#fff', outline:'none', fontFamily:'Rajdhani, sans-serif' }} />
                    <button onClick={send} style={{ background:ACCENT_DARK, border:'none', borderRadius:5, padding:'6px 14px', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'Rajdhani, sans-serif' }}>Send</button>
                  </>
                )}
              </div>
            </div>

            <div style={{ borderTop:'1px solid rgba(255,255,255,.055)', padding:'10px 16px', display:'flex', gap:8, flexWrap:'wrap' }}>
              {(() => {
                const isActive = ['live','accepted','pending'].includes(matchStatus)
                const isPremium = !!match?.isPremium
                const handleRequestStaff = () => {
                  if (staffRequested) return
                  setStaffRequested(true)
                  supportApi.requestStaff({
                    category: isPremium ? 'premium' : 'match',
                    contextId: REAL_MATCH_ID,
                    contextLabel: `XP Match: ${teamA.name} vs ${teamB.name}`,
                    message: `Staff requested for XP match ${REAL_MATCH_ID}`,
                  }).then(() => {
                    setMsgs(p => [...p, { from:'GH System', initials:'GH', color:ACCENT, bg:ACCENT_DIM, text:'Staff has been notified. A team member will join shortly.', type:'system' }])
                  }).catch(() => setStaffRequested(false))
                }
                const buttons = [
                  // Premium XP matches get Request Staff; non-premium get Create a Ticket
                  { label: staffRequested ? 'Staff Requested' : 'Request Staff', color: staffRequested ? '#4ade80' : '#F0AA1A', onClick: handleRequestStaff, show: isPremium },
                  { label:'Create a Ticket', color:'#8890A4', onClick: () => setShowTicketModal(true), show: !isPremium },
                  { label:'Report Match',    color:'#ef4444', onClick: () => setShowReportModal(true), show: isActive },
                  { label:'Cancel',          color:'#8890A4', onClick: handleCancel, show: isActive },
                ]
                return buttons.filter(b => b.show).map((btn,i) => (
                  <button key={i} onClick={btn.onClick} style={{ flex:1, padding:'7px 6px', background:'#191926', border:'1px solid rgba(255,255,255,.07)', borderRadius:7, fontSize:10, fontWeight:700, color:btn.color, cursor:'pointer', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, whiteSpace:'nowrap', transition:'all .15s', minWidth:60 }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#252535'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#191926'}}>
                    {btn.label}
                  </button>
                ))
              })()}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            <TeamBanner team={teamB} side="right" />
            <SectLabel>Players</SectLabel>
            {teamB.players.map((p,i) => <PlayerRow key={i} player={p} side="right" />)}
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
