import { Socket } from 'socket.io-client';
import { FileEventMap, FileMetadata } from '@/types/socket';

interface ReceiveOptions {
  onProgress?: (progress: number) => void;
}

export class FileTransfer {
  private static CHUNK_SIZE = 1024 * 64; // 64KB chunks

  static async initiateSending(socket: Socket<FileEventMap>, file: File, roomId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
        
        const metadata: FileMetadata = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          totalChunks
        };

        socket.emit('create-room', { roomId, metadata });

        const cleanup = () => {
          socket.off('room-created');
          socket.off('recipient-joined');
          socket.off('room-error');
        };

        socket.once('room-created', ({ roomId }) => {
          resolve(roomId);
        });

        socket.on('recipient-joined', async ({ recipientId }) => {
          try {
            await this.sendFileChunks(socket, file, roomId, totalChunks);
            socket.emit('transfer-complete', roomId);
          } catch (error) {
            console.error('Error sending file chunks:', error);
            cleanup();
            reject(error);
          }
        });

        socket.on('room-error', (error) => {
          cleanup();
          reject(new Error(error));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private static async sendFileChunks(
    socket: Socket<FileEventMap>,
    file: File,
    roomId: string,
    totalChunks: number
  ): Promise<void> {
    for (let i = 0; i < totalChunks; i++) {
      const chunk = await this.readChunk(file, i);
      socket.emit('file-chunk', {
        chunk,
        roomId,
        chunkIndex: i,
        totalChunks
      });
      
      // Add small delay to prevent overwhelming the connection
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  static async receiveFile(
    socket: Socket<FileEventMap>, 
    roomId: string,
    options: ReceiveOptions = {}
  ): Promise<{ file: Blob, metadata: FileMetadata }> {
    return new Promise((resolve, reject) => {
      const chunks: ArrayBuffer[] = [];
      let metadata: FileMetadata;
      let receivedChunks = 0;

      const cleanup = () => {
        socket.off('ready-to-receive');
        socket.off('receive-chunk');
        socket.off('transfer-complete');
        socket.off('transfer-cancelled');
        socket.off('room-error');
      };

      socket.emit('join-room', roomId);

      socket.on('ready-to-receive', ({ metadata: receivedMetadata }) => {
        metadata = receivedMetadata;
      });

      socket.on('receive-chunk', ({ chunk, chunkIndex, totalChunks }) => {
        chunks[chunkIndex] = chunk;
        receivedChunks++;
        
        if (options.onProgress) {
          options.onProgress((receivedChunks / totalChunks) * 100);
        }
        
        if (chunks.filter(Boolean).length === totalChunks) {
          const file = new Blob(chunks, { type: metadata.fileType });
          cleanup();
          resolve({ file, metadata });
        }
      });

      socket.on('transfer-cancelled', (reason) => {
        cleanup();
        reject(new Error(reason));
      });

      socket.on('room-error', (error) => {
        cleanup();
        reject(new Error(error));
      });

      // Add timeout
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Transfer timed out'));
      }, 5 * 60 * 1000); // 5 minutes timeout

      socket.once('transfer-complete', () => {
        clearTimeout(timeout);
      });
    });
  }

  private static async readChunk(file: File, chunkIndex: number): Promise<ArrayBuffer> {
    const start = chunkIndex * this.CHUNK_SIZE;
    const end = Math.min(start + this.CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    return await chunk.arrayBuffer();
  }
} 