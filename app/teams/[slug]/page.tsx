'use client'

// FILE: app/teams/[slug]/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useApi } from '@/lib/use-api'
import { teamsApi, matchesApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import PostMatchModal from '@/app/components/PostMatchModal'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }
const BC: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

type MatchType = 'cash' | 'xp'
const CFG: Record<MatchType, { accent: string; dim: string; bdr: string; badge: string; icon: string }> = {
  cash: { accent: '#F0AA1A', dim: 'rgba(212,146,10,.15)', bdr: 'rgba(212,146,10,.3)', badge: 'WAGER', icon: '$' },
  xp:   { accent: '#A78BFA', dim: 'rgba(124,58,237,.15)', bdr: 'rgba(124,58,237,.3)', badge: 'XP LADDER', icon: 'XP' },
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  PSN:        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.998.636.198.762.868.762 1.558v5.5c2.363 1.09 4.141-.17 4.141-3.026 0-2.925-1.013-4.238-3.95-5.289C12.32 3.01 9.892 2.272 7.985 1.646z" fill="#003087"/><path d="M3 19.304l4.745 1.543c1.65.537 3.532.396 5.07-.393L9.17 21.835V20.09L3 18.104v1.2zm18-3.697v-1.2l-3.635.876v3.257l-4.88 1.993c-1.37.56-3.04.63-4.485.06v1.21c1.55.52 3.37.42 4.86-.25l8.14-3.32v-2.625z" fill="#003087"/></svg>,
  psn:        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.998.636.198.762.868.762 1.558v5.5c2.363 1.09 4.141-.17 4.141-3.026 0-2.925-1.013-4.238-3.95-5.289C12.32 3.01 9.892 2.272 7.985 1.646z" fill="#003087"/><path d="M3 19.304l4.745 1.543c1.65.537 3.532.396 5.07-.393L9.17 21.835V20.09L3 18.104v1.2zm18-3.697v-1.2l-3.635.876v3.257l-4.88 1.993c-1.37.56-3.04.63-4.485.06v1.21c1.55.52 3.37.42 4.86-.25l8.14-3.32v-2.625z" fill="#003087"/></svg>,
  Xbox:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#107C10"/><path d="M6.5 7C7.8 5.6 9.8 5 12 5s4.2.6 5.5 2c-1.2-1-3-2.5-5.5-2.5S7.7 6 6.5 7zm11 1.5c-.5-1-2.5-3.5-5.5-3.5S8 7.5 7.5 8.5C6 10 5 11 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1-.9-2-1.5-3.5z" fill="white"/></svg>,
  xbox:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#107C10"/><path d="M6.5 7C7.8 5.6 9.8 5 12 5s4.2.6 5.5 2c-1.2-1-3-2.5-5.5-2.5S7.7 6 6.5 7zm11 1.5c-.5-1-2.5-3.5-5.5-3.5S8 7.5 7.5 8.5C6 10 5 11 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1-.9-2-1.5-3.5z" fill="white"/></svg>,
  PC:         <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="#00AFF4" strokeWidth="1.5" fill="none"/><path d="M8 21h8M12 17v4" stroke="#00AFF4" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  steam:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M11.979 0C5.678 0 .511 4.86.022 10.942l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.83c0-2.596 2.113-4.708 4.708-4.708 2.596 0 4.708 2.112 4.708 4.708 0 2.596-2.112 4.708-4.708 4.708h-.11l-4.076 2.91c0 .049.002.098.002.147 0 1.947-1.58 3.531-3.531 3.531a3.536 3.536 0 01-3.488-2.953L.293 15.267A12 12 0 0011.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0z" fill="#1b2838"/></svg>,
  epic:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V22.12c0 1.374.504 1.879 1.877 1.879h16.926c1.374 0 1.877-.505 1.877-1.879V1.879C22.34.506 21.837 0 20.463 0zm3.475 4.238h10v2h-7.5v4h6v2h-6v4h7.5v2h-10z" fill="#888"/></svg>,
  activision: <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h4l6-12 6 12h4L12 2z" fill="#888"/></svg>,
  riot:       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12.534 21.77l-1.09-2.81 10.52-2.665.438 3.416zm-3.31-3.6L6.2 8.282l11.563 5.04-1.288 2.015zm-3.865-4.79L2.036 2.23l12.322 7.27-2.303 2.397z" fill="#D32936"/></svg>,
  battlenet:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00AEFF" strokeWidth="2" fill="none"/><path d="M12 6v12M6 12h12" stroke="#00AEFF" strokeWidth="2" strokeLinecap="round"/></svg>,
  nintendo:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="22" height="18" rx="4" stroke="#E60012" strokeWidth="2" fill="none"/><circle cx="8" cy="12" r="3" fill="#E60012"/><line x1="12" y1="3" x2="12" y2="21" stroke="#E60012" strokeWidth="2"/></svg>,
}

const PLAYER_SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Twitter: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#1DA1F2"/></svg>,
  Twitch:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M2.149 0L.537 4.119V20.8H6.19V24h3.132l3.129-3.2h4.674l6.227-6.226V0H2.149zm19.164 13.612l-3.582 3.58H12.34l-3.128 3.129v-3.13H4.537V2.686h16.776v10.926zm-3.582-7.343v6.262h-2.686V6.27h2.686zm-7.343 0v6.262H7.702V6.27h2.686z" fill="#9146FF"/></svg>,
  Discord: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" fill="#5865F2"/></svg>,
  YouTube: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg>,
  TikTok:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" fill="#fff"/></svg>,
  Instagram: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ overflow: 'visible', display: 'block' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="#E1306C"/></svg>,
}

const SOCIAL_META: Record<string, { icon: React.ReactNode; label: string; color: string; placeholder: string }> = {
  twitchUrl: {
    label: 'Twitch', color: '#9146FF', placeholder: 'https://twitch.tv/yourteam',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
  },
  twitterUrl: {
    label: 'X / Twitter', color: '#fff', placeholder: 'https://x.com/yourteam',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  youtubeUrl: {
    label: 'YouTube', color: '#FF0000', placeholder: 'https://youtube.com/@yourteam',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  },
  discordUrl: {
    label: 'Discord', color: '#5865F2', placeholder: 'https://discord.gg/invite',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>,
  },
}


function LoadingSkeleton() {
  return (
    <div style={{ background: '#0C0C11', minHeight: '100vh' }}>
      <div style={{ height: 200, background: 'linear-gradient(135deg, #0d1520, #0a0a0c)' }} />
      <div style={{ height: 60, background: '#13131A' }} />
      <div className="container" style={{ padding: '28px 30px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div style={{ height: 300, background: '#18181C', borderRadius: 12, opacity: 0.5 }} />
        <div style={{ height: 300, background: '#18181C', borderRadius: 12, opacity: 0.5 }} />
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TeamProfilePage() {
  const params = useParams()
  const slug   = (params?.slug as string) || ''
  const { user } = useAuth()

  const router = useRouter()
  const [refreshKey,      setRefreshKey]      = useState(0)
  const [showPostMatch,   setShowPostMatch]   = useState(false)
  const [seasonIdx,       setSeasonIdx]       = useState(0)

  const { data: team, loading, error } = useApi(() => teamsApi.getBySlug(slug), [slug, refreshKey])
  const refresh = () => setRefreshKey(k => k + 1)

  // Fetch live/pending match for this team
  const teamId = team?._id
  const { data: liveMatch } = useApi(
    () => teamId ? matchesApi.getLive(teamId) : Promise.resolve(null),
    [teamId, refreshKey]
  )

  if (loading) return <LoadingSkeleton />
  if (error || !team) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2L1 21h22L12 2z" fill="#F0AA1A"/><path d="M12 9v5" stroke="#0C0C11" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="17" r="1" fill="#0C0C11"/></svg>
      <div style={{ ...R, color: '#9CA3AF' }}>Team not found.</div>
      <Link href="/games" style={{ ...R, color: '#B22D2D', fontSize: 13 }}>← Back to Games</Link>
    </div>
  )

  const matchType = (team.matchType || 'xp') as MatchType
  const cfg       = CFG[matchType]
  const seasons   = team.seasons  || []
  const roster    = team.roster   || []
  const matches   = team.matches  || []
  const myEntry   = roster.find((r: any) => r.userId?.toString() === user?.id)
  const isMyTeam  = !!myEntry
  const myRole    = myEntry?.role || null
  const canManage = myRole === 'Leader' || myRole === 'Captain'
  const total     = (team.wins || 0) + (team.losses || 0)
  const winPct    = total === 0 ? '—' : ((team.wins / total) * 100).toFixed(1) + '%'
  const socials   = Object.entries(SOCIAL_META).filter(([k]) => (team as any)[k])

  const SEASON_STATS = [
    { label: 'W',    val: team.wins           || 0, color: '#4ade80' },
    { label: 'L',    val: team.losses         || 0, color: '#E74C3C' },
    { label: 'D',    val: team.draws          || 0, color: '#9CA3AF' },
    { label: 'W%',   val: winPct,                   color: '#F0AA1A' },
    { label: 'STRK', val: team.winStreak      || 0, color: (team.winStreak || 0) > 0 ? '#4ade80' : '#9CA3AF' },
    { label: 'BEST', val: team.bestWinStreak  || 0, color: '#A78BFA' },
    { label: 'MP',   val: total,                    color: '#9CA3AF' },
    { label: 'RANK', val: team.currentRank || 'Unranked', color: '#fff' },
    { label: 'XP',   val: team.xp ?? 500,               color: '#A78BFA' },
  ]

  return (
    <div style={{ background: '#0C0C11', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── BANNER ── */}
      <div style={{ background: team.bannerUrl ? `url(${team.bannerUrl}) center/cover no-repeat` : `linear-gradient(160deg, ${team.bannerColor || '#0d1520'} 0%, #0a0a0c 100%)`, borderBottom: '1px solid #1a1a24', position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ padding: '36px 30px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>

            {/* Logo */}
            <div style={{ width: 88, height: 88, background: '#18181C', border: `2px solid ${cfg.accent}33`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, flexShrink: 0, overflow: 'hidden' }}>
              {team.logoUrl ? <img src={team.logoUrl} alt={team.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ ...BC, fontWeight: 900, fontSize: 28, color: cfg.accent }}>{team.name?.charAt(0).toUpperCase()}</span>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ ...BC, fontWeight: 900, fontSize: 36, color: '#fff', margin: 0, lineHeight: 1 }}>{team.name}</h1>
                <span style={{ background: `${cfg.accent}18`, border: `1px solid ${cfg.accent}30`, borderRadius: 4, padding: '3px 9px', ...R, fontSize: 11, fontWeight: 700, color: cfg.accent, letterSpacing: 0.5, textTransform: 'uppercase' }}>{cfg.badge}</span>
                {team.isPremiumTeam && <span style={{ background: 'rgba(240,170,26,0.09)', border: '1px solid rgba(240,170,26,0.19)', borderRadius: 4, padding: '3px 9px', ...R, fontSize: 11, fontWeight: 700, color: '#F0AA1A', letterSpacing: 0.5, textTransform: 'uppercase' }}>&#9733; Premium</span>}
                {team.isRecruiting && <span style={{ background: 'rgba(74,222,128,0.09)', border: '1px solid rgba(74,222,128,0.19)', borderRadius: 4, padding: '3px 9px', ...R, fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: 0.5, textTransform: 'uppercase' }}>Recruiting</span>}
              </div>

              {/* Game + Ladder + Format tags */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <Link href={`/games/${team.gameSlug}`} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 11px', textDecoration: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 11h4V7H6v4zm8 0h4V7h-4v4zM2 19h20V5a2 2 0 00-2-2H4a2 2 0 00-2 2v14zm4-2a1 1 0 110-2 1 1 0 010 2zm12 0a1 1 0 110-2 1 1 0 010 2zm-4 2h-4l-1 3h6l-1-3z" fill="#cbd5e1"/></svg>
                  <span style={{ ...R, fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{team.game}</span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 11px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 2l6 6 6-6M4 10l8 8 8-8" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ ...R, fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{team.ladder}</span>
                </div>
                {team.format && team.format !== team.ladder && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '5px 11px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" fill="#cbd5e1"/><path d="M2 21c0-4.418 4.477-8 10-8s10 3.582 10 8" fill="#cbd5e1"/><circle cx="5" cy="10" r="2.5" fill="#cbd5e1" opacity="0.5"/><circle cx="19" cy="10" r="2.5" fill="#cbd5e1" opacity="0.5"/></svg>
                    <span style={{ ...R, fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>{team.format}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 11px' }}>
                  <span style={{ ...R, fontSize: 11, color: '#6B7280' }}>ID-{team._id?.toString().slice(-8).toUpperCase()}</span>
                  {socials.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                      {socials.map(([key, meta]) => (
                        <a key={key} href={(team as any)[key]} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', color: meta.color, opacity: 0.7, transition: 'opacity .15s', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
                          {meta.icon}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {team.bio && <p style={{ ...R, fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: '0 0 10px', maxWidth: 480 }}>{team.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── SEASON/RECORD BAR — always shown ── */}
      <div style={{ background: '#13131A', borderBottom: '1px solid #25252C' }}>
        <div className="container" style={{ padding: '0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
            {/* Season selector */}
            <div style={{ padding: '12px 20px 12px 0', borderRight: '1px solid #25252C', marginRight: 0, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 80 }}>
              <div style={{ ...R, fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Season</div>
              <div style={{ ...BC, fontWeight: 900, fontSize: 16, color: '#fff' }}>{seasons.length > 0 ? `S${seasons.length - seasonIdx}` : 'All Time'}</div>
              {seasons.length > 1 && (
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {seasons.map((_: any, i: number) => (
                    <button key={i} onClick={() => setSeasonIdx(i)} style={{ padding: '1px 6px', background: seasonIdx === i ? '#B22D2D' : 'rgba(255,255,255,.06)', border: `1px solid ${seasonIdx === i ? '#B22D2D' : 'rgba(255,255,255,.1)'}`, borderRadius: 4, ...R, fontWeight: 700, fontSize: 9, color: seasonIdx === i ? '#fff' : 'rgba(255,255,255,.4)', cursor: 'pointer' }}>S{seasons.length - i}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            {SEASON_STATS.map((s, i) => (
              <div key={i} style={{ padding: '12px 18px', borderRight: '1px solid #25252C', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ ...R, fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>{s.label}</div>
                <div style={{ ...BC, fontWeight: 900, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.val}</div>
              </div>
            ))}

            {/* Trophies */}
            <div style={{ padding: '12px 20px', marginLeft: 'auto', display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
              {[
                { c: '#F0C040', n: team.trophiesGold   || 0, l: 'Gold'   },
                { c: '#C0C0C0', n: team.trophiesSilver || 0, l: 'Silver' },
                { c: '#CD7F32', n: team.trophiesBronze || 0, l: 'Bronze' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill={t.c}/>
                    <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill={t.c}/>
                    <rect x="10" y="14" width="4" height="4" fill={t.c}/>
                    <rect x="7" y="18" width="10" height="3" rx="1" fill={t.c}/>
                  </svg>
                  <span style={{ ...BC, fontWeight: 900, fontSize: 15, color: t.c }}>{t.n}</span>
                  <span style={{ ...R, fontSize: 9, color: 'rgba(255,255,255,.3)' }}>{t.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="container" style={{ padding: '28px 30px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Players + Match History stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Players */}
          <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 15, background: '#B22D2D', borderRadius: 2 }} />
                <span style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#fff' }}>Players</span>
                <span style={{ ...R, fontSize: 11, color: '#6B7280' }}>{roster.length}/{team.maxMembers}</span>
              </div>
            </div>
            <div>
              {roster.map((p: any, i: number) => {
                const rColor = p.role === 'Leader' ? '#F39C12' : p.role === 'Captain' ? '#E74C3C' : '#6B7280'
                const rBg    = p.role === 'Leader'  ? 'rgba(243,156,18,0.1)'  : p.role === 'Captain' ? 'rgba(231,76,60,0.1)'  : 'rgba(255,255,255,0.04)'
                const rBdr   = p.role === 'Leader'  ? 'rgba(243,156,18,0.25)' : p.role === 'Captain' ? 'rgba(231,76,60,0.25)' : 'rgba(255,255,255,0.07)'
                const pColor = p.color || '#E74C3C'
                const rep    = p.reputation || 0
                const repClr = p.repColor || '#ef4444'
                const repGrd = p.repGradient || `linear-gradient(90deg,${repClr},${repClr})`
                const repPct = Math.round(((rep % 50) / 50) * 100)
                const pWins  = p.wins || 0
                const pLosses = p.losses || 0
                const pGT    = p.goldTrophies || 0
                const pST    = p.silverTrophies || 0
                const pBT    = p.bronzeTrophies || 0
                const gamertags = p.gamertags || []
                const playerSocials = p.socials || []
                const gameRank = p.gameRank
                const isPremium = p.isPremium
                return (
                  <div key={i} style={{ padding: '16px 24px', borderBottom: i < roster.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    {/* Single row: Avatar | Name+Badges | Stats | Trophies | Socials */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                      {/* Avatar */}
                      <div style={{ width: 46, height: 46, background: pColor + '22', border: `2px solid ${pColor}55`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', ...BC, fontWeight: 900, fontSize: 16, color: pColor, flexShrink: 0 }}>
                        {p.initials || p.username?.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Name + Badges + Rep */}
                      <div style={{ minWidth: 140, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {p.slug ? (
                            <Link href={`/profile/${p.slug}`} style={{ ...R, fontWeight: 700, fontSize: 14, color: pColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', maxWidth: 120 }}
                              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                              {p.username}
                            </Link>
                          ) : (
                            <span style={{ ...R, fontWeight: 700, fontSize: 14, color: pColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{p.username}</span>
                          )}
                          <span style={{ background: rBg, border: `1px solid ${rBdr}`, borderRadius: 4, padding: '2px 7px', ...R, fontWeight: 700, fontSize: 9, color: rColor, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 }}>{p.role}</span>
                          {isPremium && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#F0AA1A', background: 'rgba(240,170,26,0.09)', border: '1px solid rgba(240,170,26,0.19)', borderRadius: 4, padding: '2px 6px', letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 0 }}>&#9733; Premium</span>
                          )}
                          {p.isCoach && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA', background: 'rgba(96,165,250,0.09)', border: '1px solid rgba(96,165,250,0.19)', borderRadius: 4, padding: '2px 6px', letterSpacing: 0.4, textTransform: 'uppercase', flexShrink: 0 }}>Coach</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                          <span style={{ ...R, fontSize: 9, color: '#4A5568' }}>Reputation</span>
                          <div style={{ height: 5, width: 70, background: 'rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
                            <div style={{ height: 5, width: `${repPct}%`, background: repGrd, borderRadius: 10, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ ...R, fontSize: 10, color: repClr, fontWeight: 700 }}>{rep}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                      {/* W/L */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 50 }}>
                        <span style={{ ...R, fontSize: 9, color: '#4A5568', textTransform: 'uppercase', letterSpacing: 0.5 }}>W/L</span>
                        <span style={{ ...BC, fontSize: 15, fontWeight: 900, marginTop: 2 }}>
                          <span style={{ color: '#4ade80' }}>{pWins}</span>
                          <span style={{ color: '#4A5568' }}>/</span>
                          <span style={{ color: '#E74C3C' }}>{pLosses}</span>
                        </span>
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                      {/* Trophies */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        {[{ c: '#F0C040', n: pGT }, { c: '#C0C0C0', n: pST }, { c: '#CD7F32', n: pBT }].map((t, j) => (
                          <div key={j} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill={t.c}/>
                              <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill={t.c}/>
                              <rect x="10" y="14" width="4" height="4" fill={t.c}/>
                              <rect x="7" y="18" width="10" height="3" rx="1" fill={t.c}/>
                            </svg>
                            <span style={{ ...BC, fontSize: 12, fontWeight: 900, color: t.c }}>{t.n}</span>
                          </div>
                        ))}
                      </div>

                      {/* Divider */}
                      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

                      {/* Game Rank */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, minWidth: 55 }}>
                        <span style={{ ...R, fontSize: 9, color: '#4A5568', textTransform: 'uppercase', letterSpacing: 0.5 }}>Rank</span>
                        <span style={{ ...BC, fontSize: 15, fontWeight: 900, color: gameRank ? '#F0AA1A' : '#4A5568', marginTop: 2 }}>
                          {gameRank ? `#${gameRank}` : '--'}
                        </span>
                      </div>

                      {/* Spacer to push socials + gamertags right */}
                      <div style={{ flex: 1 }} />

                      {/* Gamertags + Socials */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {gamertags.map((g: any, j: number) => (
                          <div key={`gt-${j}`} title={`${g.platform}: ${g.tag}`} style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '3px 8px' }}>
                            <span style={{ display: 'flex', alignItems: 'center' }}>{PLATFORM_ICONS[g.platform]}</span>
                            <span style={{ ...R, fontSize: 10, color: '#9CA3AF', fontWeight: 600 }}>{g.tag}</span>
                          </div>
                        ))}
                        {playerSocials.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {playerSocials.map((s: any, j: number) => (
                              <a key={`sc-${j}`} href={s.url || '#'} target="_blank" rel="noreferrer" title={s.label}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5, transition: 'opacity .15s', textDecoration: 'none', flexShrink: 0 }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                                {PLAYER_SOCIAL_ICONS[s.label]}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {roster.length === 0 && <div style={{ padding: '20px', textAlign: 'center', ...R, fontSize: 13, color: '#4A5568' }}>No members yet.</div>}
            </div>
          </div>

          {/* LIVE MATCH BLOCK — only renders when a match is active */}
          {liveMatch && liveMatch.matchId && (() => {
            const mCfg = liveMatch.matchType === 'cash'
              ? { accent: '#F0AA1A', dim: 'rgba(212,146,10,.15)', bdr: 'rgba(212,146,10,.3)', badge: 'WAGER MATCH', sectionTitle: 'Live Match', routeBase: '/matches/cash' }
              : { accent: '#A78BFA', dim: 'rgba(124,58,237,.15)', bdr: 'rgba(124,58,237,.3)', badge: 'XP LADDER', sectionTitle: 'Live Match', routeBase: '/matches/xp' }
            return (
              <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', marginBottom: 16 }}>
                {/* Card header — matches old UI tp-card-header */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 3, height: 15, background: mCfg.accent, borderRadius: 2 }} />
                  <span style={{ ...BC, fontWeight: 900, fontSize: 16, color: '#fff' }}>{mCfg.sectionTitle}</span>
                </div>
                {/* Live match card inside */}
                <div style={{ padding: '10px 14px' }}>
                  <Link href={`${mCfg.routeBase}/${liveMatch.matchId}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{ background: `linear-gradient(135deg,${mCfg.dim},rgba(15,15,24,.95))`, border: `1px solid ${mCfg.accent}66`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = mCfg.accent + 'aa')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = mCfg.accent + '66')}
                    >
                      {/* Left accent stripe */}
                      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: mCfg.accent, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Match ID */}
                        <div style={{ fontSize: 9, color: '#4F5568', fontFamily: "'Roboto',sans-serif", marginBottom: 6 }}>#{liveMatch.matchId}</div>
                        {/* Teams VS */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontFamily: "'Barlow Condensed',sans-serif" }}>
                          <span style={{ fontSize: 18 }}>{liveMatch.teamAEmoji || team.emoji || ''}</span>
                          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>{liveMatch.teamAName || 'Team A'}</span>
                          <span style={{ fontWeight: 400, fontSize: 13, color: '#4F5568' }}>vs</span>
                          <span style={{ fontSize: 18 }}>{liveMatch.teamBEmoji || ''}</span>
                          <span style={{ fontWeight: 900, fontSize: 16, color: '#fff' }}>{liveMatch.teamBName || 'Team B'}</span>
                        </div>
                        {/* Row 3 — detail chips */}
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[liveMatch.assignedGamemode || liveMatch.gamemode, liveMatch.format || liveMatch.ladder, liveMatch.assignedMap].filter(Boolean).map((label, i) => (
                            <span key={i} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 4, padding: '2px 8px', fontSize: 9, fontWeight: 700, color: '#8890A4', fontFamily: "'Roboto',sans-serif", letterSpacing: .3 }}>{label}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0, background: mCfg.accent, color: '#000', borderRadius: 6, padding: '8px 16px', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: .8, whiteSpace: 'nowrap' }}>
                        VIEW LIVE →
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )
          })()}

          {/* Match History */}
          <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 15, background: '#B22D2D', borderRadius: 2 }} />
              <span style={{ ...BC, fontWeight: 900, fontSize: 16, color: '#fff' }}>Match History</span>
            </div>

            {matches.length === 0 ? (
              <div style={{ padding: '52px 24px', textAlign: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 12 }}><path d="M6 2l6 6 6-6M4 10l8 8 8-8" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{ ...BC, fontWeight: 900, fontSize: 18, color: '#fff', marginBottom: 6 }}>No matches yet</div>
                <div style={{ ...R, fontSize: 13, color: '#4A5568', marginBottom: 20 }}>Match results will appear here once your team starts competing.</div>
                {isMyTeam && canManage && (
                  <button onClick={() => setShowPostMatch(true)} style={{ background: '#B22D2D', border: 'none', borderRadius: 8, padding: '10px 24px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: 'pointer' }}>Post Your First Match</button>
                )}
              </div>
            ) : (
              <div>
                {matches.map((m: any, i: number) => {
                  const isWin   = m.result === 'win'
                  const isDraw  = m.result === 'draw'
                  const rColor  = isWin ? '#4ade80' : isDraw ? '#9CA3AF' : '#E74C3C'
                  const rBg     = isWin ? 'rgba(74,222,128,0.1)' : isDraw ? 'rgba(156,163,175,0.1)' : 'rgba(231,76,60,0.1)'
                  const matchUrl = m.matchType === 'cash' ? `/matches/cash/${m.matchId}` : `/matches/xp/${m.matchId}`
                  return (
                    <Link key={i} href={matchUrl} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: i < matches.length - 1 ? '1px solid #25252C' : 'none', textDecoration: 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 48, height: 48, background: rBg, border: `1.5px solid ${rColor}44`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ ...BC, fontWeight: 900, fontSize: 16, color: rColor }}>{m.result?.toUpperCase()}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...R, fontWeight: 700, fontSize: 14, color: '#fff' }}>vs. {m.opponentName || 'Unknown'}</div>
                        <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {m.game} · {m.ladder}
                          {(m.scoreUs !== undefined) ? ` · ${m.scoreUs}–${m.scoreThem}` : ''}
                          {m.cashAmount ? ` · ${m.result === 'win' ? '+' : '-'}$${(m.cashAmount / 100).toFixed(2)}` : ''}
                        </div>
                      </div>
                      <div style={{ ...R, fontSize: 11, color: '#4A5568' }}>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* View Game Page */}
          <Link href={`/games/${team.gameSlug}`} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#18181C', borderRadius: 12, padding: '16px 20px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.04)', transition: 'border-color .15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.accent + '44')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)')}>
            <div style={{ width: 44, height: 44, background: cfg.dim, border: `1px solid ${cfg.bdr}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 11h4V7H6v4zm8 0h4V7h-4v4zM2 19h20V5a2 2 0 00-2-2H4a2 2 0 00-2 2v14zm4-2a1 1 0 110-2 1 1 0 010 2zm12 0a1 1 0 110-2 1 1 0 010 2zm-4 2h-4l-1 3h6l-1-3z" fill={cfg.accent}/></svg>
            </div>
            <div>
              <div style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#fff' }}>{team.game}</div>
              <div style={{ ...R, fontSize: 11, color: cfg.accent, marginTop: 1 }}>View Game Page →</div>
            </div>
          </Link>

          {/* Post Match + Manage Team (Leader/Captain) / Leave Team (Member) */}
          {isMyTeam && (
            <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)', padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canManage ? (
                  <>
                    <button onClick={() => setShowPostMatch(true)}
                      style={{ background: '#B22D2D', border: 'none', borderRadius: 10, padding: '12px 20px', ...BC, fontWeight: 900, fontSize: 15, color: '#fff', cursor: 'pointer', boxShadow: '0 0 20px rgba(178,45,45,0.3)', letterSpacing: 0.5, width: '100%' }}>
                      Post Match
                    </button>
                    <Link href="/teams" style={{ display: 'block', background: '#202023', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '11px 20px', ...BC, fontWeight: 700, fontSize: 14, color: '#9CA3AF', textDecoration: 'none', textAlign: 'center', letterSpacing: 0.3 }}>
                      Manage Team
                    </Link>
                  </>
                ) : (
                  <button onClick={async () => {
                    if (!confirm('Are you sure you want to leave this team?')) return
                    try {
                      await teamsApi.leave(team._id)
                      window.location.href = '/teams'
                    } catch (e: any) {
                      alert(e?.message || 'Failed to leave team')
                    }
                  }}
                    style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 10, padding: '12px 20px', ...BC, fontWeight: 700, fontSize: 14, color: '#E74C3C', cursor: 'pointer', width: '100%', letterSpacing: 0.3 }}>
                    Leave Team
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPostMatch   && <PostMatchModal
        preTeam={{
          _id:        team._id,
          name:       team.name,
          emoji:      team.emoji,
          slug:       team.slug,
          game:       team.game,
          gameSlug:   team.gameSlug,
          matchType:  team.matchType,
          ladder:     team.ladder,
          format:     (team.format || team.ladder) as 'Solo'|'Duo'|'Squad',
          maxMembers: team.maxMembers,
          roster:     roster,
          modes:      team.modes || [],
        }}
        onClose={() => setShowPostMatch(false)}
        onPosted={refresh}
      />}

      <style>{`@keyframes tp-pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
    </div>
  )
}