import { SimpleTrophyIcon, TrophyIcon } from 'frontend'

export function Sizes() {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 28, color: '#e8000d' }}>
      <SimpleTrophyIcon size={24} />
      <SimpleTrophyIcon size={40} />
      <SimpleTrophyIcon size={64} />
    </div>
  )
}

export function Podium() {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', padding: 28, background: '#0d121b' }}>
      <TrophyIcon place="1st" size={56} />
      <TrophyIcon place="2nd" size={44} />
      <TrophyIcon place="3rd" size={36} />
    </div>
  )
}
