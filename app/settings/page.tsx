'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { usersApi, authApi, linkedAccountsApi } from '@/lib/api'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const COLOR_PRESETS = [
  '#E74C3C','#C0392B','#E67E22','#F39C12','#F1C40F',
  '#2ECC71','#27AE60','#1ABC9C','#3498DB','#2980B9',
  '#9B59B6','#8E44AD','#E91E8C','#FF6B5B','#FFFFFF',
]

const SIDEBAR = [
  { id: 'settings',      label: 'Account Settings' },
  { id: 'features',      label: 'Account Features' },
  { id: 'linked',        label: 'Linked Accounts' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security',      label: 'Security' },
]

const INPUT: React.CSSProperties = {
  background: '#303034', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5,
  padding: '7px 10px', color: '#fff', fontSize: 12, fontFamily: 'Roboto, sans-serif',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}
const LABEL: React.CSSProperties = {
  fontFamily: 'Roboto, sans-serif', fontWeight: 400, fontSize: 12, color: '#fff', marginBottom: 4, display: 'block',
}
const R: React.CSSProperties = { fontFamily: "'Roboto', sans-serif" }

// ─── Social platform definitions ──────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { id: 'Twitter',   color: '#1DA1F2', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#1DA1F2"/></svg> },
  { id: 'Twitch',    color: '#9146FF', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="#9146FF"/></svg> },
  { id: 'Discord',   color: '#5865F2', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/></svg> },
  { id: 'YouTube',   color: '#FF0000', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/></svg> },
  { id: 'TikTok',    color: '#fff',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" fill="#fff"/></svg> },
  { id: 'Instagram', color: '#E1306C', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="#E1306C"/></svg> },
]

// ─── Gaming platform definitions ──────────────────────────────────────────
const GAMING_PLATFORMS: { id: string; label: string; color: string; type: 'oauth' | 'manual'; icon: React.ReactNode; fieldKey?: string }[] = [
  { id: 'psn',        label: 'PlayStation',   color: '#003087', type: 'manual', fieldKey: 'psnId',        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.998.636.198.762.868.762 1.558v5.5c2.363 1.09 4.141-.17 4.141-3.026 0-2.925-1.013-4.238-3.95-5.289C12.32 3.01 9.892 2.272 7.985 1.646z" fill="#003087"/><path d="M3 19.304l4.745 1.543c1.65.537 3.532.396 5.07-.393L9.17 21.835V20.09L3 18.104v1.2zm18-3.697v-1.2l-3.635.876v3.257l-4.88 1.993c-1.37.56-3.04.63-4.485.06v1.21c1.55.52 3.37.42 4.86-.25l8.14-3.32v-2.625z" fill="#003087"/></svg> },
  { id: 'xbox',       label: 'Xbox Live',     color: '#107C10', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#107C10"/><path d="M6.5 7C7.8 5.6 9.8 5 12 5s4.2.6 5.5 2c-1.2-1-3-2.5-5.5-2.5S7.7 6 6.5 7zm11 1.5c-.5-1-2.5-3.5-5.5-3.5S8 7.5 7.5 8.5C6 10 5 11 5 12c0 3.9 3.1 7 7 7s7-3.1 7-7c0-1-.9-2-1.5-3.5z" fill="white"/></svg> },
  { id: 'steam',      label: 'Steam',         color: '#1b2838', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M11.979 0C5.678 0 .511 4.86.022 10.942l6.432 2.658a3.387 3.387 0 011.912-.585c.064 0 .127.002.19.006l2.861-4.142V8.83c0-2.596 2.113-4.708 4.708-4.708 2.596 0 4.708 2.112 4.708 4.708 0 2.596-2.112 4.708-4.708 4.708h-.11l-4.076 2.91c0 .049.002.098.002.147 0 1.947-1.58 3.531-3.531 3.531a3.536 3.536 0 01-3.488-2.953L.293 15.267A12 12 0 0011.979 24c6.627 0 12-5.373 12-12S18.606 0 11.979 0z" fill="#1b2838"/></svg> },
  { id: 'epic',       label: 'Epic Games',    color: '#2f2d2e', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3.537 0C2.165 0 1.66.506 1.66 1.879V22.12c0 1.374.504 1.879 1.877 1.879h16.926c1.374 0 1.877-.505 1.877-1.879V1.879C22.34.506 21.837 0 20.463 0zm3.475 4.238h10v2h-7.5v4h6v2h-6v4h7.5v2h-10z" fill="#2f2d2e"/></svg> },
  { id: 'activision', label: 'Activision',    color: '#000',    type: 'manual', fieldKey: 'activisionId', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 20h4l6-12 6 12h4L12 2z" fill="#000" stroke="#666" strokeWidth="0.5"/></svg> },
  { id: 'riot',       label: 'Riot Games',    color: '#D32936', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12.534 21.77l-1.09-2.81 10.52-2.665.438 3.416zm-3.31-3.6L6.2 8.282l11.563 5.04-1.288 2.015zm-3.865-4.79L2.036 2.23l12.322 7.27-2.303 2.397z" fill="#D32936"/></svg> },
  { id: 'battlenet',  label: 'Battle.net',    color: '#00AEFF', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c.55 0 1 .45 1 1v4.59l3.29-3.3a1.003 1.003 0 011.42 1.42L14.41 12l3.3 3.29a1.003 1.003 0 01-1.42 1.42L13 13.41V18c0 .55-.45 1-1 1s-1-.45-1-1v-4.59l-3.29 3.3a1.003 1.003 0 01-1.42-1.42L9.59 12l-3.3-3.29a1.003 1.003 0 011.42-1.42L11 10.59V6c0-.55.45-1 1-1z" fill="#00AEFF"/></svg> },
  { id: 'nintendo',   label: 'Nintendo',      color: '#E60012', type: 'manual', fieldKey: 'nintendoId',   icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="22" height="18" rx="4" stroke="#E60012" strokeWidth="2" fill="none"/><circle cx="8" cy="12" r="3" fill="#E60012"/><line x1="12" y1="3" x2="12" y2="21" stroke="#E60012" strokeWidth="2"/></svg> },
  { id: 'discord',    label: 'Discord',       color: '#5865F2', type: 'oauth',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/></svg> },
]

function XpBoostTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}h ${m}m ${s}s remaining`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [expiresAt])
  return <div style={{ fontFamily: "'Roboto', sans-serif", fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{remaining}</div>
}

export default function SettingsPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>}>
      <SettingsPage />
    </Suspense>
  )
}

function SettingsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get('tab')
  const { user, refresh, logout } = useAuth()
  const [activeTab, setActiveTab] = useState(tabParam || 'settings')

  // ── Account Settings form ──
  const [form, setForm] = useState({
    firstName: '', lastName: '', bio: '',
    dob: '', phone: '',
    state: '', country: 'United States', zip: '',
    allowCompete: false, allowEmails: false,
  })

  // ── Gaming / social state ──
  const [socials, setSocials] = useState<{ label: string; url: string }[]>([])
  const [gamertags, setGamertags] = useState<Record<string, string>>({})

  // ── Account Features state ──
  const [hexColor, setHexColor] = useState('#E74C3C')
  const [nameModalOpen, setNameModalOpen] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [nameError, setNameError] = useState('')
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameAvailable, setNameAvailable] = useState<null | boolean>(null)
  const [nameChecking, setNameChecking] = useState(false)

  // ── UI state ──
  const [saved, setSaved] = useState(false)
  const [colorSaved, setColorSaved] = useState(false)
  const [xpMsg, setXpMsg] = useState('')
  const [colorMsg, setColorMsg] = useState('')

  // ── Notifications ──
  const [notifications, setNotifications] = useState<Record<string, { inApp: boolean; email: boolean }>>({})

  // ── Linked Accounts ──
  const [linkingPlatform, setLinkingPlatform] = useState('')
  const [unlinkingPlatform, setUnlinkingPlatform] = useState('')
  const [linkToast, setLinkToast] = useState<{ type: 'success' | 'error'; platform: string; message?: string } | null>(null)
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({})
  const [manualSaving, setManualSaving] = useState('')

  // ── Security ──
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')

  // ── Delete Account ──
  const [deleteModalOpen, setDeleteModalOpen]   = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading]       = useState(false)
  const [deleteError, setDeleteError]           = useState('')

  // ── Add Email (for OAuth-only users without an email) ──
  const [addEmailValue, setAddEmailValue] = useState('')
  const [addEmailMsg, setAddEmailMsg] = useState('')
  const [addEmailError, setAddEmailError] = useState('')
  const [addEmailLoading, setAddEmailLoading] = useState(false)

  useEffect(() => {
    if (tabParam && SIDEBAR.find(s => s.id === tabParam)) setActiveTab(tabParam)
  }, [tabParam])

  // Handle OAuth redirect result from URL params
  useEffect(() => {
    if (!searchParams) return
    const linkStatus = searchParams.get('linkStatus')
    const platform   = searchParams.get('platform')
    if (linkStatus && platform) {
      setLinkToast({
        type: linkStatus === 'success' ? 'success' : 'error',
        platform,
        message: searchParams.get('message') || undefined,
      })
      setTimeout(() => setLinkToast(null), 5000)
      // Clean URL params
      const url = new URL(window.location.href)
      url.searchParams.delete('linkStatus')
      url.searchParams.delete('platform')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
      // Refresh user data so linkedPlatforms updates
      refresh()
    }
  }, [searchParams])

  // Pre-fill from user
  useEffect(() => {
    if (!user) return
    setForm(prev => ({
      ...prev,
      firstName: (user as any).firstName || '',
      lastName:  (user as any).lastName  || '',
      bio:       (user as any).bio       || '',
      dob:       (user as any).dob ? new Date((user as any).dob).toISOString().split('T')[0] : '',
      phone:     (user as any).phone     || '',
      state:     (user as any).state     || '',
      country:   (user as any).country   || 'United States',
      zip:       (user as any).zip       || '',
      allowCompete: (user as any).allowCompete || false,
      allowEmails:  (user as any).allowEmails  || false,
    }))
    setHexColor(user.usernameColor || '#E74C3C')

    // Socials
    const s = (user as any).socials || []
    setSocials(Array.isArray(s) ? s.filter((x: any) => x.label && x.url) : [])

    // Gamertags
    const tags: Record<string, string> = {}
    const gt = (user as any).gamertags || []
    if (Array.isArray(gt)) gt.forEach((g: any) => { if (g.platform && g.tag) tags[g.platform] = g.tag })
    setGamertags(tags)

    // Manual platform IDs
    setManualInputs({
      psnId:        (user as any).psnId        || '',
      activisionId: (user as any).activisionId || '',
      nintendoId:   (user as any).nintendoId   || '',
    })

    // Notifications
    const notif = user.notifications || {}
    const notifState: Record<string, { inApp: boolean; email: boolean }> = {}
    const keys = ['matchAccepted','matchResult','disputeUpdate','tournamentUpdates','payoutReady','teamInvites','friendActivity','platformAnnouncements']
    keys.forEach(k => {
      notifState[k] = { inApp: (notif as any)[`${k}_inApp`] !== false, email: !!(notif as any)[`${k}_email`] }
    })
    setNotifications(notifState)
  }, [user])

  // ── Handlers ──
  const handleSave = async () => {
    try {
      await usersApi.updateMe({
        firstName: form.firstName,
        lastName:  form.lastName,
        bio:       form.bio,
        state:     form.state,
        country:   form.country,
        zip:       form.zip,
        dob:       form.dob || null,
        phone:     form.phone,
        allowCompete: form.allowCompete,
        allowEmails:  form.allowEmails,
      })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const handleColorSave = async () => {
    if (hexColor === user?.usernameColor) return
    setColorMsg('')
    try {
      await usersApi.changeNameColor(hexColor)
      await refresh()
      setColorMsg(user?.isPremium ? 'Applied! Color changed (free with Premium)' : 'Applied! 1 credit used')
      setColorSaved(true)
      setTimeout(() => { setColorSaved(false); setColorMsg('') }, 3000)
    } catch (err: any) {
      setColorMsg(err?.response?.data?.message || err?.message || 'Not enough tickets')
      setTimeout(() => setColorMsg(''), 3000)
    }
  }

  const handleCheckName = async () => {
    const trimmed = newDisplayName.trim()
    setNameError('')
    setNameAvailable(null)
    if (trimmed.length < 3 || trimmed.length > 16) {
      setNameError('Name must be 3-16 characters')
      return
    }
    setNameChecking(true)
    try {
      const res = await usersApi.checkNameAvailability(trimmed)
      setNameAvailable(res.available)
      if (!res.available) setNameError(res.reason || 'Name not available')
    } catch (err: any) {
      setNameError(err?.message || 'Failed to check availability')
    }
    setNameChecking(false)
  }

  const handleNameChange = async () => {
    setNameError('')
    setNameSuccess(false)
    const trimmed = newDisplayName.trim()
    if (trimmed.length < 3) { setNameError('Name must be at least 3 characters'); return }
    if (trimmed.length > 16) { setNameError('Name must be 16 characters or fewer'); return }
    try {
      await usersApi.changeName(trimmed)
      await refresh()
      setNameSuccess(true)
      setTimeout(() => { setNameModalOpen(false); setNameSuccess(false); setNewDisplayName(''); setNameAvailable(null) }, 1500)
    } catch (err: any) {
      setNameError(err?.message || 'Failed to change name')
    }
  }

  const handleRedeem2xp = async () => {
    setXpMsg('')
    try {
      const res = await usersApi.redeem2xp()
      await refresh()
      setXpMsg(`Purchased! You now have ${(res as any).doubleXpTokens} token(s)`)
      setTimeout(() => setXpMsg(''), 3000)
    } catch (err: any) {
      setXpMsg(err?.message || 'Not enough tickets')
      setTimeout(() => setXpMsg(''), 3000)
    }
  }

  const handleActivate2xp = async () => {
    setXpMsg('')
    try {
      await usersApi.activate2xp()
      await refresh()
      setXpMsg('2XP activated for 24 hours!')
      setTimeout(() => setXpMsg(''), 3000)
    } catch (err: any) {
      setXpMsg(err?.message || 'Failed to activate')
      setTimeout(() => setXpMsg(''), 3000)
    }
  }

  const handleSaveSocials = async () => {
    const clean = socials.filter(s => s.label && s.url.trim())
    try {
      await usersApi.updateMe({ socials: clean })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await usersApi.deleteAccount()
      logout()
      window.location.href = '/'
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  const handleSaveNotifications = async () => {
    const flat: Record<string, boolean> = {}
    Object.entries(notifications).forEach(([k, v]) => {
      flat[`${k}_inApp`] = v.inApp
      flat[`${k}_email`] = v.email
    })
    try {
      await usersApi.updateMe({ notifications: flat })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
  }

  const handleOAuthLink = async (platform: string) => {
    setLinkingPlatform(platform)
    try {
      const res = await linkedAccountsApi.getRedirectUrl(platform) as any
      if (res.redirectUrl) window.location.href = res.redirectUrl
    } catch (err: any) {
      setLinkToast({ type: 'error', platform, message: err.message || 'Failed to start linking' })
      setTimeout(() => setLinkToast(null), 4000)
      setLinkingPlatform('')
    }
  }

  const handleUnlink = async (platform: string) => {
    setUnlinkingPlatform(platform)
    try {
      await linkedAccountsApi.unlink(platform)
      await refresh()
      setLinkToast({ type: 'success', platform, message: 'Unlinked successfully' })
      setTimeout(() => setLinkToast(null), 3000)
    } catch (err: any) {
      setLinkToast({ type: 'error', platform, message: err.message || 'Failed to unlink' })
      setTimeout(() => setLinkToast(null), 4000)
    }
    setUnlinkingPlatform('')
  }

  const handleManualSave = async (fieldKey: string, platformId: string) => {
    setManualSaving(platformId)
    try {
      await usersApi.updateMe({ [fieldKey]: manualInputs[fieldKey] || '' })
      await refresh()
      setLinkToast({ type: 'success', platform: platformId, message: 'Saved' })
      setTimeout(() => setLinkToast(null), 2500)
    } catch {}
    setManualSaving('')
  }

  const handleChangePassword = async () => {
    setPwError('')
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters'); return }
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setPwSaved(true)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password')
    }
  }

  if (!user) return null

  const username = user.username || ''
  const canCompete = !!(form.state && form.country && form.zip && form.dob)
  const credits = (user as any).credits || 0
  const doubleXpTokens = (user as any).doubleXpTokens || 0
  const doubleXpActive = (user as any).doubleXpActive || false
  const doubleXpExpiresAt = (user as any).doubleXpExpiresAt ? new Date((user as any).doubleXpExpiresAt) : null
  const isXpBoostActive = doubleXpActive && doubleXpExpiresAt && doubleXpExpiresAt > new Date()
  const linkedPlatforms: any[] = (user as any).linkedPlatforms || []

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '32px 0 80px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '204px 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── SIDEBAR ── */}
          <div style={{ background: '#19191D', borderRadius: 10, padding: '20px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px 16px', borderBottom: '1px solid #202023', marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 16, color: hexColor, flexShrink: 0 }}>
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ ...R, fontWeight: 600, fontSize: 12, color: hexColor }}>{username}</div>
                <div style={{ ...R, fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Manage account</div>
              </div>
            </div>
            {SIDEBAR.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: activeTab === item.id ? 'calc(100% - 16px)' : '100%', padding: '10px 18px', background: activeTab === item.id ? '#303034' : 'none', border: 'none', borderRadius: activeTab === item.id ? 10 : 0, margin: activeTab === item.id ? '4px 8px' : '0', cursor: 'pointer', transition: 'background 0.15s', ...R, fontWeight: 600, fontSize: 12, color: activeTab === item.id ? '#fff' : '#9CA3AF', textAlign: 'left' }}>
                {item.label}
              </button>
            ))}
          </div>

          {/* ── MAIN PANEL ── */}
          <div style={{ background: '#19191D', borderRadius: 10, padding: '28px 48px 40px' }}>

            {/* ════════════════════ ACCOUNT SETTINGS ════════════════════ */}
            {activeTab === 'settings' && (
              <>
                <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#fff', marginBottom: 6 }}>Account Settings</div>
                <div style={{ ...R, fontSize: 12, color: '#9CA3AF', lineHeight: '14px', marginBottom: 20, maxWidth: 600 }}>
                  Complete your profile information below. You must fill out your State, Country, Zip Code, and Date of Birth to participate in tournaments and cash matches.
                </div>
                <div style={{ height: 1, background: '#303034', marginBottom: 20 }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 16 }}>
                  <div>
                    <label style={LABEL}>First Name</label>
                    <input style={INPUT} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="First Name" />
                  </div>
                  <div>
                    <label style={LABEL}>Last Name</label>
                    <input style={INPUT} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Last Name" />
                  </div>
                  <div>
                    <label style={LABEL}>Display Name <span style={{ fontSize: 10, color: '#6B7280' }}>Change via Account Features</span></label>
                    <input style={{...INPUT, opacity: 0.5, cursor: 'not-allowed'}} value={(user as any).displayName || user.username || ''} readOnly title="Change via Account Features tab" />
                  </div>
                  <div>
                    <label style={LABEL}>Email</label>
                    {user.email ? (
                      <input style={{...INPUT, opacity: 0.5, cursor: 'not-allowed'}} value={user.email} readOnly />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            style={INPUT}
                            type="email"
                            placeholder="Enter your email address"
                            value={addEmailValue}
                            onChange={e => { setAddEmailValue(e.target.value); setAddEmailMsg(''); setAddEmailError('') }}
                          />
                          <button
                            type="button"
                            disabled={addEmailLoading || !addEmailValue}
                            onClick={async () => {
                              setAddEmailLoading(true)
                              setAddEmailMsg('')
                              setAddEmailError('')
                              try {
                                await authApi.addEmail(addEmailValue)
                                setAddEmailMsg('Verification email sent! Check your inbox.')
                                setAddEmailValue('')
                                refresh()
                              } catch (err: any) {
                                setAddEmailError(err?.message || 'Failed to add email')
                              } finally {
                                setAddEmailLoading(false)
                              }
                            }}
                            style={{
                              padding:       '7px 12px',
                              background:    '#E74C3C',
                              color:         '#fff',
                              border:        'none',
                              borderRadius:  5,
                              fontSize:      12,
                              fontWeight:    600,
                              cursor:        addEmailLoading || !addEmailValue ? 'not-allowed' : 'pointer',
                              whiteSpace:    'nowrap',
                              opacity:       addEmailLoading || !addEmailValue ? 0.6 : 1,
                            }}
                          >
                            {addEmailLoading ? 'Sending…' : 'Verify'}
                          </button>
                        </div>
                        {addEmailMsg   && <p style={{ ...R, fontSize: 11, color: '#34D399', margin: 0 }}>{addEmailMsg}</p>}
                        {addEmailError && <p style={{ ...R, fontSize: 11, color: '#F87171', margin: 0 }}>{addEmailError}</p>}
                        <p style={{ ...R, fontSize: 11, color: '#6B7280', margin: 0 }}>
                          Your account was created via social login. Add an email to enable password login and notifications.
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={LABEL}>Date of Birth</label>
                    <input style={INPUT} type="date" value={form.dob} onChange={e => setForm({...form, dob: e.target.value})} />
                  </div>
                  <div>
                    <label style={LABEL}>Phone Number</label>
                    <input style={INPUT} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div>
                    <label style={LABEL}>State / Province</label>
                    <input style={INPUT} value={form.state} onChange={e => setForm({...form, state: e.target.value})} placeholder="State" />
                  </div>
                  <div>
                    <label style={LABEL}>Country / Region</label>
                    <select style={{...INPUT, cursor: 'pointer'}} value={form.country} onChange={e => setForm({...form, country: e.target.value})}>
                      {['United States','Canada','United Kingdom','Brazil','Mexico','Australia','Germany','France','Other'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Zip / Postal Code</label>
                    <input style={INPUT} value={form.zip} onChange={e => setForm({...form, zip: e.target.value})} placeholder="00000" />
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <label style={LABEL}>Bio <span style={{ fontSize: 10, color: '#6B7280' }}>Shown on your profile</span></label>
                  <textarea style={{ ...INPUT, height: 70, resize: 'vertical' }} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="Tell others about yourself..." maxLength={500} />
                  <div style={{ ...R, fontSize: 10, color: '#4A5568', marginTop: 3, textAlign: 'right' }}>{form.bio.length}/500</div>
                </div>

                <div style={{ height: 1, background: '#303034', margin: '24px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <label style={{ display: 'flex', gap: 14, cursor: canCompete ? 'pointer' : 'not-allowed', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={form.allowCompete} onChange={e => canCompete && setForm({...form, allowCompete: e.target.checked})} disabled={!canCompete} style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0, accentColor: '#E74C3C' }} />
                    <span style={{ ...R, fontSize: 12, color: '#9CA3AF', lineHeight: '14px' }}>
                      By checking the box, you are allowed to participate in tournaments and cash matches. All required information needs to be filled out.{' '}
                      {!canCompete && <span style={{ color: '#F39C12' }}>— Fill out State, Country, Zip & DOB first.</span>}{' '}
                      Use of false information may result in account suspension.{' '}
                      <a href="/rules" style={{ color: '#E74C3C' }}>View policy →</a>
                    </span>
                  </label>
                  <label style={{ display: 'flex', gap: 14, cursor: 'pointer', alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={form.allowEmails} onChange={e => setForm({...form, allowEmails: e.target.checked})} style={{ width: 14, height: 14, marginTop: 2, flexShrink: 0, accentColor: '#E74C3C' }} />
                    <span style={{ ...R, fontSize: 12, color: '#9CA3AF', lineHeight: '14px' }}>
                      By checking the box, you agree to receive news, updates, and promotions by email from GamerHead and its affiliates. You can unsubscribe at any time.
                    </span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 28 }}>
                  {saved && <span style={{ ...R, fontSize: 12, color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.checkRead} width={14} height={14} /> Settings saved</span>}
                  <button onClick={handleSave} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '9px 28px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer' }}>Save Changes</button>
                </div>

                {/* ── Danger Zone ── */}
                <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 32 }}>
                  <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#E74C3C', marginBottom: 8 }}>Danger Zone</div>
                  <div style={{ border: '1px solid rgba(231,76,60,0.25)', borderRadius: 8, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>Delete Account</div>
                      <div style={{ ...R, fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
                        Your account will be deactivated immediately. You have <span style={{ color: '#F39C12', fontWeight: 600 }}>30 days</span> to log back in and reactivate it — after that it is permanently closed.
                      </div>
                    </div>
                    <button
                      onClick={() => { setDeleteModalOpen(true); setDeleteConfirmText(''); setDeleteError('') }}
                      style={{ background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: 6, padding: '8px 18px', ...R, fontWeight: 600, fontSize: 12, color: '#E74C3C', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ════════════════════ ACCOUNT FEATURES ════════════════════ */}
            {activeTab === 'features' && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#fff' }}>Account Features</div>
                  {/* Premium timer top-right */}
                  {user.isPremium && (user as any).premiumExpiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: 8, padding: '6px 14px' }}>
                      <Icon icon={Solar.star} width={14} height={14} style={{ color: '#F39C12', flexShrink: 0 }} />
                      <div>
                        <div style={{ ...R, fontWeight: 700, fontSize: 10, color: '#F39C12', textTransform: 'uppercase', letterSpacing: 0.5 }}>Premium Active</div>
                        <div style={{ ...R, fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Expires {new Date((user as any).premiumExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 20 }}>
                  Use your tickets to unlock features. You have <span style={{ color: '#F39C12', fontWeight: 700 }}>{credits} Tickets</span>.
                </div>
                <div style={{ height: 1, background: '#303034', marginBottom: 24 }} />

                {/* Feature Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>

                  {/* Name Change */}
                  <div style={{ background: '#25252C', borderRadius: 10, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div><Icon icon={Solar.pen} width={28} height={28} /></div>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', textAlign: 'center' }}>Name Change</div>
                    <div style={{ ...R, fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: '14px' }}>Change your Display Name</div>
                    <div style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.35)', borderRadius: 20, padding: '2px 9px', ...R, fontWeight: 700, fontSize: 10, color: '#F39C12' }}>
                      {user.isPremium ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.star} width={12} height={12} /> Free (Premium)</span>) : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.coin} width={12} height={12} /> 5 Tickets</span>)}
                    </div>
                    <button onClick={() => { setNameModalOpen(true); setNewDisplayName(''); setNameError(''); setNameSuccess(false) }} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '7px 20px', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: 'pointer', width: '100%', marginTop: 'auto' }}>Change Name</button>
                  </div>

                  {/* Tournament Entry */}
                  <div style={{ background: '#25252C', borderRadius: 10, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div><Icon icon={Solar.ticket} width={28} height={28} /></div>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', textAlign: 'center' }}>Tournament Entry</div>
                    <div style={{ ...R, fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: '14px' }}>Free tournament entry</div>
                    <div style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.35)', borderRadius: 20, padding: '2px 9px', ...R, fontWeight: 700, fontSize: 10, color: '#F39C12' }}>
                      Price varies
                    </div>
                    <Link href="/tournaments" style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '7px 20px', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: 'pointer', width: '100%', marginTop: 'auto', textDecoration: 'none', textAlign: 'center', display: 'block' }}>View Tournaments</Link>
                  </div>

                  {/* 2XP Token */}
                  <div style={{ background: '#25252C', borderRadius: 10, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: isXpBoostActive ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
                    <div><Icon icon={Solar.bolt} width={28} height={28} /></div>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', textAlign: 'center' }}>2XP Token</div>
                    <div style={{ ...R, fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: '14px' }}>2x XP for 24 hours</div>
                    <div style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.35)', borderRadius: 20, padding: '2px 9px', ...R, fontWeight: 700, fontSize: 10, color: '#F39C12' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.coin} width={12} height={12} /> 2 Tickets</span>
                    </div>
                    <div style={{ ...R, fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Owned: {doubleXpTokens}</div>
                    {isXpBoostActive && doubleXpExpiresAt && (
                      <div style={{ ...R, fontSize: 10, color: '#4ade80', fontWeight: 700, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, padding: '4px 10px', textAlign: 'center', width: '100%' }}>
                        ACTIVE — expires {doubleXpExpiresAt.toLocaleString()}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, width: '100%', marginTop: 'auto' }}>
                      <button onClick={handleRedeem2xp} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '7px 0', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: 'pointer', flex: 1 }}>Purchase</button>
                      {doubleXpTokens > 0 && !isXpBoostActive && (
                        <button onClick={handleActivate2xp} style={{ background: '#22c55e', border: 'none', borderRadius: 6, padding: '7px 0', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: 'pointer', flex: 1 }}>Activate</button>
                      )}
                    </div>
                  </div>

                  {/* Username Color */}
                  <div style={{ background: '#25252C', borderRadius: 10, padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div><Icon icon={Solar.palette} width={28} height={28} /></div>
                    <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff', textAlign: 'center' }}>Name Color</div>
                    <div style={{ ...R, fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: '14px' }}>Change your name color</div>
                    <div style={{ background: 'rgba(243,156,18,0.12)', border: '1px solid rgba(243,156,18,0.35)', borderRadius: 20, padding: '2px 9px', ...R, fontWeight: 700, fontSize: 10, color: '#F39C12' }}>
                      {user.isPremium ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.star} width={12} height={12} /> Free (Premium)</span>) : (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.coin} width={12} height={12} /> 1 Credit</span>)}
                    </div>
                  </div>
                </div>

                {xpMsg && <div style={{ ...R, fontSize: 12, color: xpMsg.includes('Purchased') ? '#4ade80' : '#E74C3C', marginBottom: 16 }}>{xpMsg}</div>}

                {/* XP Boost Timer */}
                {(user as any).xpBoostExpiresAt && new Date((user as any).xpBoostExpiresAt) > new Date() && (
                  <div style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Icon icon={Solar.bolt} width={22} height={22} />
                    <div>
                      <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#A855F7' }}>{(user as any).xpBoostMultiplier || 2}x XP Boost Active</div>
                      <XpBoostTimer expiresAt={(user as any).xpBoostExpiresAt} />
                    </div>
                  </div>
                )}

                {/* Username Color Picker (expanded) */}
                <div style={{ marginBottom: 4 }}>
                  <div style={{ ...R, fontWeight: 500, fontSize: 14, color: '#fff', marginBottom: 10 }}>Color Picker</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px 16px', marginBottom: 16 }}>
                    <span style={{ ...R, fontSize: 12, color: '#9CA3AF' }}>Preview:</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: hexColor, letterSpacing: 1 }}>{username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {COLOR_PRESETS.map(c => (
                      <button key={c} onClick={() => setHexColor(c)} style={{ width: 28, height: 28, borderRadius: 6, background: c, border: hexColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s', transform: hexColor === c ? 'scale(1.15)' : 'scale(1)', flexShrink: 0 }} title={c} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 8, background: hexColor, borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
                    <input style={{ ...INPUT, width: 120, fontFamily: 'monospace', letterSpacing: 1 }} value={hexColor} onChange={e => setHexColor(e.target.value)} placeholder="#E74C3C" maxLength={7} />
                    <button onClick={handleColorSave} style={{ background: '#C0392B', border: 'none', borderRadius: 5, padding: '7px 20px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                      {colorSaved ? (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.checkRead} width={14} height={14} /> Applied</span>) : 'Apply Color'}
                    </button>
                  </div>
                  {colorMsg && <div style={{ ...R, fontSize: 12, color: colorMsg.includes('Applied') ? '#4ade80' : '#E74C3C', marginTop: 10 }}>{colorMsg}</div>}
                </div>

                <div style={{ height: 1, background: '#303034', margin: '24px 0' }} />

                {/* Premium Subscription */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ ...R, fontSize: 12, color: '#9CA3AF' }}>
                    {user.isPremium ? 'You have an active Premium subscription.' : 'Unlock all features with Premium.'}
                  </div>
                  <Link href="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#C0392B', border: 'none', borderRadius: 6, padding: '9px 22px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer', textDecoration: 'none' }}>
                    <Icon icon={Solar.star} width={14} height={14} />
                    {user.isPremium ? 'Manage Subscription' : 'Get Premium'}
                  </Link>
                </div>

              </>
            )}

            {/* ════════════════════ LINKED ACCOUNTS ════════════════════ */}
            {activeTab === 'linked' && (
              <>
                <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#fff', marginBottom: 6 }}>Linked Accounts</div>
                <div style={{ ...R, fontSize: 12, color: '#9CA3AF', lineHeight: '14px', marginBottom: 20, maxWidth: 600 }}>
                  Manage your social profiles and gaming platform accounts. Gaming platform IDs are required to participate in XP, wager, and tournament matches.
                </div>

                {/* ── Section A: Social Accounts ── */}
                <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Social Accounts</span>
                  <span style={{ ...R, fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>— Add your social profiles</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {socials.map((s, i) => {
                    const plat = SOCIAL_PLATFORMS.find(p => p.id === s.label)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#303034', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {plat?.icon || <Icon icon={Solar.link} width={16} height={16} />}
                        </div>
                        <select
                          style={{ ...INPUT, width: 120, flexShrink: 0, cursor: 'pointer' }}
                          value={s.label}
                          onChange={e => { const n = [...socials]; n[i] = { ...n[i], label: e.target.value }; setSocials(n) }}
                        >
                          <option value="">Select...</option>
                          {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
                        </select>
                        <input
                          style={{ ...INPUT, flex: 1 }}
                          placeholder={s.label === 'Discord' ? 'username#0000' : 'https://...'}
                          value={s.url}
                          onChange={e => { const n = [...socials]; n[i] = { ...n[i], url: e.target.value }; setSocials(n) }}
                        />
                        <button type="button" onClick={() => setSocials(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#E74C3C', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center' }} title="Remove"><Icon icon={Solar.close} width={16} height={16} /></button>
                      </div>
                    )
                  })}
                </div>

                <button onClick={() => setSocials(prev => [...prev, { label: '', url: '' }])} style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 16px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer', width: '100%', marginBottom: 8 }}>
                  + Add Social
                </button>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
                  {saved && <span style={{ ...R, fontSize: 12, color: '#4ade80', marginRight: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.checkRead} width={14} height={14} /> Saved</span>}
                  <button onClick={handleSaveSocials} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '9px 28px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer' }}>
                    Save Socials
                  </button>
                </div>

                <div style={{ height: 1, background: '#303034', margin: '0 0 24px' }} />

                {/* Link Toast */}
                {linkToast && (
                  <div style={{ background: linkToast.type === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(231,76,60,0.12)', border: `1px solid ${linkToast.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(231,76,60,0.3)'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...R, fontSize: 12, color: linkToast.type === 'success' ? '#4ade80' : '#E74C3C' }}>
                      <Icon icon={linkToast.type === 'success' ? Solar.checkRead : Solar.close} width={14} height={14} /> {linkToast.platform} — {linkToast.message || (linkToast.type === 'success' ? 'Linked successfully!' : 'Failed to link')}
                    </span>
                  </div>
                )}

                {/* ── Section B: Gaming Platforms ── */}
                <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>Gaming Platforms</span>
                  <span style={{ ...R, fontSize: 10, color: '#9CA3AF', fontWeight: 400 }}>— Link via OAuth or enter manually</span>
                </div>
                <div style={{ ...R, fontSize: 11, color: '#6B7280', marginBottom: 16, lineHeight: '14px' }}>
                  Link your gaming accounts to verify ownership. OAuth-linked accounts can be unlinked below.
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {GAMING_PLATFORMS.map(p => {
                    const linked = linkedPlatforms.find((lp: any) => lp.platform === p.id)
                    const isManual = p.type === 'manual'
                    const manualValue = isManual ? (manualInputs[p.fieldKey!] || '') : ''
                    const manualHasValue = isManual && manualValue.trim()

                    return (
                      <div key={p.id} style={{ background: '#303034', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, border: linked || manualHasValue ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ ...R, fontWeight: 600, fontSize: 12, color: '#fff' }}>{p.label}</div>
                          {linked ? (
                            <div style={{ ...R, fontSize: 11, color: '#4ade80', marginTop: 2 }}>{linked.platformUsername}</div>
                          ) : isManual ? (
                            <input
                              style={{ ...INPUT, marginTop: 4, padding: '4px 8px', fontSize: 11 }}
                              placeholder={`Enter ${p.label} ID`}
                              value={manualValue}
                              onChange={e => setManualInputs(prev => ({ ...prev, [p.fieldKey!]: e.target.value }))}
                            />
                          ) : (
                            <div style={{ ...R, fontSize: 11, color: '#6B7280', marginTop: 2 }}>Not Linked</div>
                          )}
                        </div>
                        {linked ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '2px 10px', ...R, fontWeight: 700, fontSize: 10, color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Linked <Icon icon={Solar.checkRead} width={10} height={10} /></span>
                            <button
                              onClick={() => handleUnlink(p.id)}
                              disabled={unlinkingPlatform === p.id}
                              style={{ background: 'none', border: 'none', ...R, fontSize: 9, color: '#E74C3C', cursor: 'pointer', padding: 0, opacity: unlinkingPlatform === p.id ? 0.5 : 1 }}
                            >
                              {unlinkingPlatform === p.id ? 'Unlinking...' : 'Unlink'}
                            </button>
                          </div>
                        ) : isManual ? (
                          <button
                            onClick={() => handleManualSave(p.fieldKey!, p.id)}
                            disabled={manualSaving === p.id}
                            style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '6px 14px', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: 'pointer', opacity: manualSaving === p.id ? 0.5 : 1, flexShrink: 0 }}
                          >
                            {manualSaving === p.id ? '...' : 'Save'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOAuthLink(p.id)}
                            disabled={linkingPlatform === p.id}
                            style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '6px 14px', ...R, fontWeight: 600, fontSize: 11, color: '#fff', cursor: linkingPlatform === p.id ? 'wait' : 'pointer', opacity: linkingPlatform === p.id ? 0.5 : 1, flexShrink: 0 }}
                          >
                            {linkingPlatform === p.id ? 'Redirecting...' : 'Link'}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* ════════════════════ NOTIFICATIONS ════════════════════ */}
            {activeTab === 'notifications' && (
              <>
                <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#fff', marginBottom: 20 }}>Notifications</div>
                {[
                  { key: 'matchAccepted',        label: 'Match Accepted',        desc: 'When another team accepts your match challenge'    },
                  { key: 'matchResult',           label: 'Match Result',           desc: 'When a match you played is finalized'             },
                  { key: 'disputeUpdate',         label: 'Dispute Update',         desc: 'Status changes on your open disputes'             },
                  { key: 'tournamentUpdates',     label: 'Tournament Updates',     desc: 'Registration, bracket updates, and results'        },
                  { key: 'payoutReady',           label: 'Payout Ready',           desc: 'When earnings are available to withdraw'          },
                  { key: 'teamInvites',           label: 'Team Invites',           desc: 'When a team invites you to join'                  },
                  { key: 'friendActivity',        label: 'Friend Activity',        desc: 'When friends go online or start a match'          },
                  { key: 'platformAnnouncements', label: 'Platform Announcements', desc: 'Major platform news and feature releases'         },
                ].map((n, i, arr) => (
                  <div key={n.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <div>
                      <div style={{ ...R, fontWeight: 500, fontSize: 13, color: '#fff' }}>{n.label}</div>
                      <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{n.desc}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                      {['In-App', 'Email'].map(type => {
                        const field = type === 'In-App' ? 'inApp' : 'email'
                        return (
                          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, ...R, fontSize: 11, color: '#9CA3AF', cursor: 'pointer' }}>
                            <input type="checkbox" checked={notifications[n.key]?.[field as 'inApp'|'email'] ?? (type === 'In-App')} onChange={e => setNotifications(prev => ({ ...prev, [n.key]: { ...prev[n.key], [field]: e.target.checked } }))} style={{ accentColor: '#E74C3C' }} />
                            {type}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 24 }}>
                  {saved && <span style={{ ...R, fontSize: 12, color: '#4ade80', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.checkRead} width={14} height={14} /> Saved</span>}
                  <button onClick={handleSaveNotifications} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '9px 28px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer' }}>Save Preferences</button>
                </div>
              </>
            )}

            {/* ════════════════════ SECURITY ════════════════════ */}
            {activeTab === 'security' && (
              <>
                <div style={{ ...R, fontWeight: 500, fontSize: 15, color: '#fff', marginBottom: 20 }}>Change Password</div>
                <div style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={LABEL}>Current Password</label>
                    <input style={INPUT} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div>
                    <label style={LABEL}>New Password</label>
                    <input style={INPUT} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                  </div>
                  <div>
                    <label style={LABEL}>Confirm New Password</label>
                    <input style={INPUT} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  </div>
                  {pwError && <div style={{ ...R, fontSize: 12, color: '#E74C3C' }}>{pwError}</div>}
                  {pwSaved && <div style={{ ...R, fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.checkRead} width={14} height={14} /> Password changed successfully</div>}
                  <button onClick={handleChangePassword} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '9px 28px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: 'pointer', width: 'fit-content' }}>Change Password</button>
                </div>

              </>
            )}

          </div>
        </div>
      </div>

      {/* ══ Delete Account Modal ══ */}
      {deleteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#19191D', borderRadius: 12, padding: '28px 32px', width: 440, border: '1px solid rgba(231,76,60,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(231,76,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon icon="solar:trash-bin-trash-bold-duotone" width={18} height={18} style={{ color: '#E74C3C' }} />
              </div>
              <div style={{ ...R, fontWeight: 600, fontSize: 16, color: '#fff' }}>Delete Account</div>
            </div>
            <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 20, lineHeight: 1.7 }}>
              This will <span style={{ color: '#fff', fontWeight: 600 }}>immediately deactivate your account</span> and sign you out. Your profile, stats, and data will be hidden from everyone.
              <br />
              You can reactivate within <span style={{ color: '#F39C12', fontWeight: 600 }}>30 days</span> by simply logging back in. After 30 days, this action is permanent.
            </div>
            <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
              Type <span style={{ color: '#E74C3C', fontWeight: 700, fontFamily: 'monospace' }}>DELETE</span> to confirm:
            </div>
            <input
              style={{ ...INPUT, marginBottom: 16, letterSpacing: 2 }}
              value={deleteConfirmText}
              onChange={e => { setDeleteConfirmText(e.target.value.toUpperCase()); setDeleteError('') }}
              placeholder="DELETE"
              autoFocus
              disabled={deleteLoading}
            />
            {deleteError && <div style={{ ...R, fontSize: 12, color: '#E74C3C', marginBottom: 12 }}>{deleteError}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                style={{ background: '#303034', border: 'none', borderRadius: 6, padding: '8px 20px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '8px 20px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: deleteConfirmText !== 'DELETE' || deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteConfirmText !== 'DELETE' || deleteLoading ? 0.5 : 1 }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Name Change Modal ══ */}
      {nameModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setNameModalOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#19191D', borderRadius: 12, padding: '28px 32px', width: 420, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ ...R, fontWeight: 600, fontSize: 16, color: '#fff', marginBottom: 6 }}>Change Display Name</div>
            <div style={{ ...R, fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>
              {user.isPremium ? 'Free for Premium members.' : 'This will cost 5 tickets.'}
              {' '}Your current name: <span style={{ color: hexColor, fontWeight: 600 }}>{(user as any).displayName || user.username}</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 4 }}>
              <input
                style={{ ...INPUT, paddingRight: 110 }}
                value={newDisplayName}
                onChange={e => { setNewDisplayName(e.target.value); setNameAvailable(null); setNameError('') }}
                placeholder="Enter new display name"
                maxLength={16}
                autoFocus
              />
              <button
                onClick={handleCheckName}
                disabled={nameChecking || newDisplayName.trim().length < 3}
                style={{
                  position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 4, padding: '4px 10px', ...R, fontWeight: 600, fontSize: 10,
                  color: nameChecking ? '#6B7280' : '#9CA3AF', cursor: nameChecking || newDisplayName.trim().length < 3 ? 'not-allowed' : 'pointer',
                }}
              >
                {nameChecking ? 'Checking...' : 'Check'}
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ ...R, fontSize: 10, color: newDisplayName.trim().length < 3 || newDisplayName.trim().length > 16 ? '#E74C3C' : '#6B7280' }}>
                {newDisplayName.trim().length}/16 characters (min 3)
              </span>
              {nameAvailable === true && <span style={{ ...R, fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Available</span>}
              {nameAvailable === false && <span style={{ ...R, fontSize: 11, color: '#E74C3C', fontWeight: 600 }}>Not Available</span>}
            </div>
            {nameError && <div style={{ ...R, fontSize: 12, color: '#E74C3C', marginBottom: 8 }}>{nameError}</div>}
            {nameSuccess && <div style={{ ...R, fontSize: 12, color: '#4ade80', marginBottom: 8 }}>Name changed successfully!</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setNameModalOpen(false); setNameAvailable(null) }} style={{ background: '#303034', border: 'none', borderRadius: 6, padding: '8px 20px', ...R, fontWeight: 600, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleNameChange} disabled={nameSuccess || newDisplayName.trim().length < 3 || newDisplayName.trim().length > 16} style={{ background: '#C0392B', border: 'none', borderRadius: 6, padding: '8px 20px', ...R, fontWeight: 600, fontSize: 12, color: '#fff', cursor: nameSuccess || newDisplayName.trim().length < 3 || newDisplayName.trim().length > 16 ? 'not-allowed' : 'pointer', opacity: nameSuccess || newDisplayName.trim().length < 3 || newDisplayName.trim().length > 16 ? 0.6 : 1 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
