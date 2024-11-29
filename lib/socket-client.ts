'use client';

import { io, Socket } from 'socket.io-client';
import { FileEventMap } from '@/types/socket';

class SocketClient {
  private static instance: SocketClient;
  private socket: Socket<FileEventMap> | null = null;

  private constructor() {}

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }

  public connect(): Socket<FileEventMap> {
    if (!this.socket || !this.socket.connected) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      
      this.socket = io(socketUrl, {
        path: '/socket',
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket'],
      });

      this.setupSocketHandlers();
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }

    return this.socket;
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }

  public getSocket(): Socket<FileEventMap> | null {
    return this.socket;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = SocketClient.getInstance(); 