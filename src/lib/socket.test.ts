import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameSocket } from './socket';

const SOCKET = vi.hoisted(() => {
  const handlers = new Map<string, (value?: unknown) => void>();
  const connection = {
    on: vi.fn((name: string, callback: (value?: unknown) => void) => {
      handlers.set(name, callback);
    }),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  };
  return { handlers, connection, io: vi.fn(() => connection) };
});
vi.mock('socket.io-client', () => ({ io: SOCKET.io }));
beforeEach(() => {
  vi.useFakeTimers();
  SOCKET.handlers.clear();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('live update compatibility', () => {
  it('uses only WebSocket and gameplay credentials, reports errors, and clears stale counts', () => {
    const { result, unmount } = renderHook(() => useGameSocket({}));
    act(() => {
      vi.runOnlyPendingTimers();
    });
    expect(SOCKET.io).toHaveBeenCalledWith(
      'https://api.example',
      expect.objectContaining({
        auth: { apiKey: 'public-test-client-key' },
        transports: ['websocket'],
      })
    );
    act(() => {
      SOCKET.handlers.get('connect')?.();
      SOCKET.handlers.get('CountUsers')?.(3);
    });
    expect(result.current.usersOnline).toBe(3);
    act(() => {
      SOCKET.handlers.get('CountUsers')?.('invalid');
    });
    expect(result.current.usersOnline).toBe(3);
    act(() => {
      SOCKET.handlers.get('disconnect')?.();
    });
    expect(result.current.usersOnline).toBe(0);
    expect(result.current.status).toBe('disconnected');
    act(() => {
      SOCKET.handlers.get('connect_error')?.();
    });
    expect(result.current.error).toContain('API key');
    unmount();
    expect(SOCKET.connection.removeAllListeners).toHaveBeenCalled();
    expect(SOCKET.connection.disconnect).toHaveBeenCalled();
  });
});
