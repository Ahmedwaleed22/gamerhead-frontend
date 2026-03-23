'use client'

import { Icon } from '@iconify/react'
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
  sword: 'solar:sword-bold-duotone',
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
  megaphone: 'solar:megaphone-bold-duotone',
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
  '✨': Solar.sparkles,
  '📬': Solar.letter,
  '📈': Solar.chart,
  '📦': Solar.package,
  '↩️': Solar.reply,
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
  const icon = resolveSolarForEmoji(emoji)
  if (icon) {
    return (
      <Icon
        icon={icon}
        width={size}
        height={size}
        className={className}
        style={{ display: inline ? 'inline-block' : 'block', verticalAlign: inline ? 'middle' : undefined, ...style }}
      />
    )
  }
  return (
    <span style={{ fontSize: size, ...style }} className={className}>
      {emoji}
    </span>
  )
}

export function CloseBtnIcon({ size = 14 }: { size?: number }) {
  return <Icon icon={Solar.close} width={size} height={size} style={{ display: 'block' }} />
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return <Icon icon={Solar.checkRead} width={size} height={size} style={{ display: 'block' }} />
}
