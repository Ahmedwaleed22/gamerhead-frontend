// ── Legacy socket.io shim ──────────────────────────────────────────────────
//
// The old NestJS backend exposed a socket.io gateway (presence heartbeats,
// activity pings, and a `notification` push). The Laravel backend does not — it
// uses Reverb for the two chat channels (see lib/echo.ts) and REST for the rest.
//
// These functions are kept as no-ops so existing imports keep compiling while we
// no longer dial a dead socket.io server. Real-time chat lives in lib/echo.ts.

type SocketStub = {
  on: (event: string, handler: (...args: unknown[]) => void) => void
  off: (event: string, handler?: (...args: unknown[]) => void) => void
  disconnect: () => void
  connected: boolean
}

const stub: SocketStub = {
  on: () => {},
  off: () => {},
  disconnect: () => {},
  connected: false,
}

export function getSocket(): SocketStub | null {
  return null
}

export function connectSocket(_token: string): SocketStub {
  return stub
}

export function disconnectSocket(): void {
  /* no-op — no socket.io server on the Laravel backend */
}

export function sendHeartbeat(_status: 'online' | 'idle', _activity?: string): void {
  /* no-op — presence isn't part of the Laravel backend */
}

export function sendActivity(_text: string): void {
  /* no-op — activity tracking isn't part of the Laravel backend */
}
