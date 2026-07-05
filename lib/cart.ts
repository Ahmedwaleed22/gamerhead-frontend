// ─── Lightweight shared cart store ───────────────────────────────────────────
// The Store page owns the rich cart UI, but the cart itself lives here so any
// component (e.g. the header cart badge) can read the count and stay in sync.
// Persisted to localStorage and broadcast via a custom event + the native
// `storage` event (cross-tab).

export interface StoredCartItem {
  id: string
  name: string
  price: number        // USD (e.g. 4.99)
  image?: string
  category?: string
  qty: number
}

const KEY = 'gh:cart'
const EVENT = 'gh:cart-changed'

export function loadCart(): StoredCartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCart(cart: StoredCartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {
    /* storage may be unavailable (private mode / quota) — ignore */
  }
  // Notify same-tab listeners (the native `storage` event only fires in *other* tabs).
  window.dispatchEvent(new CustomEvent(EVENT))
}

export function cartCount(cart?: StoredCartItem[]): number {
  return (cart ?? loadCart()).reduce((sum, i) => sum + (i.qty || 0), 0)
}

/** Subscribe to cart changes (same tab + cross tab). Returns an unsubscribe fn. */
export function subscribeCart(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e?: Event) => {
    // For cross-tab `storage` events, only react to our key.
    if (e && e.type === 'storage' && (e as StorageEvent).key !== KEY) return
    cb()
  }
  window.addEventListener(EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
