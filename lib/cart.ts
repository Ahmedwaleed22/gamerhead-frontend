// ─── Shared cart store (server-backed for signed-in users) ────────────────────
//
// The Store page owns the rich cart UI, but the cart itself lives here so any
// component (header badge, checkout) can read it and stay in sync.
//
// • localStorage is the instant cache and the *guest* cart (logged-out users).
// • For signed-in users the server is the source of truth: every mutation is
//   pushed to `/api/cart`, and the user's OTHER devices receive it live over
//   Reverb (see initCartSync). On login, the local guest cart is merged up.
//
// Public API (loadCart / saveCart / subscribeCart / cartCount) is unchanged, so
// existing callers keep working — they just gain cross-device sync for free.

import { cartApi } from './api'
import { listenPrivate, socketId } from './echo'

export interface StoredCartItem {
  id: string
  name: string
  price: number        // USD (e.g. 4.99)
  image?: string
  category?: string
  badge?: string
  qty: number
}

const KEY = 'gh:cart'
const EVENT = 'gh:cart-changed'

// ── Local cache (also the guest cart) ─────────────────────────────────────────
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

/** Write local cache + notify same-tab and cross-tab listeners. No server push. */
function writeLocal(cart: StoredCartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {
    /* storage may be unavailable (private mode / quota) — ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT))
}

/**
 * Persist a cart change originating from THIS device: updates the local cache
 * immediately (optimistic) and, when signed in, pushes it to the server. The
 * canonical write path used by the Store page, checkout and the header.
 */
export function saveCart(cart: StoredCartItem[]): void {
  writeLocal(cart)
  if (isSignedIn()) schedulePush(cart)
}

export function cartCount(cart?: StoredCartItem[]): number {
  return (cart ?? loadCart()).reduce((sum, i) => sum + (i.qty || 0), 0)
}

/** Subscribe to cart changes (same tab + cross tab + live server pushes). */
export function subscribeCart(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e?: Event) => {
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

// ── Server sync ───────────────────────────────────────────────────────────────
// Auth is an HttpOnly cookie (unreadable by JS), so sign-in is tracked via the
// cart lifecycle: initCartSync() flips this on when the user is known, and
// clearLocalCart() flips it off on sign-out.
let signedIn = false
const isSignedIn = () => signedIn
const toLines = (cart: StoredCartItem[]) => cart.map(i => ({ id: i.id, qty: i.qty }))

let pushTimer: ReturnType<typeof setTimeout> | null = null
let lastPushedJson: string | null = null   // fallback guard against our own echo
let mergedForUser: string | null = null     // guest→server merge happens once per login

/** Debounced push of the local cart to the server (coalesces rapid +/- clicks). */
function schedulePush(cart: StoredCartItem[]): void {
  const lines = toLines(cart)
  const json = JSON.stringify(lines)
  if (pushTimer) clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    lastPushedJson = json
    cartApi.put(lines, socketId())
      .then((server: StoredCartItem[]) => {
        // Reconcile with the authoritative server cart (drops inactive items,
        // corrects prices) — but only if the user hasn't edited again since.
        if (JSON.stringify(toLines(loadCart())) === json) writeLocal(server)
      })
      .catch(() => { /* keep local; the next change retries */ })
  }, 350)
}

/**
 * Bring the cart in sync with the server for a signed-in user, and subscribe to
 * live updates from their other devices. Call when the user becomes known.
 * Returns a cleanup that unsubscribes. Safe to call twice (StrictMode).
 */
export function initCartSync(userId: string): () => void {
  let cancelled = false
  signedIn = true

  // First sync after login merges the local guest cart up; later syncs just read.
  const initial = mergedForUser === userId
    ? cartApi.get()
    : cartApi.merge(toLines(loadCart()), socketId())
  mergedForUser = userId

  initial
    .then((items: StoredCartItem[]) => { if (!cancelled) writeLocal(items) })
    .catch(() => { /* offline — keep the local cache */ })

  // Live push from the user's other browsers/devices.
  const off = listenPrivate(`cart.${userId}`, '.cart.updated', (payload: { items?: StoredCartItem[] }) => {
    if (cancelled) return
    const items = payload?.items ?? []
    // Ignore an echo of our own write (belt-and-suspenders alongside ->toOthers()).
    if (JSON.stringify(toLines(items)) === lastPushedJson) return
    writeLocal(items)
  })

  return () => { cancelled = true; off() }
}

/** Called on sign-out: the cart belongs to the account, so clear this device. */
export function clearLocalCart(): void {
  signedIn = false
  mergedForUser = null
  writeLocal([])
}
