import { Socket } from 'socket.io-client';

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

export class FileTransfer {
  private static CHUNK_SIZE = 1024 * 64; // 64KB chunks

  static async initiateSending(socket: Socket, file: File, roomId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);
      
      const metadata: FileMetadata = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalChunks
      };

      // Create room for file transfer
      socket.emit('create-room', { roomId, metadata });

      // Wait for room creation confirmation
      socket.once('room-created', ({ roomId }) => {
        resolve(roomId);
      });

      // Listen for recipients joining
      socket.on('recipient-joined', async ({ recipientId }) => {
        // Start sending file chunks
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
        
        socket.emit('transfer-complete', roomId);
      });
    });
  }

  static async receiveFile(socket: Socket, roomId: string): Promise<{ file: Blob, metadata: FileMetadata }> {
    return new Promise((resolve, reject) => {
      const chunks: ArrayBuffer[] = [];
      let metadata: FileMetadata;

      socket.emit('join-room', roomId);

      socket.on('ready-to-receive', ({ metadata: receivedMetadata }) => {
        metadata = receivedMetadata;
      });

      socket.on('receive-chunk', ({ chunk, chunkIndex, totalChunks }) => {
        chunks[chunkIndex] = chunk;
        
        // Check if all chunks received
        if (chunks.filter(Boolean).length === totalChunks) {
          const file = new Blob(chunks, { type: metadata.fileType });
          resolve({ file, metadata });
        }
      });

      socket.on('transfer-cancelled', (reason) => {
        reject(new Error(reason));
      });

      socket.on('room-error', (error) => {
        reject(new Error(error));
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