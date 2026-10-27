import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, API_KEY } from './api';

export interface GameEvents {
  onVideoAdded?: () => void;
  onVideoDeleted?: () => void;
}

interface ConnectionState {
  usersOnline: number;
  status: 'connecting' | 'connected' | 'disconnected';
  error: string | null;
}

export function useGameSocket(events: GameEvents): ConnectionState {
  const [connection, setConnection] = useState<ConnectionState>({
    usersOnline: 0,
    status: 'connecting',
    error: null,
  });
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    // Defer the initial connection to avoid unnecessary work during StrictMode's probe mount.
    const socket = io(API_BASE, {
      auth: { apiKey: API_KEY },
      transports: ['websocket'],
      autoConnect: false,
      reconnectionAttempts: 3,
      timeout: 5_000,
    });
    socket.on('connect', () => {
      setConnection({ usersOnline: 0, status: 'connected', error: null });
      socket.emit('BroadcastMessage');
    });
    socket.on('CountUsers', (count: unknown) => {
      if (typeof count === 'number' && Number.isInteger(count) && count >= 0) {
        setConnection((current) => ({ ...current, usersOnline: count }));
      }
    });
    socket.on('disconnect', () => {
      setConnection({
        usersOnline: 0,
        status: 'disconnected',
        error: 'Live updates disconnected. Gameplay is still available.',
      });
    });
    socket.on('connect_error', () => {
      setConnection({
        usersOnline: 0,
        status: 'disconnected',
        error: 'Live updates are unavailable. Check the API key and allowed frontend origin.',
      });
    });
    socket.on('VideoAdded', () => eventsRef.current.onVideoAdded?.());
    socket.on('VideoDeleted', () => eventsRef.current.onVideoDeleted?.());
    const timer = window.setTimeout(() => socket.connect(), 0);
    return () => {
      window.clearTimeout(timer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);
  return connection;
}
