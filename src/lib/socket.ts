import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_BASE, API_KEY } from './api'

export interface GameEvents {
  onVideoAdded?: () => void
  onVideoDeleted?: () => void
}

/**
 * Connects to the NestJS socket.io gateway and exposes the live user count.
 * Mirrors the original SignalR hub events (Join, VideoAdded, VideoDeleted,
 * CountUsers).
 */
export function useGameSocket(events: GameEvents = {}): { usersOnline: number } {
  const [usersOnline, setUsersOnline] = useState(0)
  const eventsRef = useRef(events)
  eventsRef.current = events

  useEffect(() => {
    const socket: Socket = io(API_BASE, {
      auth: API_KEY ? { apiKey: API_KEY } : undefined,
      transports: ['websocket'],
    })

    socket.on('connect', () => socket.emit('BroadcastMessage'))
    socket.on('CountUsers', (count: number) => setUsersOnline(count))
    socket.on('VideoAdded', () => eventsRef.current.onVideoAdded?.())
    socket.on('VideoDeleted', () => eventsRef.current.onVideoDeleted?.())

    return () => {
      socket.disconnect()
    }
  }, [])

  return { usersOnline }
}
