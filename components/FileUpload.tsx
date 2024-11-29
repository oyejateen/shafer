'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'react-qr-code';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useSocket } from '@/hooks/use-socket';
import { useToast } from '@/hooks/use-toast';
import { FileTransfer } from '@/lib/file-transfer';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const socket = useSocket();
  const { toast } = useToast();

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!socket || acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 100MB',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setFile(file);
      setProgress(0);
      const roomId = uuidv4();
      await FileTransfer.initiateSending(socket, file, roomId);
      
      const shareUrl = `${window.location.origin}/share/${roomId}`;
      setShareLink(shareUrl);
      
      toast({
        title: 'File ready to share',
        description: 'Share the link or QR code with the recipient.',
      });
    } catch (error) {
      console.error('Error initiating file transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare file for sharing',
        variant: 'destructive',
      });
    }
  }, [socket, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag & drop a file here, or click to select'}
        </p>
      </div>

      {file && shareLink && (
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="font-medium">File ready to share:</p>
            <p className="text-sm text-gray-500">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Share via link:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 p-2 text-sm bg-gray-50 rounded border"
              />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  toast({
                    title: 'Link copied',
                    description: 'Share link has been copied to clipboard.',
                  });
                }}
                size="sm"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-medium">Or scan QR code:</p>
            <div className="bg-white p-4 rounded-lg inline-block">
              <QRCode value={shareLink} size={128} />
            </div>
          </div>
        </Card>
      )}
      {progress > 0 && progress < 100 && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-gray-500">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </div>
  );
}