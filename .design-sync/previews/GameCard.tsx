import { GameCard } from 'frontend'

export function Default() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 150px)',
        gap: 14,
        padding: 24,
        background: '#0d121b',
      }}
    >
      <GameCard game={{ slug: 'warzone', name: 'Call of Duty: Warzone', genre: 'FPS', activeLadders: 12, platformType: 'crossplay' }} />
      <GameCard game={{ slug: 'fortnite', name: 'Fortnite', genre: 'Battle Royale', activeLadders: 8, platformType: 'crossplay' }} />
      <GameCard game={{ slug: 'fc26', name: 'EA Sports FC 26', genre: 'Sports', activeLadders: 5, platformType: 'console' }} />
    </div>
  )
}

export function Platforms() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 150px)',
        gap: 14,
        padding: 24,
        background: '#0d121b',
      }}
    >
      <GameCard game={{ slug: 'valorant', name: 'Valorant', genre: 'Tactical', activeLadders: 9, platformType: 'pc' }} />
      <GameCard game={{ slug: 'rocket-league', name: 'Rocket League', genre: 'Sports', activeLadders: 7, platformType: 'crossplay' }} />
      <GameCard game={{ slug: 'nba2k', name: 'NBA 2K25', genre: 'Sports', activeLadders: 4, platformType: 'console' }} />
    </div>
  )
}
