import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import type { AchievementBadge } from '@/types/Badges.type'
import { RARITY_SHADOW_CLASSES, type BadgeRarity } from '@/types/Badges.type'
import { cn } from '@/lib/utils'

type classNameType = {
  container?: string
  image?: string
  tooltip?: string
}

function AchievementBadge({ badge, className }: { badge: AchievementBadge, className?: classNameType }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  return (
    <div
      className={cn('relative w-full', className?.container)}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <img
        className={cn('mx-auto block w-52 h-52 object-cover', RARITY_SHADOW_CLASSES[badge.rarity as BadgeRarity], className?.image)}
        src={badge.img}
        alt={badge.name}
      />
      {visible && createPortal(
        <div
          className={cn('fixed z-50 pointer-events-none w-52 bg-(--bg-2) rounded-lg !p-1 border border-(--border) shadow-lg text-center text-sm', className?.tooltip)}
          style={{ left: pos.x + 14, top: pos.y + 14 }}
        >
          {badge.desc}
        </div>,
        document.body
      )}
    </div>
  )
}

export default AchievementBadge