'use client'

import type { CSSProperties } from 'react'

/** Filled trophy silhouette — same asset as tournament detail (`/tournaments/[id]`). */
export function TrophyIcon({ place, size = 22 }: { place: string; size?: number }) {
  const color =
    place.includes('1st') ? '#f0c040' :
    place.includes('2nd') ? '#c0c0c0' :
    place.includes('3rd') ? '#cd7f32' : '#5A9FD4'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden>
      <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill={color}/>
      <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill={color}/>
      <rect x="10" y="14" width="4" height="4" fill={color}/>
      <rect x="7" y="18" width="10" height="3" rx="1" fill={color}/>
    </svg>
  )
}

export function SimpleTrophyIcon({
  size = 22,
  color = 'currentColor',
  className,
  style,
}: {
  size?: number
  color?: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ flexShrink: 0, color, ...style }}
      aria-hidden
    >
      <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill="currentColor"/>
      <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill="currentColor"/>
      <rect x="10" y="14" width="4" height="4" fill="currentColor"/>
      <rect x="7" y="18" width="10" height="3" rx="1" fill="currentColor"/>
    </svg>
  )
}
