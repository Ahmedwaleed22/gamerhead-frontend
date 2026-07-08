// Laravel Echo + Reverb (Pusher protocol) client.
//
// Replaces the old socket.io gateway. Private channels are authorized against
// the Laravel backend's POST /broadcasting/auth using the Sanctum SPA session
// cookie (credentials: 'include') plus the CSRF token.
//
// Required env (frontend):
//   NEXT_PUBLIC_API_URL          → Laravel API base, e.g. http://localhost:8000/api
//   NEXT_PUBLIC_REVERB_APP_KEY   → = backend REVERB_APP_KEY
//   NEXT_PUBLIC_REVERB_HOST      → backend REVERB_HOST   (default localhost)
//   NEXT_PUBLIC_REVERB_PORT      → backend REVERB_PORT   (default 8080)
//   NEXT_PUBLIC_REVERB_SCHEME    → backend REVERB_SCHEME (default http)

import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echo: any = null

/** Strip a trailing `/api` so we can reach the root-level /broadcasting/auth. */
function backendOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  return base.replace(/\/api\/?$/, '')
}

/** The Sanctum CSRF token from the XSRF-TOKEN cookie, echoed as X-XSRF-TOKEN. */
function readXsrfCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

/** Lazily create (client-side only) and return the shared Echo instance. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEcho(): any {
  if (typeof window === 'undefined') return null
  if (echo) return echo

  // pusher-js must be on window for the reverb broadcaster.
  ;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

  const origin = backendOrigin()
  const port = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080)

  // Cast to `any`: laravel-echo v2 is heavily generic over the broadcaster and a
  // custom authorizer doesn't line up cleanly with its option types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echo = new (Echo as any)({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
    wsPort: port,
    wssPort: port,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    // Custom authorizer so we send the *current* bearer token to /broadcasting/auth.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: (err: unknown, data: unknown) => void) => {
        // Channel auth rides the session cookie (credentials: 'include') + CSRF.
        const xsrf = readXsrfCookie()
        fetch(`${origin}/broadcasting/auth`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
          },
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then(res => (res.ok ? res.json() : Promise.reject(res)))
          .then(data => callback(null, data))
          .catch(err => callback(err, null))
      },
    }),
  })

  return echo
}

/** Subscribe to a private channel event; returns an unsubscribe cleanup. */
export function listenPrivate(
  channel: string,
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (payload: any) => void,
): () => void {
  const e = getEcho()
  if (!e) return () => {}
  e.private(channel).listen(event, handler)

  return () => {
    try {
      e.leave(channel)
    } catch {
      /* noop */
    }
  }
}

/**
 * The current Reverb/Pusher socket id, or null if not connected yet.
 * Sent as `X-Socket-ID` on cart writes so the backend can broadcast the change
 * to the user's *other* devices without echoing it back to this one.
 */
export function socketId(): string | null {
  try {
    return getEcho()?.socketId() ?? null
  } catch {
    return null
  }
}

export function disconnectEcho(): void {
  try {
    echo?.disconnect()
  } catch {
    /* noop */
  }
  echo = null
}
