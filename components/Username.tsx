import { AuthUser } from '@/lib/auth-context'
import React from 'react'
import AchievementBadge from './AchievementBadge'
import { PostUser } from '@/app/forum/board/[slug]/[threadId]/page'

function Username({ user }: { user: AuthUser | PostUser }) {  
  const rarityRank: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Common: 3 }
  const displayBadges = (user as AuthUser).badges
    .filter((badge: AchievementBadge, index: number, self: AchievementBadge[]) => index === self.findIndex((t: AchievementBadge) => t._id === badge._id))
    .sort((a, b) => {
      const rarityDiff = (rarityRank[a.rarity] ?? 99) - (rarityRank[b.rarity] ?? 99)
      if (rarityDiff !== 0) return rarityDiff
      return new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    })
    .slice(0, 3)

  console.log(displayBadges, user.badges)

  return (
    <div className="inline-flex items-center gap-2">
      {(user as AuthUser).username || (user as PostUser).name}
      <div className="flex gap-2">
        {displayBadges.map((badge) => (
          <AchievementBadge key={badge._id} badge={badge} className={{ container: 'w-8 h-8', image: 'w-8 h-8', tooltip: 'text-xs' }} />
        ))}
      </div>
    </div>
  )
}

export default Username