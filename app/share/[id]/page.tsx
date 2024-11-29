'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/use-socket';
import { FileTransfer } from '@/lib/file-transfer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalChunks: number;
}

export default function SharePage({ params }: { params: { id: string } }) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const socket = useSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const handleMetadata = ({ metadata }: { metadata: FileMetadata }) => {
      setMetadata(metadata);
    };

    socket.on('ready-to-receive', handleMetadata);

    return () => {
      socket.off('ready-to-receive', handleMetadata);
    };
  }, [socket]);

  const handleAcceptFile = async () => {
    if (!socket) return;

    try {
      setIsAccepted(true);
      setIsReceiving(true);

      const { file, metadata } = await FileTransfer.receiveFile(socket, params.id, {
        onProgress: (progress) => setProgress(progress)
      });

      // Create and trigger download
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'File received',
        description: `${metadata.fileName} has been downloaded.`
      });
    } catch (error) {
      console.error('File transfer failed:', error);
      toast({
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Failed to receive file',
        variant: 'destructive'
      });
    } finally {
      setIsReceiving(false);
    }
  };

  if (!socket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <Card className="p-6">
        {!isAccepted ? (
          <div className="space-y-4">
            <h1 className="text-xl font-semibold">Someone wants to share a file with you</h1>
            {metadata && (
              <div className="text-sm text-gray-600">
                <p>File: {metadata.fileName}</p>
                <p>Size: {(metadata.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            )}
            <Button onClick={handleAcceptFile} className="w-full">
              Accept and Download
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-medium">Receiving file...</h2>
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600 text-center">{progress.toFixed(0)}%</p>
          </div>
        )}
      </Card>
    </div>
  );
}