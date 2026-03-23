'use client'

import { Icon } from '@iconify/react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

/** Solar Bold Duotone — matches existing landing page / leaderboard usage */
export const Solar = {
  close: 'solar:close-circle-bold-duotone',
  chat: 'solar:chat-round-dots-bold-duotone',
  lock: 'solar:lock-password-bold-duotone',
  check: 'solar:check-circle-bold-duotone',
  warning: 'solar:danger-triangle-bold-duotone',
  bill: 'solar:banknote-2-bold-duotone',
  hourglass: 'solar:hourglass-bold-duotone',
  coin: 'solar:coins-bold-duotone',
  moneySend: 'solar:card-send-bold-duotone',
  trophy: 'solar:cup-star-bold-duotone',
  target: 'solar:target-bold-duotone',
  tickets: 'solar:ticket-bold-duotone',
  live: 'solar:record-circle-bold-duotone',
  checkRead: 'solar:check-read-bold-duotone',
  medal: 'solar:medal-ribbon-star-bold-duotone',
  skull: 'solar:skull-bold-duotone',
  sword: 'ph:sword-thin',
  document: 'solar:document-text-bold-duotone',
  users: 'solar:users-group-rounded-bold-duotone',
  clipboard: 'solar:clipboard-list-bold-duotone',
  calendar: 'solar:calendar-bold-duotone',
  user: 'solar:user-bold-duotone',
  bolt: 'solar:bolt-bold-duotone',
  handshake: 'solar:hand-shake-bold-duotone',
  tools: 'solar:tools-bold-duotone',
  shield: 'solar:shield-bold-duotone',
  ticket: 'solar:ticket-bold-duotone',
  map: 'solar:map-bold-duotone',
  pin: 'solar:pin-bold-duotone',
  gallery: 'solar:gallery-bold-duotone',
  camera: 'solar:camera-bold-duotone',
  palette: 'solar:pallete-2-bold-duotone',
  link: 'solar:link-bold-duotone',
  tv: 'solar:tv-bold-duotone',
  youtube: 'solar:play-circle-bold-duotone',
  gamepad: 'solar:gamepad-bold-duotone',
  star: 'solar:star-bold-duotone',
  rules: 'solar:document-text-bold-duotone',
  megaphone: 'solar:speaker-bold-duotone',
  megaphone2: 'solar:megaphone-2-bold-duotone',
  megaphone3: 'solar:megaphone-3-bold-duotone',
  loudspeaker: 'solar:loudspeaker-bold-duotone',
  announcement: 'solar:announcement-bold-duotone',
  microphone: 'solar:microphone-3-bold-duotone',
  question: 'solar:question-circle-bold-duotone',
  pen: 'solar:pen-new-square-bold-duotone',
  forbidden: 'solar:forbidden-circle-bold-duotone',
  xCircle: 'solar:close-circle-bold-duotone',
  info: 'solar:info-circle-bold-duotone',
  package: 'solar:box-minimalistic-bold-duotone',
  diploma: 'solar:diploma-bold-duotone',
  upload: 'solar:upload-minimalistic-bold-duotone',
  sparkles: 'solar:stars-minimalistic-bold-duotone',
  crown: 'solar:crown-bold-duotone',
  fire: 'solar:fire-bold-duotone',
  globe: 'solar:global-bold-duotone',
  chart: 'solar:chart-2-bold-duotone',
  building: 'solar:buildings-2-bold-duotone',
  letter: 'solar:letter-bold-duotone',
  magnifier: 'solar:magnifer-bold-duotone',
  trash: 'solar:trash-bin-minimalistic-bold-duotone',
  bell: 'solar:bell-bold-duotone',
  bookmark: 'solar:bookmark-bold-duotone',
  plain: 'solar:plain-bold-duotone',
  heart: 'solar:heart-bold-duotone',
  /** same ribbon; tint via style color for silver/bronze rows */
  medalRibbon: 'solar:medal-ribbon-star-bold-duotone',
  /** Green “online / open” dot — same glyph as 🔴 live indicator, tint green in UI */
  online: 'solar:record-circle-bold-duotone',
  eye: 'solar:eye-bold-duotone',
  clapperboard: 'solar:clapperboard-bold-duotone',
  book: 'solar:book-bold-duotone',
  lamp: 'solar:lamp-bold-duotone',
  bug: 'solar:bug-bold-duotone',
  like: 'solar:like-bold-duotone',
  dislike: 'solar:dislike-bold-duotone',
  flag: 'solar:flag-bold-duotone',
  reply: 'solar:reply-bold-duotone',
  cart: 'solar:cart-large-bold-duotone',
} as const

/** Map API / UI emoji strings to Solar duotone icon names; unmapped falls back to inline text */
const EMOJI_TO_SOLAR: Record<string, string> = {
  '🎮': Solar.gamepad,
  '🎯': Solar.target,
  '🏆': Solar.trophy,
  '💰': Solar.tickets,
  '👤': Solar.user,
  '⚡': Solar.bolt,
  '🤝': Solar.handshake,
  '🎫': Solar.ticket,
  '🗺️': Solar.map,
  '🛡️': Solar.shield,
  '🔧': Solar.tools,
  '💬': Solar.chat,
  '✅': Solar.check,
  '⚠️': Solar.warning,
  '💵': Solar.bill,
  '🪙': Solar.coin,
  '💸': Solar.moneySend,
  '🔒': Solar.lock,
  '🏅': Solar.medal,
  '💀': Solar.skull,
  '⚔️': Solar.sword,
  '📋': Solar.clipboard,
  '👥': Solar.users,
  '📜': Solar.rules,
  '📅': Solar.calendar,
  '🔴': Solar.live,
  '🟢': Solar.online,
  '📷': Solar.camera,
  '🖼': Solar.gallery,
  '🎨': Solar.palette,
  '🔗': Solar.link,
  '📺': Solar.tv,
  '📌': Solar.pin,
  '⏳': Solar.hourglass,
  '📢': Solar.megaphone,
  '✓': Solar.checkRead,
  '✕': Solar.close,
  '❌': Solar.xCircle,
  '❓': Solar.question,
  '⭐': Solar.star,
  '🚫': Solar.forbidden,
  '✏️': Solar.pen,
  'ℹ️': Solar.info,
  '👑': Solar.crown,
  '🔥': Solar.fire,
  '🌍': Solar.globe,
  '🏙️': Solar.building,
  '📊': Solar.chart,
  '🔍': Solar.magnifier,
  '🗑': Solar.trash,
  '🔔': Solar.bell,
  '🔖': Solar.bookmark,
  '✈️': Solar.plain,
  '✉️': Solar.letter,
  '🥈': Solar.medalRibbon,
  '🥉': Solar.medalRibbon,
  '🎖️': Solar.medal,
  /** Megaphone (Unicode “cheering megaphone”) — forum seeds & announcements */
  '📣': Solar.megaphone,
  '🔫': Solar.target,
  '🕹️': Solar.gamepad,
  '🎬': Solar.clapperboard,
  '📚': Solar.book,
  '🏛️': Solar.building,
  '🎲': Solar.sparkles,
  '💡': Solar.lamp,
  '🐛': Solar.bug,
  '🛠️': Solar.tools,
  '👍': Solar.like,
  '👎': Solar.dislike,
  '❤️': Solar.heart,
  '💯': Solar.star,
  '😂': Solar.sparkles,
  '😐': Solar.question,
  '🚩': Solar.flag,
  '📹': Solar.clapperboard,
  '🎙️': Solar.microphone,
  '⚙️': Solar.tools,
  '💻': Solar.document,
  '📡': Solar.megaphone,
  '⌨️': Solar.tools,
  '🏗️': Solar.building,
  '🚀': Solar.plain,
  '✍️': Solar.pen,
  '⚖️': Solar.rules,
  '🧑‍💻': Solar.user,
  '✨': Solar.sparkles,
  '📬': Solar.letter,
  '📈': Solar.chart,
  '📦': Solar.package,
  '↩️': Solar.reply,
}

/** When Iconify fails to draw an SVG for a resolved Solar icon, we try another duotone icon. */
const EMOJI_SOLAR_FALLBACK_ICONS: Record<string, string[]> = {
  // “Official announcements” often comes from 📢/📣 but some Solar ids may not exist.
  // Use other Solar “megaphone/announcement” style duotone icons first.
  '📢': [Solar.megaphone2, Solar.loudspeaker, Solar.announcement, Solar.megaphone3, Solar.megaphone],
  '📣': [Solar.megaphone2, Solar.loudspeaker, Solar.announcement, Solar.megaphone3, Solar.megaphone],
}

function getFallbackIconChain(emoji: string, resolvedIcon: string): string[] {
  const trimmed = emoji.trim()
  const noVs = trimmed.replace(/\uFE0F/g, '')
  const withVs = noVs + '\uFE0F'

  const chain = new Set<string>()
  chain.add(resolvedIcon)

  const list =
    EMOJI_SOLAR_FALLBACK_ICONS[trimmed] ||
    EMOJI_SOLAR_FALLBACK_ICONS[noVs] ||
    EMOJI_SOLAR_FALLBACK_ICONS[withVs]

  if (list) list.forEach(i => chain.add(i))
  return Array.from(chain)
}

function resolveSolarForEmoji(emoji: string): string | undefined {
  if (!emoji) return undefined
  const trimmed = emoji.trim()
  const direct = EMOJI_TO_SOLAR[trimmed]
  if (direct) return direct
  const noVs = trimmed.replace(/\uFE0F/g, '')
  if (noVs !== trimmed && EMOJI_TO_SOLAR[noVs]) return EMOJI_TO_SOLAR[noVs]
  const withVs = noVs + '\uFE0F'
  if (EMOJI_TO_SOLAR[withVs]) return EMOJI_TO_SOLAR[withVs]
  return undefined
}

export function EmojiSolar({
  emoji,
  size = 16,
  className,
  style,
  inline = true,
}: {
  emoji: string
  size?: number
  className?: string
  style?: CSSProperties
  /** vertical-align for inline rows */
  inline?: boolean
}) {
  const resolvedIcon = resolveSolarForEmoji(emoji)
  if (!resolvedIcon) {
    return (
      <span style={{ fontSize: size, ...style }} className={className}>
        {emoji}
      </span>
    )
  }

  const iconChain = getFallbackIconChain(emoji, resolvedIcon)
  const wrapRef = useRef<HTMLSpanElement | null>(null)
  const [chainIndex, setChainIndex] = useState(0)
  const [giveUp, setGiveUp] = useState(false)

  useEffect(() => {
    setChainIndex(0)
    setGiveUp(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emoji, size])

  useEffect(() => {
    if (giveUp) return

    const icon = iconChain[chainIndex]
    if (!icon) return

    let cancelled = false
    const startedAt = Date.now()
    const maxWaitMs = 4500
    const intervalMs = 150

    const tick = () => {
      if (cancelled) return

      const hasSvg = !!wrapRef.current?.querySelector('svg')
      if (hasSvg) return

      if (Date.now() - startedAt >= maxWaitMs) {
        const next = chainIndex + 1
        if (next < iconChain.length) setChainIndex(next)
        else setGiveUp(true)
        return
      }

      setTimeout(tick, intervalMs)
    }

    tick()
    return () => {
      cancelled = true
    }
  }, [chainIndex, iconChain, giveUp])

  if (giveUp) {
    return (
      <span style={{ fontSize: size, ...style }} className={className}>
        {emoji}
      </span>
    )
  }

  const icon = iconChain[chainIndex] || resolvedIcon
  return (
    <span
      ref={wrapRef}
      style={{
        display: inline ? 'inline-block' : 'block',
        position: 'relative',
        verticalAlign: inline ? 'middle' : undefined,
      }}
    >
      <Icon
        icon={icon}
        width={size}
        height={size}
        className={className}
        style={{ display: inline ? 'inline-block' : 'block', verticalAlign: inline ? 'middle' : undefined, ...style }}
      />
    </span>
  )
}

export function CloseBtnIcon({ size = 14 }: { size?: number }) {
  return <Icon icon={Solar.close} width={size} height={size} style={{ display: 'block' }} />
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return <Icon icon={Solar.checkRead} width={size} height={size} style={{ display: 'block' }} />
}
