export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

export interface ServerToClientEvents {
  'room-created': (data: { roomId: string }) => void;
  'ready-to-receive': (data: { metadata: FileMetadata }) => void;
  'receive-chunk': (data: { chunk: ArrayBuffer; chunkIndex: number; totalChunks: number }) => void;
  'transfer-complete': () => void;
  'transfer-cancelled': (reason: string) => void;
  'room-error': (error: string) => void;
  'recipient-joined': (data: { recipientId: string; roomId: string }) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: { roomId: string; metadata: FileMetadata }) => void;
  'join-room': (roomId: string) => void;
  'file-chunk': (data: { chunk: ArrayBuffer; roomId: string; chunkIndex: number; totalChunks: number }) => void;
  'transfer-complete': (roomId: string) => void;
}

export type FileEventMap = ServerToClientEvents & ClientToServerEvents; 