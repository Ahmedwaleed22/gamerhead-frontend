export interface RepTier {
  label: string
  color: string
  gradient: string
}

const REP_TIERS: { min: number; label: string; color: string; gradient: string }[] = [
  { min: 500, label: 'Diamond',  color: '#b9f2ff', gradient: 'linear-gradient(90deg, #b9f2ff, #e0c3fc, #b9f2ff)' },
  { min: 450, label: 'Gold',     color: '#ffd700', gradient: 'linear-gradient(90deg, #ffd700, #ffec80)' },
  { min: 400, label: 'Pink',     color: '#ff69b4', gradient: 'linear-gradient(90deg, #ff69b4, #ffb6c1)' },
  { min: 350, label: 'Purple',   color: '#9b59b6', gradient: 'linear-gradient(90deg, #9b59b6, #c39bd3)' },
  { min: 300, label: 'Indigo',   color: '#6366f1', gradient: 'linear-gradient(90deg, #6366f1, #a5b4fc)' },
  { min: 250, label: 'Blue',     color: '#3b82f6', gradient: 'linear-gradient(90deg, #3b82f6, #93c5fd)' },
  { min: 200, label: 'Teal',     color: '#14b8a6', gradient: 'linear-gradient(90deg, #14b8a6, #5eead4)' },
  { min: 150, label: 'Green',    color: '#22c55e', gradient: 'linear-gradient(90deg, #22c55e, #86efac)' },
  { min: 100, label: 'Yellow',   color: '#eab308', gradient: 'linear-gradient(90deg, #eab308, #fde047)' },
  { min: 50,  label: 'Orange',   color: '#f97316', gradient: 'linear-gradient(90deg, #f97316, #fdba74)' },
  { min: 0,   label: 'Red',      color: '#ef4444', gradient: 'linear-gradient(90deg, #ef4444, #fca5a5)' },
]

export function getRepTier(rep: number): RepTier {
  for (const tier of REP_TIERS) {
    if (rep >= tier.min) return { label: tier.label, color: tier.color, gradient: tier.gradient }
  }
  return REP_TIERS[REP_TIERS.length - 1]
}

export function getRepColor(rep: number): string {
  return getRepTier(rep).color
}

export function getRepGradient(rep: number): string {
  return getRepTier(rep).gradient
}

export function getRepLabel(rep: number): string {
  return getRepTier(rep).label
}
