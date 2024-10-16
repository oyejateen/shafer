import SimplePeer from 'simple-peer';

interface FileChunk {
  data: ArrayBuffer;
  sequence: number;
  last: boolean;
}

export const initiatePeerConnection = (isInitiator: boolean): SimplePeer.Instance => {
  console.log('Initiating peer connection, isInitiator:', isInitiator);
  return new SimplePeer({
    initiator: isInitiator,
    trickle: true,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
  });
};

export const sendFile = (peer: SimplePeer.Instance, file: File, onProgress: (progress: number) => void): Promise<void> => {
  return new Promise((resolve, reject) => {
    const chunkSize = 16 * 1024; // 16KB chunks
    let offset = 0;
    let sequence = 0;

    console.log('Starting to send file:', file.name, 'Size:', file.size);

    // Send file metadata first
    peer.send(JSON.stringify({ type: 'file-metadata', name: file.name, size: file.size }));

    const sendChunk = () => {
      const chunk = file.slice(offset, offset + chunkSize);
      chunk.arrayBuffer().then((buffer) => {
        console.log(`Sending chunk ${sequence}, size: ${buffer.byteLength}`);
        peer.send(buffer);

        offset += buffer.byteLength;
        const progress = Math.min(100, Math.floor((offset / file.size) * 100));
        onProgress(progress);

        if (offset < file.size) {
          setTimeout(sendChunk, 0);
        } else {
          console.log('File sent successfully');
          resolve();
        }
      }).catch(reject);
    };

    sendChunk();
  });
};

export const receiveFile = (peer: SimplePeer.Instance, onProgress: (progress: number) => void): Promise<File> => {
  return new Promise((resolve, reject) => {
    let fileMetadata: { name: string; size: number } | null = null;
    const chunks: ArrayBuffer[] = [];
    let receivedSize = 0;

    console.log('Starting to receive file');

    const handleData = (data: any) => {
      if (typeof data === 'string') {
        try {
          const message = JSON.parse(data);
          if (message.type === 'file-metadata') {
            console.log('Received file metadata:', message);
            fileMetadata = { name: message.name, size: message.size };
          }
        } catch (error) {
          console.error('Error parsing metadata:', error);
        }
      } else if (data instanceof ArrayBuffer) {
        console.log(`Received chunk, size: ${data.byteLength}`);
        chunks.push(data);
        receivedSize += data.byteLength;

        if (fileMetadata) {
          const progress = Math.min(100, Math.floor((receivedSize / fileMetadata.size) * 100));
          onProgress(progress);
          console.log(`Received ${receivedSize} bytes out of ${fileMetadata.size}`);

          if (receivedSize === fileMetadata.size) {
            console.log('File received successfully');
            const file = new File(chunks, fileMetadata.name, { type: 'application/octet-stream' });
            resolve(file);
          }
        }
      }
    };

    peer.on('data', handleData);
    peer.on('error', (err) => {
      console.error('Peer error during file receive:', err);
      reject(err);
    });
  });
};