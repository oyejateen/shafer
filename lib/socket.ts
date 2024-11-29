import { createServer } from 'http';
import { AddressInfo } from 'net';
import socketServer from './socket-server';
import type { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/socket';

interface ServerInstance {
  httpServer: HTTPServer;
  socketServer: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
}

export async function createSocketServer(port: number): Promise<ServerInstance> {
  return new Promise((resolve, reject) => {
    try {
      const httpServer = createServer();

      httpServer.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Please choose a different port.`);
          reject(error);
        } else {
          console.error('Server error:', error);
          reject(error);
        }
      });

      const io = socketServer.initialize(httpServer);
      if (!io) {
        throw new Error('Failed to initialize socket server');
      }

      httpServer.listen(port, () => {
        const address = httpServer.address() as AddressInfo;
        console.log(`Socket.IO server running on http://localhost:${address.port}`);
        resolve({ httpServer, socketServer: io });
      });
    } catch (error) {
      console.error('Failed to create socket server:', error);
      reject(error);
    }
  });
}