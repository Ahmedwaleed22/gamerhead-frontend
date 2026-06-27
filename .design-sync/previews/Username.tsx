import { Username } from 'frontend'

// Username renders the display name plus up to three rarity-sorted achievement
// badges. Badge art is loaded from remote URLs, so these previews use players
// with no badges to keep the focus on the name treatment.
export function Players() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 24,
        background: '#0d121b',
        color: '#fff',
        fontFamily: "'Barlow', sans-serif",
        fontWeight: 700,
        fontSize: 18,
      }}
    >
      <Username user={{ username: 'xQc', badges: [] } as never} />
      <Username user={{ username: 'Shroud', badges: [] } as never} />
      <Username user={{ username: 'Ninja', badges: [] } as never} />
    </div>
  )
}
