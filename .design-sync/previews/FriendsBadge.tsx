import { FriendsBadge } from 'frontend'

export function Milestones() {
  const levels = [1, 5, 15, 30, 50, 100] as const
  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: 24,
        background: '#0d121b',
      }}
    >
      {levels.map((l) => (
        <FriendsBadge key={l} level={l} size={88} />
      ))}
    </div>
  )
}

export function Legendary() {
  return (
    <div style={{ padding: 28, background: '#0d121b', display: 'flex', justifyContent: 'center' }}>
      <FriendsBadge level={100} size={140} />
    </div>
  )
}
