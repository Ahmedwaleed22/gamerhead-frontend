'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { usersApi } from '@/lib/api'
import { sendActivity } from '@/lib/socket'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import AchievementBadge from '@/components/AchievementBadge'
import type { AchievementBadge as AchievementBadgeType } from '@/types/Badges.type'
import Username from '@/components/Username'

// Adjust this import to match your auth context
let useAuth: () => { user: { slug: string } | null }
try { useAuth = require('@/lib/auth-context').useAuth }
catch { useAuth = () => ({ user: null }) }

// ─── Icons ───────────────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  PSN:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.998.636.198.762.868.762 1.558v5.5c2.363 1.09 4.141-.17 4.141-3.026 0-2.925-1.013-4.238-3.95-5.289C12.32 3.01 9.892 2.272 7.985 1.646z" fill="#003087"/><path d="M3 19.304l4.745 1.543c1.65.537 3.532.396 5.07-.393L9.17 21.835V20.09L3 18.104v1.2zm18-3.697v-1.2l-3.635.876v3.257l-4.88 1.993c-1.37.56-3.04.63-4.485.06v1.21c1.55.52 3.37.42 4.86-.25l8.14-3.32v-2.625z" fill="#003087"/></svg>,
  psn:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.998.636.198.762.868.762 1.558v5.5c2.363 1.09 4.141-.17 4.141-3.026 0-2.925-1.013-4.238-3.95-5.289C12.32 3.01 9.892 2.272 7.985 1.646z" fill="#003087"/><path d="M3 19.304l4.745 1.543c1.65.537 3.532.396 5.07-.393L9.17 21.835V20.09L3 18.104v1.2zm18-3.697v-1.2l-3.635.876v3.257l-4.88 1.993c-1.37.56-3.04.63-4.485.06v1.21c1.55.52 3.37.42 4.86-.25l8.14-3.32v-2.625z" fill="#003087"/></svg>,
  Xbox:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#107C10"/><path d="M6.5 7C7.8 5.6 9.8 5 12 5s4.2.6 5.5 2c-1.2-1-3-2.5-5.5-2.5S7.7 6 6.5 7zm11 1.5c-.5-1-2.5-3.5-5.5-3.5S8 7.5 7.5 8.5C6 10 5 11 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1-.9-2-1.5-3.5z" fill="white"/></svg>,
  xbox:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#107C10"/><path d="M6.5 7C7.8 5.6 9.8 5 12 5s4.2.6 5.5 2c-1.2-1-3-2.5-5.5-2.5S7.7 6 6.5 7zm11 1.5c-.5-1-2.5-3.5-5.5-3.5S8 7.5 7.5 8.5C6 10 5 11 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1-.9-2-1.5-3.5z" fill="white"/></svg>,
  PC:         <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="#00AFF4" strokeWidth="1.5" fill="none"/><path d="M8 21h8M12 17v4" stroke="#00AFF4" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 7h4v4H6zM14 7h4v4h-4zM6 13h4M14 13h4" stroke="#00AFF4" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  steam:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.979 0C5.678 0 .511 4.86.022 10.942l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.83c0-2.596 2.113-4.708 4.708-4.708 2.596 0 4.708 2.112 4.708 4.708 0 2.596-2.112 4.708-4.708 4.708h-.11l-4.076 2.91c0 .049.002.098.002.147 0 1.947-1.58 3.531-3.531 3.531a3.536 3.536 0 01-3.488-2.953L.293 15.267A12 12 0 0011.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0z" fill="#1b2838"/></svg>,
  epic:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V22.12c0 1.374.504 1.879 1.877 1.879h16.926c1.374 0 1.877-.505 1.877-1.879V1.879C22.34.506 21.837 0 20.463 0zm3.475 4.238h10v2h-7.5v4h6v2h-6v4h7.5v2h-10z" fill="#888"/></svg>,
  activision: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h4l6-12 6 12h4L12 2z" fill="#888"/></svg>,
  riot:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12.534 21.77l-1.09-2.81 10.52-2.665.438 3.416zm-3.31-3.6L6.2 8.282l11.563 5.04-1.288 2.015zm-3.865-4.79L2.036 2.23l12.322 7.27-2.303 2.397z" fill="#D32936"/></svg>,
  battlenet:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00AEFF" strokeWidth="2" fill="none"/><path d="M12 6v12M6 12h12" stroke="#00AEFF" strokeWidth="2" strokeLinecap="round"/></svg>,
  nintendo:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="22" height="18" rx="4" stroke="#E60012" strokeWidth="2" fill="none"/><circle cx="8" cy="12" r="3" fill="#E60012"/><line x1="12" y1="3" x2="12" y2="21" stroke="#E60012" strokeWidth="2"/></svg>,
  blizzard:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00AEFF" strokeWidth="2" fill="none"/><path d="M12 6v12M6 12h12" stroke="#00AEFF" strokeWidth="2" strokeLinecap="round"/></svg>,
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Twitter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#1DA1F2"/></svg>,
  Twitch:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2.149 0L.537 4.119V20.8H6.19V24h3.132l3.129-3.2h4.674l6.227-6.226V0H2.149zm19.164 13.612l-3.582 3.58H12.34l-3.128 3.129v-3.13H4.537V2.686h16.776v10.926zm-3.582-7.343v6.262h-2.686V6.27h2.686zm-7.343 0v6.262H7.702V6.27h2.686z" fill="#9146FF"/></svg>,
  Discord: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/></svg>,
  YouTube: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg>,
  TikTok:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" fill="#fff"/></svg>,
  Instagram: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="#E1306C"/></svg>,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeInitials(name?: string | null): string {
  if (!name || typeof name !== 'string' || !name.trim()) return '??'
  return name.trim().slice(0, 2).toUpperCase()
}

function GameIconCell({ icon, size = 18 }: { icon?: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false)
  const isUrl = !!(icon && (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('data:')))
  if (isUrl && !imgErr) {
    return <img src={icon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
  }
  return <Icon icon={Solar.gamepad} width={size} height={size} />
}

function matchHref(m: any) {
  if (m.type === 'Tournament' && m.tournamentSlug) return `/tournaments/${m.tournamentSlug}/matches/${m.matchId}`
  return `/matches/${m.matchId}`
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS   = ['Overview', 'Matches', 'Badges', 'VOD / Clips', 'Forum', 'Friends', 'Teams']
const RARITY: Record<string, string> = { Common:'#9CA3AF', Rare:'#3498DB', Epic:'#9B59B6', Legendary:'#F39C12' }

const S = {
  card:       { background:'#0F0F1A', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' } as React.CSSProperties,
  cardHeader: { padding:'14px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' } as React.CSSProperties,
  headLabel:  { fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', color:'#6B7280' } as React.CSSProperties,
  seeAll:     { background:'none', border:'none', fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', cursor:'pointer' } as React.CSSProperties,
  tabLabel:   { fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:'uppercase' } as React.CSSProperties,
  mono:       { fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700 } as React.CSSProperties,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// function BadgeTile({ b, selectable, selected, onToggle }: {
//   b: any; selectable?: boolean; selected?: boolean; onToggle?: () => void
// }) {
//   const [hover, setHover] = useState(false)
//   const [imgErr, setImgErr] = useState(false)
//   const rc = RARITY[b.rarity] || '#9CA3AF'
//   return (
//     <div
//       onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
//       onClick={selectable ? onToggle : undefined}
//       style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 8px',
//         background: selected ? `${rc}18` : hover ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
//         border:`1px solid ${selected ? rc : hover ? rc+'44' : 'rgba(255,255,255,0.05)'}`,
//         borderRadius:10, cursor:selectable ? 'pointer' : 'default', transition:'all 0.15s' }}>
//       {selectable && selected && (
//         <div style={{ position:'absolute', top:6, right:6, width:16, height:16, background:rc, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
//           <Icon icon={Solar.checkRead} width={10} height={10} style={{ color: '#fff' }} />
//         </div>
//       )}
//       <div style={{ width:64, height:64, borderRadius:10, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
//         {!imgErr && b.img
//           ? <img src={b.img} alt={b.name} onError={() => setImgErr(true)} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
//           : <div style={{ width:64, height:64, borderRadius:10, background:`linear-gradient(135deg,${rc}33,${rc}11)`, border:`1px solid ${rc}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{b.name?.slice(0,1)}</div>
//         }
//       </div>
//       <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#9CA3AF', textAlign:'center', lineHeight:1.3 }}>{b.name}</div>
//       <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:9, letterSpacing:1, color:rc, textTransform:'uppercase' }}>{b.rarity}</div>
//       {hover && !selectable && (
//         <div style={{ position:'absolute', bottom:'calc(100% + 10px)', left:'50%', transform:'translateX(-50%)', width:200, background:'#1A1A2E', border:`1px solid ${rc}55`, borderRadius:10, padding:'12px 14px', zIndex:9999, pointerEvents:'none', boxShadow:'0 12px 32px rgba(0,0,0,0.8)' }}>
//           <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:13, color:'#F0F0F8', marginBottom:4 }}>{b.name}</div>
//           <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:9, letterSpacing:1.2, textTransform:'uppercase', color:rc, marginBottom:6 }}>{b.rarity}</div>
//           {b.desc && <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#9CA3AF', lineHeight:1.5, marginBottom:6 }}>{b.desc}</div>}
//           {b.date && <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568' }}>Earned {b.date}</div>}
//           <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%) rotate(45deg)', width:8, height:8, background:'#1A1A2E', borderRight:`1px solid ${rc}44`, borderBottom:`1px solid ${rc}44` }} />
//         </div>
//       )}
//     </div>
//   )
// }

function MatchRow({ m, cols }: { m: any; cols: string }) {
  const tc = m.type==='Wager' ? '#F39C12' : m.type==='Tournament' ? '#9B59B6' : '#3498DB'
  const tb = m.type==='Wager' ? 'rgba(243,156,18,0.1)' : m.type==='Tournament' ? 'rgba(155,89,182,0.1)' : 'rgba(52,152,219,0.1)'
  const tbo= m.type==='Wager' ? 'rgba(243,156,18,0.3)' : m.type==='Tournament' ? 'rgba(155,89,182,0.3)' : 'rgba(52,152,219,0.3)'
  return (
    <Link href={matchHref(m)} style={{ display:'grid', gridTemplateColumns:cols, gap:12, padding:'12px 20px', alignItems:'center', textDecoration:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s' }}
      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
      <div style={{ width:32, height:32, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <GameIconCell icon={m.icon} size={18} />
      </div>
      <div>
        <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color:'#F0F0F8' }}>{m.game} · {m.mode}</div>
        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', marginTop:1 }}>{m.date}</div>
      </div>
      <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#6B7280' }}>{m.team} <span style={{ color:'#4A5568', margin:'0 4px' }}>vs</span> {m.vs}</div>
      <span style={{ background:tb, border:`1px solid ${tbo}`, borderRadius:4, padding:'3px 8px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:tc, display:'inline-block' }}>{m.type}</span>
      <div style={{ ...S.mono, fontSize:16, color:'#F0F0F8' }}>{m.score}</div>
      <div style={{ ...S.mono, fontWeight:800, fontSize:13, letterSpacing:1, color:m.result==='WIN'?'#27AE60':'#E74C3C' }}>{m.result}</div>
      <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:m.cash?'#4ade80':'#4A5568', fontWeight:m.cash?600:400 }}>
        {m.cash||'—'}<br/><span style={{ color:'#4A5568', fontSize:10 }}>+{m.xp} XP</span>
      </div>
    </Link>
  )
}

function Skeleton() {
  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
      <div style={{ height:280, background:'linear-gradient(101deg,#0D121B 0%,#1A0A12 40%,#0D121B 100%)' }} />
      <div className="container" style={{ marginTop:-60, display:'flex', gap:24, alignItems:'flex-end' }}>
        <div style={{ width:120, height:120, background:'#1A1A2E', border:'3px solid #2D1B2E', borderRadius:12 }} />
        <div style={{ paddingBottom:8 }}>
          <div style={{ width:220, height:36, background:'#1A1A2E', borderRadius:6, marginBottom:10 }} />
          <div style={{ width:300, height:14, background:'#1A1A2E', borderRadius:4 }} />
        </div>
      </div>
    </div>
  )
}

// ─── OVERVIEW TAB ────────────────────────────────────────────────────────────

function OverviewTab({ U, setActiveTab }: { U: any; setActiveTab: (t:string)=>void }) {
  const ALL_MATCHES = U.matchHistory    || []
  const ALL_BADGES  = U.badges          || []
  const ALL_FRIENDS = U.friendsList     || []
  const ALL_TEAMS   = U.teamsList       || []

  const favBadgeIds  = U._local_favBadges  ?? (U.favoriteBadgeIds  || [])
  const favFriendIds = U._local_favFriends ?? (U.favoriteFriendIds || [])
  const favTeamIds   = U._local_favTeams   ?? (U.favoriteTeamIds   || [])

  const FAVE_BADGES  = favBadgeIds.length  > 0 ? ALL_BADGES.filter((b:any)=>favBadgeIds.includes(String(b._id||b.id))).slice(0,12) : ALL_BADGES.slice(0,12)
  const FAVE_FRIENDS = favFriendIds.length > 0 ? ALL_FRIENDS.filter((f:any)=>favFriendIds.includes(f.slug)).slice(0,5)              : ALL_FRIENDS.slice(0,5)
  const FAVE_TEAMS   = favTeamIds.length   > 0 ? ALL_TEAMS.filter((t:any)=>favTeamIds.includes(t.slug)).slice(0,3)                  : ALL_TEAMS.slice(0,3)
  const RECENT       = ALL_MATCHES.slice(0,3)

  const ALL_LADDERS = U.ladderStandings || []
  const ALL_GAME_STATS = U.gameStats || []

  const MOST_PLAYED = (() => {
    const map: Record<string,any> = {}
    // Seed from UserGameStats first (persisted, survives team deletion)
    ALL_GAME_STATS.forEach((s:any) => {
      const key = s.gameSlug || s.gameName
      if (!key) return
      map[key] = { icon:s.icon||'🎮', name:s.gameName||s.gameSlug, gameSlug:s.gameSlug||'', wins:s.wins||0, loss:s.losses||0, rank:s.gameRank||0 }
    })
    // Overlay with match history data (more accurate counts if matches exist)
    if (ALL_MATCHES.length > 0) {
      const matchMap: Record<string,{ wins:number, loss:number, icon:string, name:string }> = {}
      ALL_MATCHES.forEach((m:any) => {
        const key = m.gameSlug || m.game
        if (!matchMap[key]) matchMap[key] = { icon:m.icon||'🎮', name:m.game, wins:0, loss:0 }
        m.result==='WIN' ? matchMap[key].wins++ : matchMap[key].loss++
      })
      Object.entries(matchMap).forEach(([key, data]) => {
        if (map[key]) {
          map[key].icon = data.icon
          map[key].name = data.name
          map[key].wins = data.wins
          map[key].loss = data.loss
        } else {
          map[key] = { ...data, gameSlug:key, rank:0 }
        }
      })
    }
    return Object.values(map).sort((a:any,b:any) => (b.wins+b.loss) - (a.wins+a.loss)).slice(0,4)
  })()

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr 220px', gap:20, alignItems:'start' }}>

      {/* LEFT */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={S.card}>
          <div style={S.cardHeader}><span style={S.headLabel}>Player Stats</span></div>
          {[
            { label:'Global Rank',      value: U.globalRank ? `#${U.globalRank}` : '—', color:'#E74C3C' },
            { label:'Total Earnings', value: U.winnings || '$0.00',     color:'#F39C12' },
            { label:'Tournament Wins',  value: U.tournamentWins ?? 0,     color:'#27AE60' },
            { label:'Match Wins',       value: U.matchWins ?? 0,          color:'#F0F0F8' },
            { label:'Win Rate',         value: `${U.winRate ?? 0}%`,      color:'#F0F0F8' },
          ].map((s,i,arr)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'13px 20px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
              <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#6B7280' }}>{s.label}</span>
              <span style={{ ...S.mono, fontSize:15, color:s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}><span style={S.headLabel}>Game Stats</span></div>
          {MOST_PLAYED.length === 0
            ? <div style={{ padding:'20px', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:12, textAlign:'center' }}>No matches yet</div>
            : MOST_PLAYED.map((g:any,i:number,arr:any[])=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <div style={{ width:28, height:28, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  <GameIconCell icon={g.icon} size={16} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:12, color:'#F0F0F8' }}>{g.name}</div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', marginTop:2 }}>
                    <span style={{ color:'#4ade80' }}>{g.wins}W</span> / <span style={{ color:'#e74c3c' }}>{g.loss}L</span>
                  </div>
                </div>
                {g.rank > 0 && (
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ ...S.mono, fontSize:16, color:'#F39C12', lineHeight:1 }}>#{g.rank}</div>
                    <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:9, color:'#4A5568', marginTop:2 }}>RANK</div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      {/* CENTER */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ ...S.card, overflow:'visible' }}>
          <div style={S.cardHeader}>
            <span style={S.headLabel}>Favorite Badges</span>
            <button style={S.seeAll} onClick={()=>setActiveTab('Badges')}>See All</button>
          </div>
          {FAVE_BADGES.length === 0
            ? <div style={{ padding:'24px 20px', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:12, textAlign:'center' }}>No favorite badges set yet</div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', padding:16, gap:10 }}>
                {FAVE_BADGES.map((b:AchievementBadgeType,i:number)=><AchievementBadge key={i} badge={b} />)}
              </div>
          }
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.headLabel}>Recent Activity</span>
            <button style={S.seeAll} onClick={()=>setActiveTab('Matches')}>See All</button>
          </div>
          {RECENT.length === 0
            ? <div style={{ padding:'24px 20px', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:12, textAlign:'center' }}>No recent matches</div>
            : RECENT.map((m:any,i:number,arr:any[])=>(
              <Link key={i} href={matchHref(m)} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none', textDecoration:'none', transition:'background 0.12s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ width:44, height:44, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  <GameIconCell icon={m.icon} size={22} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color:'#F0F0F8' }}>{m.game} · {m.mode}</div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#4A5568', marginTop:2 }}>{m.type} · {m.date}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2, flexShrink:0 }}>
                  <span style={{ ...S.mono, fontWeight:800, fontSize:13, letterSpacing:1, color:m.result==='WIN'?'#27AE60':'#E74C3C' }}>{m.result}</span>
                  <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#4A5568' }}>{m.score}</span>
                  {m.cash && <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4ade80', fontWeight:600 }}>{m.cash}</span>}
                </div>
              </Link>
            ))
          }
          <div onClick={()=>setActiveTab('Matches')} style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'#4A5568', cursor:'pointer' }}>View All Matches</div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.headLabel}>Friends <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:10, color:'#4A5568', letterSpacing:0, textTransform:'none' }}>{U.friendCount ?? 0}</span></span>
            <button style={S.seeAll} onClick={()=>setActiveTab('Friends')}>See All</button>
          </div>
          {FAVE_FRIENDS.length === 0
            ? <div style={{ padding:'16px 20px', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:12, textAlign:'center' }}>No friends yet</div>
            : FAVE_FRIENDS.map((f:any,i:number,arr:any[])=>(
              <Link key={i} href={`/profile/${f.slug}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none', textDecoration:'none', transition:'background 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                <div style={{ position:'relative', width:30, height:30, background:(f.color||'#E74C3C')+'1A', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  {f.avatarUrl && (f.avatarUrl.startsWith('http') || f.avatarUrl.startsWith('/') || f.avatarUrl.startsWith('data:image'))
                    ? <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:f.color||'#E74C3C' }}>{f.initials}</span>}
                  <div style={{ position:'absolute', bottom:-1, right:-1, width:8, height:8, background:f.statusColor||'#4A5568', border:'2px solid #0F0F1A', borderRadius:'50%' }} />
                </div>
                <div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:12, color:f.color||'#F0F0F8' }}>{f.name}</div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', marginTop:1 }}>{f.statusLabel}</div>
                </div>
              </Link>
            ))
          }
          <div onClick={()=>setActiveTab('Friends')} style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'#4A5568', cursor:'pointer' }}>See Friends List</div>
        </div>

        <div style={S.card}>
          <div style={S.cardHeader}>
            <span style={S.headLabel}>Teams <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:400, fontSize:10, color:'#4A5568', letterSpacing:0, textTransform:'none' }}>{ALL_TEAMS.length}</span></span>
            <button style={S.seeAll} onClick={()=>setActiveTab('Teams')}>See All</button>
          </div>
          {FAVE_TEAMS.length === 0
            ? <div style={{ padding:'16px 20px', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:12, textAlign:'center' }}>No teams yet</div>
            : FAVE_TEAMS.map((t:any,i:number,arr:any[])=>{
              const rc = t.role==='Leader'?'#F39C12':t.role==='Captain'?'#E74C3C':'#4A5568'
              return (
              <Link key={i} href={`/teams/${t.slug}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none', textDecoration:'none' }}>
                <div style={{ width:30, height:30, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                  <GameIconCell icon={t.logoUrl || t.icon} size={16} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:12, color:'#F0F0F8' }}>{t.name}</span>
                    <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:9, letterSpacing:1, textTransform:'uppercase', color:rc, background:rc+'18', border:`1px solid ${rc}44`, borderRadius:3, padding:'1px 5px' }}>{t.role}</span>
                  </div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', marginTop:1 }}>{t.game} · {t.ladder}</div>
                </div>
              </Link>
            )})
          }
          <div onClick={()=>setActiveTab('Teams')} style={{ padding:'12px 20px', borderTop:'1px solid rgba(255,255,255,0.06)', textAlign:'center', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'#4A5568', cursor:'pointer' }}>See Team List</div>
        </div>
      </div>

    </div>
  )
}

// ─── EDIT PROFILE MODAL ──────────────────────────────────────────────────────

function EditModal({ profile, onClose, onSave }: {
  profile: any
  onClose: () => void
  onSave:  (updates: any) => void
}) {
  const [section,    setSection]    = useState<'main'|'badges'|'friends'|'teams'>('main')
  const [selBadges,  setSelBadges]  = useState<string[]>(profile.favoriteBadgeIds  || [])
  const [selFriends, setSelFriends] = useState<string[]>(profile.favoriteFriendIds || [])
  const [selTeams,   setSelTeams]   = useState<string[]>(profile.favoriteTeamIds   || [])
  const [bannerFile, setBannerFile] = useState<string|null>(null)
  const [avatarFile, setAvatarFile] = useState<string|null>(null)

  const allBadges  = profile.badges      || []
  const allFriends = profile.friendsList  || []
  const allTeams   = profile.teamsList    || []

  const MAX = { badges: allBadges.length, friends:5, teams:3 }

  function toggle(id:string, list:string[], set:(v:string[])=>void, max:number) {
    if (list.includes(id)) { set(list.filter(x=>x!==id)); return }
    if (list.length < max) set([...list, id])
  }

  function readFile(file:File, setter:(url:string)=>void) {
    const r = new FileReader()
    r.onload = e => setter(e.target?.result as string)
    r.readAsDataURL(file)
  }

  const secBtn = (key: typeof section, label: string) => {
    const isActive = section === key;
    return (
      <button key={key} onClick={()=>setSection(key)} style={{
        position: 'relative',
        background: isActive ? 'linear-gradient(180deg, rgba(232,0,13,0.1) 0%, transparent 100%)' : 'transparent',
        border: `1px solid ${isActive ? 'rgba(232,0,13,0.4)' : 'transparent'}`,
        borderRadius: 8, padding: '10px 20px',
        fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase',
        color: isActive ? '#fff' : '#8890A4', transition: 'all 0.2s ease', cursor:'pointer'
      }}
      onMouseEnter={e => !isActive && (e.currentTarget.style.color = '#fff')}
      onMouseLeave={e => !isActive && (e.currentTarget.style.color = '#8890A4')}>
        {label}
        {isActive && <div style={{ position: 'absolute', top: -1, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, #e8000d, transparent)', boxShadow: '0 1px 8px #e8000d' }} />}
      </button>
    )
  }

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(760px,96vw)', maxHeight:'90vh', background:'rgba(13,13,20,0.95)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'24px 28px', background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)' }}>
          <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:26, color:'#F0F0F8', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 10 }}>
             <div style={{ width: 36, height: 36, background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Icon icon={Solar.pen} width={18} height={18} style={{ color: '#e8000d' }} />
             </div>
             Edit Profile
          </span>
          <button type="button" onClick={onClose} style={{ width: 32, height: 32, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius: '50%', color:'#8890A4', cursor:'pointer', display:'flex', alignItems:'center', justifyContent: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#8890A4' }} aria-label="Close">
            <Icon icon={Solar.close} width={16} height={16} />
          </button>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:6, padding:'0 28px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' }}>
          {secBtn('main',    'Profile')}
          {secBtn('badges',  `Badges (${selBadges.length}/${MAX.badges})`)}
          {secBtn('friends', `Friends (${selFriends.length}/${MAX.friends})`)}
          {secBtn('teams',   `Teams (${selTeams.length}/${MAX.teams})`)}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px' }}>

          {/* ── Main ── */}
          {section === 'main' && (
            <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
              {/* Banner */}
              <div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', color:'#8890A4', marginBottom:12 }}>Banner Image</div>
                <div style={{ position:'relative', height:140, background:bannerFile||profile.bannerUrl?'none':'rgba(0,0,0,0.3)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius:12, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', transition: 'all 0.2s ease' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,0,13,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}>
                  {(bannerFile||profile.bannerUrl) && <img src={bannerFile||profile.bannerUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />}
                  <label style={{ position:'relative', zIndex:1, background:bannerFile||profile.bannerUrl?'rgba(13,13,20,0.85)':'rgba(255,255,255,0.04)', backdropFilter: 'blur(8px)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:8, fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#fff', fontWeight:600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = bannerFile||profile.bannerUrl?'rgba(13,13,20,0.85)':'rgba(255,255,255,0.04)'}>
                    <Icon icon={Solar.gallery} width={18} height={18} style={{ color: '#e8000d' }} /> {bannerFile||profile.bannerUrl ? 'Change Banner' : 'Upload Banner'}
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&readFile(e.target.files[0],setBannerFile)} />
                  </label>
                </div>
              </div>

              {/* Avatar */}
              <div style={{ display:'flex', alignItems:'center', gap:28 }}>
                <div style={{ position: 'relative', width:100, height:100, borderRadius:'50%', padding: 3, background:'linear-gradient(135deg, #e8000d 0%, rgba(232,0,13,0.1) 100%)', flexShrink:0, boxShadow: '0 8px 24px rgba(232,0,13,0.2)' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', background:'#0d0d14', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                    {(avatarFile||profile.avatarUrl)
                      ? <img src={avatarFile||profile.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:40, color:'#e8000d' }}>{safeInitials(profile.username)}</span>
                    }
                  </div>
                  <label style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, background: '#e8000d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #0d0d14', color: '#fff', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Upload Photo">
                    <Icon icon={Solar.camera} width={14} height={14} />
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&readFile(e.target.files[0],setAvatarFile)} />
                  </label>
                </div>
                <div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1.5, textTransform:'uppercase', color:'#8890A4', marginBottom:10 }}>Profile Picture</div>
                  <label style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#F0F0F8', fontWeight:600, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                    <Icon icon={Solar.camera} width={16} height={16} style={{ color: '#8890A4' }} />
                    Upload New Image
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>e.target.files?.[0]&&readFile(e.target.files[0],setAvatarFile)} />
                  </label>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#4F5568', marginTop:10 }}>JPG, PNG or GIF · Max 5MB</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 14, background:'rgba(232,0,13,0.04)', border:'1px solid rgba(232,0,13,0.15)', borderRadius:12, padding:'18px 20px', alignItems: 'flex-start' }}>
                <Icon icon={Solar.info} width={22} height={22} style={{ color: '#e8000d', flexShrink: 0 }} />
                <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#8890A4', lineHeight:1.6 }}>
                  To change your <strong style={{ color:'#DDE0EA', fontWeight: 600 }}>username</strong>, <strong style={{ color:'#DDE0EA', fontWeight: 600 }}>gamertags</strong>, or <strong style={{ color:'#DDE0EA', fontWeight: 600 }}>social links</strong>, please visit <Link href="/settings" style={{ color:'#e8000d', textDecoration:'none', fontWeight: 600 }}>Settings</Link>.
                </div>
              </div>
            </div>
          )}

          {/* ── Badges ── */}
          {section === 'badges' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:'#8890A4', marginBottom:20 }}>
                Select badges to show on your Overview. <strong style={{ color:'#fff' }}>({selBadges.length}/{MAX.badges} selected)</strong>
              </div>
              {allBadges.length === 0
                ? <div style={{ textAlign:'center', padding:'40px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color:'#4F5568', fontFamily:"'Barlow',sans-serif", fontSize:14 }}>No badges earned yet.</div>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:12 }}>
                    {allBadges.map((b:any)=>{
                      const id = String(b._id||b.id)
                      const sel = selBadges.includes(id)
                      return (
                        <div key={id}
                          onClick={()=>toggle(id, selBadges, setSelBadges, MAX.badges)}
                          style={{
                            position: 'relative',
                            padding: 10,
                            background: sel ? 'rgba(232,0,13,0.08)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${sel ? 'rgba(232,0,13,0.5)' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: sel ? '0 0 0 2px rgba(232,0,13,0.2), inset 0 0 20px rgba(232,0,13,0.05)' : 'none',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.12)' : 'rgba(255,255,255,0.05)'
                            e.currentTarget.style.borderColor = sel ? 'rgba(232,0,13,0.7)' : 'rgba(255,255,255,0.15)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.08)' : 'rgba(255,255,255,0.02)'
                            e.currentTarget.style.borderColor = sel ? 'rgba(232,0,13,0.5)' : 'rgba(255,255,255,0.07)'
                          }}
                        >
                          <AchievementBadge badge={b} className={{ image: 'mx-auto block w-16 h-16 object-contain' }} />
                          {sel && (
                            <div style={{ position:'absolute', top:6, right:6, width:18, height:18, background:'#e8000d', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(232,0,13,0.5)' }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                <path d="M1.5 5l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {/* ── Friends ── */}
          {section === 'friends' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:'#8890A4', marginBottom:20 }}>
                Select up to <strong style={{ color:'#fff' }}>{MAX.friends} friends</strong> to show on your Overview. ({selFriends.length}/{MAX.friends})
              </div>
              {allFriends.length === 0
                ? <div style={{ textAlign:'center', padding:'40px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color:'#4F5568', fontFamily:"'Barlow',sans-serif", fontSize:14 }}>No friends added yet.</div>
                : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}>
                    {allFriends.map((f:any)=>{
                      const sel = selFriends.includes(f.slug)
                      const maxed = !sel && selFriends.length >= MAX.friends
                      return (
                        <div key={f.slug} onClick={()=>!maxed&&toggle(f.slug,selFriends,setSelFriends,MAX.friends)}
                          style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:sel?'rgba(232,0,13,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${sel?'rgba(232,0,13,0.3)':'rgba(255,255,255,0.05)'}`, borderRadius:12, cursor:maxed&&!sel?'default':'pointer', opacity:maxed&&!sel?0.4:1, transition:'all 0.2s' }}
                          onMouseEnter={e => !maxed && (e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.1)' : 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => !maxed && (e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.06)' : 'rgba(255,255,255,0.02)')}>
                          <div style={{ position:'relative', width:40, height:40, background:(f.color||'#e8000d')+'1A', border:`1px solid ${f.color||'#e8000d'}44`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, color:f.color||'#e8000d' }}>{f.initials}</span>
                            <div style={{ position:'absolute', bottom:0, right:0, width:12, height:12, background:f.statusColor||'#4A5568', border:'2px solid #0d0d14', borderRadius:'50%' }} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:14, color:'#F0F0F8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</div>
                            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#8890A4' }}>{f.statusLabel}</div>
                          </div>
                          {sel && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8000d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon icon={Solar.checkRead} width={14} height={14} style={{ color:'#fff' }} />
                          </div>}
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}

          {/* ── Teams ── */}
          {section === 'teams' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:'#8890A4', marginBottom:20 }}>
                Select up to <strong style={{ color:'#fff' }}>{MAX.teams} teams</strong> to show on your Overview. ({selTeams.length}/{MAX.teams})
              </div>
              {allTeams.length === 0
                ? <div style={{ textAlign:'center', padding:'40px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, color:'#4F5568', fontFamily:"'Barlow',sans-serif", fontSize:14 }}>No teams joined yet.</div>
                : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {allTeams.map((t:any)=>{
                      const sel = selTeams.includes(t.slug)
                      const maxed = !sel && selTeams.length >= MAX.teams
                      return (
                        <div key={t.slug} onClick={()=>!maxed&&toggle(t.slug,selTeams,setSelTeams,MAX.teams)}
                          style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', background:sel?'rgba(232,0,13,0.06)':'rgba(255,255,255,0.02)', border:`1px solid ${sel?'rgba(232,0,13,0.3)':'rgba(255,255,255,0.05)'}`, borderRadius:12, cursor:maxed&&!sel?'default':'pointer', opacity:maxed&&!sel?0.4:1, transition:'all 0.2s' }}
                          onMouseEnter={e => !maxed && (e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.1)' : 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => !maxed && (e.currentTarget.style.background = sel ? 'rgba(232,0,13,0.06)' : 'rgba(255,255,255,0.02)')}>
                          <div style={{ width:44, height:44, background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, overflow:'hidden' }}>
                            <GameIconCell icon={t.logoUrl || t.icon} size={26} />
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:15, color:'#F0F0F8' }}>{t.name}</div>
                            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#8890A4', marginTop:2 }}>{t.game} · {t.ladder}</div>
                          </div>
                          <div style={{ textAlign:'right', marginRight: 16 }}>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'#4ade80' }}>{t.wins}W</div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'#E74C3C' }}>{t.losses}L</div>
                          </div>
                          {sel && <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e8000d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon icon={Solar.checkRead} width={14} height={14} style={{ color:'#fff' }} />
                          </div>}
                        </div>
                      )
                    })}
                  </div>
              }
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:12, padding:'20px 28px', borderTop:'1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <button onClick={onClose} style={{ background:'transparent', border:'none', padding:'12px 24px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase', color:'#8890A4', cursor:'pointer', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#8890A4'}>Cancel</button>
          <button onClick={()=>{ onSave({ bannerFile, avatarFile, favoriteBadgeIds:selBadges, favoriteFriendIds:selFriends, favoriteTeamIds:selTeams }); onClose() }}
            style={{ background:'#e8000d', border:'none', borderRadius:8, padding:'12px 28px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase', color:'#fff', cursor:'pointer', boxShadow: '0 4px 16px rgba(232,0,13,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(232,0,13,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,0,13,0.3)' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params   = useParams()
  const slug     = params?.slug as string
  const { user: authUser } = useAuth()

  const [profile,   setProfile]   = useState<any>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string|null>(null)
  const [activeTab, setActiveTab] = useState('Overview')

  // Matches filters
  const [matchGame,   setMatchGame]   = useState('All')
  const [matchResult, setMatchResult] = useState('All')
  const [matchType,   setMatchType]   = useState('All')

  // Friend request state
  const [friendStatus, setFriendStatus] = useState<'idle'|'sending'|'sent'|'already'|'error'>('idle')

  // VOD state
  const [localVods,   setLocalVods]   = useState<any[]>([])
  const [addingVod,   setAddingVod]   = useState(false)
  const [vodUrl,      setVodUrl]      = useState('')
  const [vodTitle,    setVodTitle]    = useState('')
  const [vodPlatform, setVodPlatform] = useState('youtube')
  const [vodModal,    setVodModal]    = useState<any>(null)

  // Edit modal
  const [editOpen,        setEditOpen]        = useState(false)
  const [localBanner,     setLocalBanner]     = useState<string|null>(null)
  const [localAvatar,     setLocalAvatar]     = useState<string|null>(null)
  const [localFavBadges,  setLocalFavBadges]  = useState<string[]|null>(null)
  const [localFavFriends, setLocalFavFriends] = useState<string[]|null>(null)
  const [localFavTeams,   setLocalFavTeams]   = useState<string[]|null>(null)

  // Friends list state (needs to be before conditional returns)
  const [friendsList,     setFriendsList]     = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])

  // Derived relationship flags (safe even when profile is null)
  const isLoggedIn      = !!authUser
  const isOwnProfile    = isLoggedIn && authUser?.slug === slug
  const isAlreadyFriend = isLoggedIn && !isOwnProfile && (profile?.friendsList || []).some((f: any) => f.slug === authUser?.slug)

  useEffect(() => { sendActivity('Viewing Profile') }, [])

  useEffect(() => {
    if (!slug) { setError('No slug.'); setLoading(false); return }
    setLoading(true); setError(null)
    usersApi.getBySlug(slug)
      .then(data => { if (process.env.NODE_ENV==='development') console.log('[Profile]',data); setProfile(data) })
      .catch(e   => { console.error('[Profile]',e); setError(e?.message||'Failed to load profile.') })
      .finally(() => setLoading(false))
  }, [slug])

  // Sync friendsList when profile loads
  useEffect(() => { setFriendsList(profile?.friendsList || []) }, [profile?.friendsList])

  // Detect already-friends
  useEffect(() => { if (isAlreadyFriend) setFriendStatus('already') }, [isAlreadyFriend])

  // Fetch pending friend requests (own profile only)
  useEffect(() => {
    if (!isOwnProfile || !profile) return
    usersApi.getFriendRequests().then((res: any) => {
      setPendingRequests(res?.requests || [])
    }).catch(() => {})
  }, [isOwnProfile, profile])

  if (loading) return <Skeleton />
  if (error || !profile) return (
    <div style={{ background:'#080810', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#E74C3C', fontFamily:"'Barlow',sans-serif" }}>
      {error||'Profile not found.'}
    </div>
  )

  // ── Field reads ─────────────────────────────────────────────────────────────
  const username      = (profile.username?.trim()) || slug
  const usernameColor = profile.usernameColor || '#E74C3C'
  const initials      = safeInitials(username)
  const avatarUrl     = localAvatar || profile.avatarUrl || null
  const bannerUrl     = localBanner || profile.bannerUrl || null
  const level         = profile.level     ?? 1
  const xp            = profile.xp        ?? 0
  const xpNext        = profile.xpNext    ?? 100
  const xpPct         = profile.xpPct     ?? (xpNext>0 ? Math.round((xp/xpNext)*100) : 0)
  const rep           = profile.rep        ?? 0
  const repColor      = profile.repColor   || '#ef4444'
  const repGradient   = profile.repGradient|| `linear-gradient(90deg,${repColor},${repColor})`
  const repLabel      = profile.repLabel   || 'Red'
  // Rep bar fills out of 100 and scales to the next 100-point milestone
  const nextRepMilestone = (Math.floor(rep / 100) + 1) * 100
  const repPct           = rep % 100

  const ALL_MATCHES   = profile.matchHistory    || []
  const ALL_BADGES    = profile.badges          || []
  const FORUM_POSTS   = profile.forumPosts      || []
  const ALL_FRIENDS   = friendsList
  const ALL_TEAMS     = profile.teamsList       || []
  const VODS          = [...(profile.vods||[]), ...localVods]

  // Pass local overrides to OverviewTab via a merged object
  const profileForOverview = {
    ...profile,
    avatarUrl,
    bannerUrl,
    _local_favBadges:  localFavBadges,
    _local_favFriends: localFavFriends,
    _local_favTeams:   localFavTeams,
  }

  const gameOptions = ['All', ...Array.from(new Set(ALL_MATCHES.map((m:any)=>m.game))) as string[]]
  const filtered    = ALL_MATCHES.filter((m:any) => {
    if (matchGame   !=='All' && m.game  !==matchGame)   return false
    if (matchResult !=='All' && m.result!==matchResult) return false
    if (matchType   !=='All' && m.type  !==matchType)   return false
    return true
  })

  function addVod() {
    if (!vodUrl.trim()||!vodTitle.trim()) return
    let url = vodUrl
    if (url.includes('youtube.com/watch?v=')) url=url.replace('watch?v=','embed/')
    if (url.includes('youtu.be/'))           url=url.replace('youtu.be/','www.youtube.com/embed/')
    setLocalVods(p=>[{ id:Date.now(), title:vodTitle, url, platform:vodPlatform, date:new Date().toLocaleDateString('en-US'), views:'0' },...p])
    setVodUrl(''); setVodTitle(''); setAddingVod(false)
  }

  function handleEditSave(updates: any) {
    if (updates.bannerFile)       setLocalBanner(updates.bannerFile)
    if (updates.avatarFile)       setLocalAvatar(updates.avatarFile)
    if (updates.favoriteBadgeIds) setLocalFavBadges(updates.favoriteBadgeIds)
    if (updates.favoriteFriendIds)setLocalFavFriends(updates.favoriteFriendIds)
    if (updates.favoriteTeamIds)  setLocalFavTeams(updates.favoriteTeamIds)

    const payload: any = {}
    if (updates.bannerFile)        payload.bannerUrl       = updates.bannerFile
    if (updates.avatarFile)        payload.avatarUrl       = updates.avatarFile
    if (updates.favoriteBadgeIds)  payload.favoriteBadges  = updates.favoriteBadgeIds
    if (updates.favoriteFriendIds) payload.favoriteFriends = updates.favoriteFriendIds
    if (updates.favoriteTeamIds)   payload.favoriteTeams   = updates.favoriteTeamIds
    if (Object.keys(payload).length > 0) {
      usersApi.updateMe(payload).catch(() => {})
    }
  }

  function FilterBtn({ val, cur, set }: { val:string; cur:string; set:(v:string)=>void }) {
    return (
      <button onClick={()=>set(val)} style={{ background:cur===val?'rgba(192,57,43,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${cur===val?'#C0392B':'rgba(255,255,255,0.06)'}`, borderRadius:6, padding:'5px 14px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:1, textTransform:'uppercase', color:cur===val?'#E74C3C':'#6B7280', cursor:'pointer' }}>
        {val}
      </button>
    )
  }

  const MATCH_COLS = '40px 1fr 130px 100px 80px 80px 80px'

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', paddingBottom:80 }}>

      {/* ── BANNER ── */}
      <div style={{ position:'relative', height:280, overflow:'hidden', background:'linear-gradient(101deg,#0D121B 0%,#1A0A12 40%,#0D121B 100%)' }}>
        {bannerUrl
          ? <img src={bannerUrl} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          : <>
              <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(192,57,43,0.07) 1px,transparent 1px),linear-gradient(90deg,rgba(192,57,43,0.07) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />
              <div style={{ position:'absolute', width:600, height:300, left:'calc(50% - 300px)', top:-50, background:'radial-gradient(70.71% 70.71% at 50% 50%,rgba(192,57,43,0.2) 0%,rgba(192,57,43,0) 70%)' }} />
              <div style={{ position:'absolute', right:40, bottom:-20, fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:160, letterSpacing:-8, color:'rgba(192,57,43,0.06)', lineHeight:1, pointerEvents:'none', userSelect:'none' }}>{initials}</div>
            </>
        }
        <div style={{ position:'absolute', height:140, left:0, right:0, bottom:0, background:'linear-gradient(180deg,transparent 0%,#0D121B 100%)' }} />
      </div>

      {/* ── IDENTITY ── */}
      <div className="container">
        <div style={{ display:'flex', alignItems:'flex-end', gap:24, marginTop:-60, position:'relative', zIndex:2 }}>

          {/* Avatar */}
          <div style={{ position:'relative', width:120, height:120, flexShrink:0 }}>
            <div style={{ position:'relative', width:120, height:120, background:'linear-gradient(135deg,#1A1A2E 0%,#2D1B2E 100%)', border:`3px solid ${usernameColor}`, borderRadius:12, boxShadow:`0 0 30px ${usernameColor}4D,0 8px 32px rgba(0,0,0,0.6)`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:48, color:usernameColor }}>{initials}</span>
              }
            </div>
            <div style={{ position:'absolute', top:8, right:8, width:10, height:10, background: isOwnProfile ? '#4ade80' : profile.presenceStatus === 'online' ? '#4ade80' : profile.presenceStatus === 'idle' ? '#F0AA1A' : '#4A5568', border:'2px solid #080810', borderRadius:'50%', boxShadow: isOwnProfile || profile.presenceStatus === 'online' ? '0 0 8px #4ade80' : profile.presenceStatus === 'idle' ? '0 0 8px #F0AA1A' : 'none' }} />
            <div style={{ position:'absolute', bottom:-8, right:-8, width:32, height:32, background:usernameColor, border:'2px solid #080810', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:14, color:'#fff' }}>{level}</span>
            </div>
          </div>

          {/* Info */}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, color:usernameColor, letterSpacing:1, margin:0, lineHeight:1 }}><Username user={profile} /></h1>
              {/* Presence status */}
              {!isOwnProfile && (
                <div style={{ display:'flex', alignItems:'center', gap:5, marginLeft:4 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background: profile.presenceStatus === 'online' ? '#4ade80' : profile.presenceStatus === 'idle' ? '#F0AA1A' : '#4A5568', display:'inline-block', boxShadow: profile.presenceStatus === 'online' ? '0 0 6px #4ade80' : 'none' }} />
                  <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color: profile.presenceStatus === 'online' ? '#4ade80' : profile.presenceStatus === 'idle' ? '#F0AA1A' : '#6B7280' }}>
                    {profile.presenceStatus === 'online' ? (profile.activityText || 'Online') : profile.presenceStatus === 'idle' ? 'Idle' : 'Offline'}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:6 }}>
              {profile.premium  && <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(243,156,18,0.12)', border:'1px solid rgba(243,156,18,0.3)', borderRadius:20, padding:'3px 10px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.8, textTransform:'uppercase', color:'#F39C12' }}>★ Premium</span>}
              {profile.isCoach  && <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(96,165,250,0.1)', border:'1px solid rgba(96,165,250,0.25)', borderRadius:20, padding:'3px 10px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.8, textTransform:'uppercase', color:'#60A5FA' }}>Coach</span>}
              {profile.role === 'admin' && <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(232,0,13,0.1)', border:'1px solid rgba(232,0,13,0.25)', borderRadius:20, padding:'3px 10px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.8, textTransform:'uppercase', color:'#e8000d' }}>Admin</span>}
            </div>
            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#4A5568', marginTop:6 }}>
              {profile.platformId && `ID: ${profile.platformId} · `}
              {profile.joined    && `Joined ${profile.joined}`}
              {profile.location  && ` · ${profile.location}`}
            </div>

            {profile.bio && (
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#9CA3AF', marginTop:8, lineHeight:'18px', maxWidth:500 }}>
                {profile.bio}
              </div>
            )}

            {isOwnProfile && !profile.bio && (
              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#4A5568', marginTop:8, fontStyle:'italic' }}>
                No bio set — <Link href="/settings?tab=settings" style={{ color:'#E74C3C', textDecoration:'none' }}>edit profile</Link> to add one.
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:12, flexWrap:'wrap' }}>

              {/* Reputation */}
              <div style={{ width:200 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'flex-end', marginBottom:8 }}>
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:2, textTransform:'uppercase', color:'#8890A4' }}>Reputation</span>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:18, color:repColor, lineHeight:0.9 }}>
                    {rep.toLocaleString()} <span style={{ fontSize:12, color:'#4A5568', letterSpacing: 0, fontFamily:"'Barlow',sans-serif", fontWeight:700 }}>/ {nextRepMilestone.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 0, height: 12, background: '#0D121B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 0, padding: 1 }}>
                  {Array.from({length: 10}).map((_, i) => {
                    const filled = i < Math.floor(repPct / 10);
                    return (
                      <div key={i} style={{ flex: 1, borderRight: i < 9 ? '1px solid rgba(255,255,255,0.06)' : 'none', background: filled ? repGradient : 'transparent', borderRadius: 0 }} />
                    );
                  })}
                </div>
              </div>

              <div style={{ width:1, height:40, background:'rgba(255,255,255,0.06)', flexShrink:0 }} />

              {/* XP */}
              <div style={{ width:240 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems: 'flex-end', marginBottom:8 }}>
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:2, textTransform:'uppercase', color:'#8890A4' }}>Level</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#E74C3C', lineHeight:0.9 }}>{level}</span>
                </div>
                <div style={{ height: 12, background: '#0D121B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: 1, display: 'flex' }}>
                  <div style={{ width: `${Math.max(xpPct, 3)}%`, background: 'linear-gradient(90deg, rgba(231,76,60,0.1), rgba(231,76,60,0.3))', borderRadius: 2, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 8, background: '#FF6B5B', borderRadius: 2, boxShadow: '0 0 10px rgba(255,107,91,0.5)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight: 700, fontSize:11, color:'#8890A4', letterSpacing: 0.5 }}>
                    {xp.toLocaleString()} / {xpNext.toLocaleString()} <span style={{ color: '#E74C3C' }}>XP</span>
                  </span>
                </div>
              </div>

              {/* Trophies */}
              <div style={{ width:1, height:40, background:'rgba(255,255,255,0.06)', flexShrink:0 }} />
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                {[
                  { label: 'Gold',   value: profile.goldTrophies   || 0, color: '#F0C040' },
                  { label: 'Silver', value: profile.silverTrophies || 0, color: '#C0C0C0' },
                  { label: 'Bronze', value: profile.bronzeTrophies || 0, color: '#CD7F32' },
                ].map((t, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }} title={t.label}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill={t.color}/>
                      <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill={t.color}/>
                      <rect x="10" y="14" width="4" height="4" fill={t.color}/>
                      <rect x="7" y="18" width="10" height="3" rx="1" fill={t.color}/>
                    </svg>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:t.color }}>{t.value}</span>
                  </div>
                ))}
              </div>

              {/* Gamertags */}
              {(profile.gamertags||[]).length > 0 && <>
                <div style={{ width:1, height:40, background:'rgba(255,255,255,0.06)', flexShrink:0 }} />
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {(profile.gamertags||[]).map((g:any,i:number)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'4px 10px' }}>
                      <span style={{ display:'flex', alignItems:'center' }}>{PLATFORM_ICONS[g.platform]}</span>
                      <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#6B7280' }}>{g.tag}</span>
                    </div>
                  ))}
                </div>
              </>}

              {/* Socials */}
              {(profile.socials||[]).length > 0 && <>
                <div style={{ width:1, height:40, background:'rgba(255,255,255,0.06)', flexShrink:0 }} />
                <div style={{ display:'flex', gap:6 }}>
                  {(profile.socials||[]).map((s:any,i:number)=>(
                    <a key={i} href={s.url||'#'} target="_blank" rel="noopener noreferrer" title={s.label}
                      style={{ width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', opacity:0.7, transition:'opacity 0.15s' }}
                      onMouseEnter={(e)=>(e.currentTarget.style.opacity='1')}
                      onMouseLeave={(e)=>(e.currentTarget.style.opacity='0.7')}>
                      {SOCIAL_ICONS[s.label]}
                    </a>
                  ))}
                </div>
              </>}
            </div>
          </div>

          {/* ── Action buttons ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, paddingBottom:8, flexShrink:0 }}>
            {isOwnProfile ? (
              <button onClick={()=>setEditOpen(true)} style={{ background:'rgba(192,57,43,0.12)', border:'1px solid #C0392B', borderRadius:8, padding:'10px 24px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase', color:'#E74C3C', cursor:'pointer' }}>
                ✎ Edit Profile
              </button>
            ) : isLoggedIn ? (
              <>
                <button
                  disabled={friendStatus==='sending'||friendStatus==='sent'||friendStatus==='already'}
                  onClick={async()=>{
                    if(!profile.id) return
                    setFriendStatus('sending')
                    try {
                      await usersApi.sendFriendRequest(profile.id)
                      setFriendStatus('sent')
                    } catch(e:any) {
                      if(e?.message?.includes('already')) setFriendStatus('already')
                      else setFriendStatus('error')
                      setTimeout(()=>setFriendStatus('idle'),3000)
                    }
                  }}
                  style={{ background: friendStatus==='sent'||friendStatus==='already' ? 'rgba(39,174,96,0.12)' : 'rgba(52,152,219,0.12)', border:`1px solid ${friendStatus==='sent'||friendStatus==='already' ? '#27AE60' : '#3498DB'}`, borderRadius:8, padding:'10px 24px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase', color: friendStatus==='sent'||friendStatus==='already' ? '#27AE60' : friendStatus==='error' ? '#E74C3C' : '#3498DB', cursor: friendStatus==='sending'||friendStatus==='sent' ? 'default' : 'pointer', opacity: friendStatus==='sending' ? 0.6 : 1 }}
                >
                  {friendStatus==='sending' ? 'Sending...' : friendStatus==='sent' ? 'Request Sent' : friendStatus==='already' ? 'Already Friends' : friendStatus==='error' ? 'Failed — Try Again' : '+ Add Friend'}
                </button>
                <Link href={`/mailbox?to=${slug}`} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, textAlign:'center', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 24px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1, textTransform:'uppercase', color:'#9CA3AF', textDecoration:'none' }}>
                  <Icon icon={Solar.letter} width={16} height={16} style={{ flexShrink: 0, opacity: 0.9 }} />
                  Message
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.06)', marginTop:24, overflowX:'auto', overflowY:'hidden' }}>
          {TABS.map(tab=>(
            <button key={tab} onClick={()=>setActiveTab(tab)}
              style={{ background:'none', border:'none', padding:'12px 20px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:'uppercase', color:activeTab===tab?'#E74C3C':'#6B7280', borderBottom:activeTab===tab?'2px solid #E74C3C':'2px solid transparent', marginBottom:-1, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, transition:'color 0.15s, border-color 0.15s' }}
              onMouseEnter={e=>{ if(activeTab!==tab)(e.currentTarget as HTMLButtonElement).style.color='#9CA3AF' }}
              onMouseLeave={e=>{ if(activeTab!==tab)(e.currentTarget as HTMLButtonElement).style.color='#6B7280' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="container" style={{ marginTop:24 }}>

        {activeTab==='Overview'  && <OverviewTab U={profileForOverview} setActiveTab={setActiveTab} />}

        {/* MATCHES */}
        {activeTab==='Matches' && (
          <div>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'#4A5568' }}>Game:</span>
              {gameOptions.map(v=><FilterBtn key={v} val={v} cur={matchGame}   set={setMatchGame}   />)}
              <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }} />
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'#4A5568' }}>Result:</span>
              {['All','WIN','LOSS'].map(v=><FilterBtn key={v} val={v} cur={matchResult} set={setMatchResult} />)}
              <div style={{ width:1, height:24, background:'rgba(255,255,255,0.06)' }} />
              <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:1, textTransform:'uppercase', color:'#4A5568' }}>Type:</span>
              {['All','Ladder','Wager','Tournament'].map(v=><FilterBtn key={v} val={v} cur={matchType}   set={setMatchType}   />)}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Total',     value: ALL_MATCHES.length,                                                                                              color:'#F0F0F8' },
                { label:'Wins',      value: ALL_MATCHES.filter((m:any)=>m.result==='WIN').length,                                                            color:'#27AE60' },
                { label:'Losses',    value: ALL_MATCHES.filter((m:any)=>m.result==='LOSS').length,                                                           color:'#E74C3C' },
                { label:'Win Rate',  value: ALL_MATCHES.length>0?`${Math.round(ALL_MATCHES.filter((m:any)=>m.result==='WIN').length/ALL_MATCHES.length*100)}%`:'0%', color:'#F39C12' },
                { label:'Earned',    value: profile.winnings||'$0.00',                                                                                       color:'#4ade80' },
              ].map((s,i)=>(
                <div key={i} style={{ ...S.card, padding:'14px 20px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:s.color }}>{s.value}</div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#4A5568', marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <div style={{ display:'grid', gridTemplateColumns:MATCH_COLS, gap:12, padding:'10px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                {['','Match','Teams','Type','Score','Result','Earned'].map((h,i)=><span key={i} style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#4A5568' }}>{h}</span>)}
              </div>
              {filtered.length===0
                ? <div style={{ padding:40, textAlign:'center', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>No matches match the selected filters.</div>
                : filtered.map((m:any,i:number)=><MatchRow key={i} m={m} cols={MATCH_COLS} />)
              }
            </div>
          </div>
        )}

        {/* BADGES */}
        {activeTab==='Badges' && (() => {
          const SUBCATEGORY_LABELS: Record<string, string> = {
            link_accounts: 'Link Accounts', friends: 'Friends', wins: 'Wins',
            matches: 'Matches', cash_earned: 'Cash Earned', tournaments_played: 'Tournaments Played', misc: 'Misc',
            role: 'Forum Role', posting_milestones: 'Posting Milestones', thread_creation: 'Thread Creation',
            reaction_milestones: 'Reaction Milestones', high_engagement: 'High Engagement',
          }
          const PLATFORM_SUBS = ['link_accounts','friends','wins','matches','cash_earned','tournaments_played','misc']
          const FORUM_SUBS    = ['role','posting_milestones','thread_creation','reaction_milestones','high_engagement']

          const bySubcat: Record<string, any[]> = {}
          for (const b of ALL_BADGES) {
            const key = b.subcategory || (b.category === 'forum' ? 'role' : 'misc')
            if (!bySubcat[key]) bySubcat[key] = []
            bySubcat[key].push(b)
          }

          const renderSection = (title: string, subs: string[]) => {
            const subsWithBadges = subs.filter(s => bySubcat[s]?.length)
            if (!subsWithBadges.length) return null
            return (
              <div key={title} style={{ marginBottom: 32 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:800, fontSize:15, letterSpacing:2, textTransform:'uppercase', color:'#C0392B' }}>{title}</span>
                  <div style={{ flex:1, height:1, background:'rgba(192,57,43,0.25)' }} />
                </div>
                {subsWithBadges.map(sub => (
                  <div key={sub} style={{ marginBottom:20 }}>
                    <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:12, letterSpacing:1.2, textTransform:'uppercase', color:'#6B7280', marginBottom:10 }}>
                      {SUBCATEGORY_LABELS[sub] || sub}
                      <span style={{ marginLeft:6, color:'#4A5568', fontWeight:400 }}>({bySubcat[sub].length})</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
                      {bySubcat[sub].map((b:any,i:number) => <AchievementBadge key={i} badge={b} />)}
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          return ALL_BADGES.length === 0
            ? <div style={{ textAlign:'center', padding:'48px 0', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>No badges earned yet.</div>
            : <>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:24 }}>
                  {Object.entries(RARITY).map(([r,c])=>(
                    <div key={r} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.03)', border:`1px solid ${c}33`, borderRadius:6, padding:'3px 8px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:c }} />
                      <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:c }}>{r}</span>
                    </div>
                  ))}
                  <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, letterSpacing:1.5, textTransform:'uppercase', color:'#6B7280', marginLeft:8 }}>{ALL_BADGES.length} earned</span>
                </div>
                {renderSection('User Profile Badges', PLATFORM_SUBS)}
                {renderSection('Forum Badges', FORUM_SUBS)}
              </>
        })()}

        {/* VOD / CLIPS */}
        {activeTab==='VOD / Clips' && (
          <div>
            <div style={{ ...S.card, padding:'16px 20px', marginBottom:20 }}>
              {!addingVod
                ? <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#6B7280' }}>Paste a YouTube or Twitch URL to add a clip.</span>
                    <button onClick={()=>setAddingVod(true)} style={{ background:'#C0392B', border:'none', borderRadius:6, padding:'8px 18px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, letterSpacing:1, textTransform:'uppercase', color:'#fff', cursor:'pointer' }}>+ Add Clip</button>
                  </div>
                : <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <select value={vodPlatform} onChange={e=>setVodPlatform(e.target.value)} style={{ background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'7px 10px', color:'#F0F0F8', fontSize:12 }}>
                      <option value="youtube">YouTube</option><option value="twitch">Twitch</option>
                    </select>
                    <input value={vodTitle} onChange={e=>setVodTitle(e.target.value)} placeholder="Title..." style={{ background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'7px 12px', color:'#F0F0F8', fontSize:12, outline:'none', width:180 }} />
                    <input value={vodUrl}   onChange={e=>setVodUrl(e.target.value)}   placeholder="https://youtube.com/watch?v=..." style={{ background:'#1A1A2E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:6, padding:'7px 12px', color:'#F0F0F8', fontSize:12, outline:'none', flex:1 }} />
                    <button onClick={addVod} style={{ background:'#C0392B', border:'none', borderRadius:6, padding:'8px 18px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, color:'#fff', cursor:'pointer' }}>Add</button>
                    <button onClick={()=>setAddingVod(false)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'8px 12px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, color:'#6B7280', cursor:'pointer' }}>Cancel</button>
                  </div>
              }
            </div>
            {VODS.length===0
              ? <div style={{ textAlign:'center', padding:'48px 0', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>No VODs added yet.</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {VODS.map((v:any)=>(
                    <div key={v.id||v.url} style={{ ...S.card, cursor:'pointer' }} onClick={()=>setVodModal(v)}>
                      <div style={{ position:'relative', aspectRatio:'16/9', background:'#0A0A18', overflow:'hidden' }}>
                        <iframe src={v.url} style={{ width:'100%', height:'100%', border:'none', pointerEvents:'none' }} allowFullScreen />
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.3)' }}>
                          <div style={{ width:44, height:44, background:'rgba(192,57,43,0.8)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>▶</div>
                        </div>
                      </div>
                      <div style={{ padding:'12px 16px' }}>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color:'#F0F0F8', marginBottom:4 }}>{v.title}</div>
                        <div style={{ display:'flex', gap:10 }}>
                          <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', display:'inline-flex', alignItems:'center', gap:4 }}>{v.platform==='youtube' ? (<><Icon icon={Solar.youtube} width={12} height={12} /> YouTube</>) : (<><Icon icon={Solar.gamepad} width={12} height={12} /> Twitch</>)}</span>
                          <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568' }}>{v.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* FORUM */}
        {activeTab==='Forum' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
              {[
                { label:'Threads', value: FORUM_POSTS.length,                                              color:'#F0F0F8' },
                { label:'Replies', value: FORUM_POSTS.reduce((a:number,p:any)=>a+(p.replies||0),0),        color:'#3498DB' },
                { label:'Views',   value: FORUM_POSTS.reduce((a:number,p:any)=>a+(p.views||0),0),          color:'#F39C12' },
                { label:'Reactions', value: (profile.forumReactions?.positive ?? FORUM_POSTS.reduce((a:number,p:any)=>a+(p.likes||0),0)),  color:'#4ade80' },
              ].map((s,i)=>(
                <div key={i} style={{ ...S.card, padding:'14px 20px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:s.color }}>{s.value}</div>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:'#4A5568', marginTop:3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Reactions breakdown */}
            {profile.forumReactions?.breakdown?.length > 0 && (
              <div style={{ ...S.card, marginBottom: 20 }}>
                <div style={{ ...S.cardHeader }}><span style={S.headLabel}>Reactions Received</span></div>
                <div style={{ padding: '14px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {profile.forumReactions.breakdown.map((r: any) => (
                    <div key={r.emoji} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 14px' }}>
                      <Icon icon={Solar.gamepad} width={20} height={20} />
                      <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: '#F0F0F8' }}>{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={S.card}>
              <div style={{ ...S.cardHeader }}><span style={S.headLabel}>Posts & Topics</span><Link href="/forum" style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568' }}>Forum →</Link></div>
              {FORUM_POSTS.length===0
                ? <div style={{ padding:'32px 20px', textAlign:'center', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>No forum posts yet.</div>
                : FORUM_POSTS.map((p:any,i:number,arr:any[])=>{
                    const tagColors: Record<string,{c:string,b:string}> = {
                      'Pinned':     {c:'#F39C12',b:'rgba(243,156,18,0.1)'},
                      'Official':   {c:'#3498DB',b:'rgba(52,152,219,0.1)'},
                      'Reply':      {c:'#9B59B6',b:'rgba(155,89,182,0.1)'},
                      'Guide':      {c:'#F39C12',b:'rgba(243,156,18,0.1)'},
                      'LFT':        {c:'#27AE60',b:'rgba(39,174,96,0.1)'},
                      'Highlight':  {c:'#9B59B6',b:'rgba(155,89,182,0.1)'},
                      'Discussion': {c:'#3498DB',b:'rgba(52,152,219,0.1)'},
                    }
                    const {c:tc,b:tb} = tagColors[p.tag] || tagColors['Discussion']
                    return (
                      <Link key={i} href={`/forum/board/${p.boardSlug || 'general'}/${p.id}`} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 20px', borderBottom:i<arr.length-1?'1px solid rgba(255,255,255,0.04)':'none', textDecoration:'none', transition:'background 0.12s' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.025)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <span style={{ background:tb, border:`1px solid ${tc}44`, borderRadius:4, padding:'3px 8px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:tc, flexShrink:0, display:'inline-flex', alignItems:'center', gap:4 }}>{p.pinned ? <Icon icon={Solar.pin} width={10} height={10} /> : null}{p.tag}</span>
                        <div style={{ flex:1, fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color:'#F0F0F8' }}>{p.title}</div>
                        <div style={{ display:'flex', gap:16, flexShrink:0 }}>
                          {[{ v:p.replies,label:'Replies'},{v:p.views,label:'Views'}].map((x,j)=>(
                            <div key={j} style={{ textAlign:'center' }}>
                              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:'#F0F0F8' }}>{x.v}</div>
                              <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:9, color:'#4A5568', textTransform:'uppercase', letterSpacing:1 }}>{x.label}</div>
                            </div>
                          ))}
                          <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:10, color:'#4A5568', alignSelf:'center' }}>{p.date}</div>
                        </div>
                      </Link>
                    )
                  })
              }
            </div>
          </div>
        )}

        {/* FRIENDS */}
        {activeTab==='Friends' && (
          <div>
            {/* Pending Friend Requests — own profile only */}
            {isOwnProfile && pendingRequests.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#F0F0F8' }}>Pending Requests</span>
                  <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#F0AA1A', fontWeight:600 }}>{pendingRequests.length}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {pendingRequests.map((r:any)=>(
                    <div key={r._id} style={{ ...S.card, display:'flex', alignItems:'center', gap:14, padding:'16px 20px' }}>
                      <Link href={`/profile/${r.slug}`} style={{ position:'relative', width:48, height:48, background:'rgba(52,152,219,0.1)', border:'1.5px solid rgba(52,152,219,0.3)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, textDecoration:'none' }}>
                        {r.avatarUrl
                          ? <img src={r.avatarUrl} alt="" style={{ width:48, height:48, borderRadius:10, objectFit:'cover' }} />
                          : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:20, color:'#3498DB' }}>{(r.username||'').slice(0,2).toUpperCase()}</span>
                        }
                      </Link>
                      <div style={{ flex:1, minWidth:0 }}>
                        <Link href={`/profile/${r.slug}`} style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:14, color:'#F0F0F8', textDecoration:'none' }}>{r.username}</Link>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#4A5568', marginTop:2 }}>Lv. {r.level || 1}</div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={async()=>{
                          try {
                            await usersApi.acceptFriend(r._id)
                            setPendingRequests(prev=>prev.filter(p=>p._id!==r._id))
                            // Add to friends list locally
                            setFriendsList(prev=>[...prev, { slug:r.slug, name:r.username, initials:(r.username||'').slice(0,2).toUpperCase(), color:'#3498DB', avatarUrl:r.avatarUrl, presenceStatus:r.isOnline?'online':'offline', activityText:'', statusColor:r.isOnline?'#4ade80':'#4A5568', statusLabel:r.isOnline?'Online':'Offline' }])
                          } catch {}
                        }} style={{ background:'rgba(39,174,96,0.12)', border:'1px solid rgba(39,174,96,0.4)', borderRadius:6, padding:'6px 14px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.5, textTransform:'uppercase', color:'#27AE60', cursor:'pointer' }}>
                          Accept
                        </button>
                        <button onClick={async()=>{
                          try {
                            await usersApi.declineFriend(r._id)
                            setPendingRequests(prev=>prev.filter(p=>p._id!==r._id))
                          } catch {}
                        }} style={{ background:'rgba(231,76,60,0.08)', border:'1px solid rgba(231,76,60,0.25)', borderRadius:6, padding:'6px 14px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.5, textTransform:'uppercase', color:'#E74C3C', cursor:'pointer' }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#F0F0F8' }}>Friends</span>
              <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:'#4A5568' }}>{ALL_FRIENDS.length} total</span>
            </div>
            {ALL_FRIENDS.length===0
              ? <div style={{ textAlign:'center', padding:'48px 0', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>No friends yet.</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {ALL_FRIENDS.map((f:any,i:number)=>(
                    <Link key={i} href={`/profile/${f.slug}`} style={{ ...S.card, display:'flex', alignItems:'center', gap:14, padding:'16px 20px', textDecoration:'none', transition:'border-color 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.12)')}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
                      <div style={{ position:'relative', width:48, height:48, background:(f.color||'#E74C3C')+'1A', border:`1.5px solid ${f.color||'#E74C3C'}44`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                        {f.avatarUrl && (f.avatarUrl.startsWith('http') || f.avatarUrl.startsWith('/') || f.avatarUrl.startsWith('data:image'))
                          ? <img src={f.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                          : <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:20, color:f.color||'#E74C3C' }}>{f.initials}</span>}
                        <div style={{ position:'absolute', bottom:-2, right:-2, width:12, height:12, background:f.statusColor||'#4A5568', border:'2px solid #0F0F1A', borderRadius:'50%' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:700, fontSize:14, color:f.color||'#F0F0F8' }}>{f.name}</div>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'#4A5568', marginTop:2 }}>{f.statusLabel}</div>
                      </div>
                    </Link>
                  ))}
                </div>
            }
          </div>
        )}

        {/* TEAMS */}
        {activeTab==='Teams' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:28, color:'#F0F0F8' }}>Teams</span>
                <span style={{ fontFamily:"'Barlow',sans-serif", fontSize:14, color:'#4A5568' }}>{ALL_TEAMS.length} total</span>
              </div>
            </div>
            {ALL_TEAMS.length===0
              ? <div style={{ textAlign:'center', padding:'48px 0', color:'#4A5568', fontFamily:"'Barlow',sans-serif", fontSize:13 }}>Not on any teams yet.</div>
              : <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                  {ALL_TEAMS.map((t:any,i:number)=>{
                    const wr = t.wins+t.losses>0?Math.round(t.wins/(t.wins+t.losses)*100):0
                    const roleColor = t.role==='Leader'?'#F39C12':t.role==='Captain'?'#E74C3C':'#4A5568'
                    return (
                      <Link key={i} href={`/teams/${t.slug}`} style={{ ...S.card, textDecoration:'none', transition:'border-color 0.15s', display:'block' }}
                        onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.12)')}
                        onMouseLeave={e=>(e.currentTarget.style.borderColor='rgba(255,255,255,0.06)')}>
                        <div style={{ height:90, background:t.banner?`url(${t.banner}) center/cover`:'linear-gradient(135deg,#1A1A2E,#0D0D1F)', position:'relative' }}>
                          <div style={{ position:'absolute', bottom:-26, left:20, width:54, height:54, background:'#1A1A2E', border:'2px solid #0F0F1A', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                            <GameIconCell icon={t.logoUrl || t.icon} size={30} />
                          </div>
                        </div>
                        <div style={{ padding:'34px 20px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#F0F0F8', flex:1 }}>{t.name}</span>
                            <span style={{ fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:10, letterSpacing:1, textTransform:'uppercase', color:roleColor, background:roleColor+'18', border:`1px solid ${roleColor}44`, borderRadius:20, padding:'3px 9px' }}>{t.role}</span>
                          </div>
                          <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:'#4A5568', marginBottom:16 }}>{t.game} · {t.ladder}</div>
                          <div style={{ display:'flex', gap:20 }}>
                            {[{v:t.wins,c:'#4ade80',l:'Wins'},{v:t.losses,c:'#E74C3C',l:'Losses'},{v:`${wr}%`,c:'#F39C12',l:'Win Rate'}].map((x,j)=>(
                              <div key={j} style={{ textAlign:'center' }}>
                                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:24, color:x.c }}>{x.v}</div>
                                <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:9, color:'#4A5568', textTransform:'uppercase', letterSpacing:1 }}>{x.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
            }
          </div>
        )}

      </div>

      {/* ── VOD MODAL ── */}
      {vodModal && (
        <div onClick={()=>setVodModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:'min(900px,90vw)', background:'#0F0F1A', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:15, color:'#F0F0F8' }}>{vodModal.title}</span>
              <button type="button" onClick={()=>setVodModal(null)} style={{ background:'none', border:'none', color:'#6B7280', cursor:'pointer', display:'flex', alignItems:'center' }} aria-label="Close"><Icon icon={Solar.close} width={18} height={18} /></button>
            </div>
            <div style={{ aspectRatio:'16/9' }}>
              <iframe src={`${vodModal.url}?autoplay=1`} style={{ width:'100%', height:'100%', border:'none' }} allowFullScreen />
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT PROFILE MODAL ── */}
      {editOpen && (
        <EditModal profile={{ ...profile, avatarUrl, bannerUrl }} onClose={()=>setEditOpen(false)} onSave={handleEditSave} />
      )}

    </div>
  )
}