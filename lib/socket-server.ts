// Create this file in the 'lib' folder at the root of your project
// Full path: project/lib/socket-server.ts

import { Server, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { EventEmitter } from 'events';
import { FileEventMap } from '@/types/socket';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

interface Room {
  sender: string;
  metadata: FileMetadata;
  recipients: string[];
}

export class SocketServer extends EventEmitter {
  private static instance: SocketServer;
  private io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;
  private activeRooms: Map<string, Room> = new Map();

  private constructor() {
    super();
  }

  public static getInstance(): SocketServer {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer();
    }
    return SocketServer.instance;
  }

  public initialize(httpServer: HTTPServer): Server<ClientToServerEvents, ServerToClientEvents> {
    if (this.io) return this.io;

    this.io = new Server(httpServer, {
      cors: { 
        origin: '*', 
        methods: ['GET', 'POST'] 
      },
      path: '/api/socket',
      transports: ['websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
      maxHttpBufferSize: 1e8, // 100 MB
      allowUpgrades: false,
      perMessageDeflate: false,
      httpCompression: false,
    });

    this.setupSocketHandlers();
    this.emit('ready');
    return this.io;
  }

  private setupSocketHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    console.log('Client connected:', socket.id);

    socket.on('create-room', this.handleCreateRoom.bind(this, socket));
    socket.on('join-room', this.handleJoinRoom.bind(this, socket));
    socket.on('file-chunk', this.handleFileChunk.bind(this, socket));
    socket.on('transfer-complete', this.handleTransferComplete.bind(this, socket));
    socket.on('disconnect', this.handleDisconnect.bind(this, socket));

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleSocketError(socket, error);
    });
  }

  private handleSocketError(socket: Socket, error: Error): void {
    console.error(`Socket ${socket.id} error:`, error);
    socket.emit('room-error', 'Internal server error');
  }

  private handleCreateRoom(socket: Socket, { roomId, metadata }: { roomId: string; metadata: FileMetadata }): void {
    try {
      this.activeRooms.set(roomId, {
        sender: socket.id,
        metadata,
        recipients: []
      });
      socket.join(roomId);
      console.log(`Room ${roomId} created by ${socket.id}`);
      socket.emit('room-created', { roomId });
    } catch (error) {
      this.handleSocketError(socket, error as Error);
    }
  }

  private handleJoinRoom(socket: Socket, roomId: string): void {
    try {
      const room = this.activeRooms.get(roomId);
      if (!room) {
        socket.emit('room-error', 'Room not found or expired');
        return;
      }

      this.io?.to(room.sender).emit('recipient-joined', {
        recipientId: socket.id,
        roomId
      });
      
      socket.join(roomId);
      socket.emit('ready-to-receive', { metadata: room.metadata });
      room.recipients.push(socket.id);
    } catch (error) {
      this.handleSocketError(socket, error as Error);
    }
  }

  private handleFileChunk(socket: Socket, data: { chunk: ArrayBuffer; roomId: string; chunkIndex: number; totalChunks: number }): void {
    try {
      const room = this.activeRooms.get(data.roomId);
      if (room?.sender === socket.id) {
        socket.to(data.roomId).emit('receive-chunk', data);
      }
    } catch (error) {
      this.handleSocketError(socket, error as Error);
    }
  }

  private handleTransferComplete(socket: Socket, roomId: string): void {
    try {
      const room = this.activeRooms.get(roomId);
      if (room?.sender === socket.id) {
        socket.to(roomId).emit('transfer-complete');
        this.activeRooms.delete(roomId);
      }
    } catch (error) {
      this.handleSocketError(socket, error as Error);
    }
  }

  private handleDisconnect(socket: Socket): void {
    try {
      Array.from(this.activeRooms.entries())
        .filter(([_, room]) => room.sender === socket.id)
        .forEach(([roomId]) => {
          this.io?.to(roomId).emit('transfer-cancelled', 'Sender disconnected');
          this.activeRooms.delete(roomId);
        });
      console.log('Client disconnected:', socket.id);
    } catch (error) {
      console.error('Error in disconnect handler:', error);
    }
  }

  public getIO(): Server<ClientToServerEvents, ServerToClientEvents> | null {
    return this.io;
  }
}

export default SocketServer.getInstance();