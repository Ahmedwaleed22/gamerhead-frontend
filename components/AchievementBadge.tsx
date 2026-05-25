import React, { useState } from 'react'
import type { AchievementBadge } from '@/types/Badges.type'
import { RARITY_SHADOW_CLASSES, type BadgeRarity } from '@/types/Badges.type'

function AchievementBadge({ badge }: { badge: AchievementBadge }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [visible, setVisible] = useState(false)

  return (
    <div
      className="relative w-full"
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <img
        className={`mx-auto block w-52 h-52 object-cover ${RARITY_SHADOW_CLASSES[badge.rarity as BadgeRarity]}`}
        src={badge.img}
        alt={badge.name}
      />
      {visible && (
        <div
          className="fixed z-50 pointer-events-none w-52 bg-(--bg-2) rounded-lg !p-1 border border-(--border) shadow-lg text-center text-sm"
          style={{ left: pos.x + 14, top: pos.y + 14 }}
        >
          {badge.desc}
        </div>
      )}
    </div>
  )
}

export default AchievementBadge