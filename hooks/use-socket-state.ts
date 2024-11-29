'use client';

import { create } from 'zustand';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useSocketState = create<SocketState>((set) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  setConnected: (connected) => set({ isConnected: connected, isConnecting: false }),
  setConnecting: (connecting) => set({ isConnecting: connecting }),
  setError: (error) => set({ error, isConnecting: false }),
})); 