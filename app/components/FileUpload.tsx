import { useEffect, useState } from 'react';
import { FileTransfer } from '@/utils/fileTransfer';
import QRCode from 'qrcode.react';
import socketConnection from '@/utils/socketServer';

export default function FileUpload() {
  const [shareLink, setShareLink] = useState<string>('');

  useEffect(() => {
    const socket = socketConnection.connect();
    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const handleFileUpload = async (file: File) => {
    const socket = socketConnection.getSocket();
    if (!socket) return;
    
    const roomId = crypto.randomUUID();
    await FileTransfer.initiateSending(socket, file, roomId);
    
    const shareUrl = `${window.location.origin}/share/${roomId}`;
    setShareLink(shareUrl);
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
      />
      
      {shareLink && (
        <div>
          <p>Share this link: {shareLink}</p>
          <QRCode value={shareLink} />
        </div>
      )}
    </div>
  );
} 