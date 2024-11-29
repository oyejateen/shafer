'use client';

import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { FileEventMap } from '@/types/socket';
import { socketClient } from '@/lib/socket-client';
import { useSocketState } from './use-socket-state';

export function useSocket() {
  const socketRef = useRef<Socket<FileEventMap> | null>(null);
  const { setConnected, setConnecting, setError } = useSocketState();

  useEffect(() => {
    setConnecting(true);
    
    try {
      socketRef.current = socketClient.connect();

      socketRef.current.on('connect', () => {
        setConnected(true);
        setError(null);
      });

      socketRef.current.on('connect_error', (error) => {
        setError(error);
        setConnected(false);
      });

      socketRef.current.on('disconnect', () => {
        setConnected(false);
      });

    } catch (error) {
      setError(error as Error);
    }

    return () => {
      socketClient.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [setConnected, setConnecting, setError]);

  return socketRef.current;
} 