import { io, Socket } from 'socket.io-client'

const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function sendHeartbeat(status: 'online' | 'idle', activity?: string) {
  if (!socket?.connected) return
  socket.emit('heartbeat', { status, activity })
}

export function sendActivity(text: string) {
  if (!socket?.connected) return
  socket.emit('activity', { text })
}
