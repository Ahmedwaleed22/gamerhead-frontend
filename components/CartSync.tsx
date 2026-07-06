'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { initCartSync, clearLocalCart } from '@/lib/cart'

/**
 * Bridges auth state to the server-backed cart. When a user is signed in it
 * syncs their cart from the server (merging any local guest cart on first login)
 * and subscribes to live updates from their other devices; on sign-out it clears
 * this device's cart. Renders nothing.
 */
export default function CartSync() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const prevUserId = useRef<string | null>(null)

  useEffect(() => {
    if (userId) {
      prevUserId.current = userId
      return initCartSync(userId)
    }
    // No user. Only treat this as a sign-out (and clear the cart) if we were
    // previously signed in — a first-load guest keeps their local cart.
    if (prevUserId.current) {
      clearLocalCart()
      prevUserId.current = null
    }
  }, [userId])

  return null
}
