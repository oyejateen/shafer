import React, { useState, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { useDropzone } from 'react-dropzone';
import QRCode from './QRCode';
import { initiatePeerConnection, sendFile } from '../utils/webrtc';
import socket from '../utils/socket';

const FileUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [_peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isPeerActive, setIsPeerActive] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState<number>(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      generateShareLink(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const generateShareLink = (file: File) => {
    const fileId = btoa(file.name + Date.now());
    const shortUrl = `${window.location.origin}/download/${fileId}`;
    setShareLink(shortUrl);
    setRoomId(fileId);
  };

  useEffect(() => {
    if (roomId && file) {
      console.log('Creating room:', roomId);
      socket.emit('create-room', roomId);
      const newPeer = initiatePeerConnection(true);
      setPeer(newPeer);
      setIsPeerActive(true);

      newPeer.on('signal', (data) => {
        if (isPeerActive) {
          console.log('Sending signal from uploader');
          socket.emit('signal', { to: roomId, signal: data });
        }
      });

      socket.on('peer-joined', (peerId) => {
        console.log('Peer joined:', peerId);
        if (isPeerActive && newPeer && file) {
          console.log('Starting file transfer');
          newPeer.on('connect', () => {
            console.log('Peer connection established in uploader, sending file');
            sendFile(newPeer, file, (progress) => {
              console.log(`Upload progress: ${progress}%`);
              setUploadProgress(progress);
            }).catch((error) => {
              console.error('Error sending file:', error);
            });
          });
        }
      });

      socket.on('signal', ({ from, signal }) => {
        console.log('Received signal from:', from);
        if (isPeerActive && newPeer) {
          newPeer.signal(signal);
        }
      });

      newPeer.on('connect', () => {
        console.log('Peer connection established in uploader');
        if (file) {
          console.log('Starting file transfer');
          sendFile(newPeer, file, (progress) => {
            console.log(`Upload progress: ${progress}%`);
            setUploadProgress(progress);
          }).catch((error) => {
            console.error('Error sending file:', error);
          });
        }
      });

      return () => {
        setIsPeerActive(false);
        if (newPeer) {
          newPeer.destroy();
        }
        socket.off('peer-joined');
        socket.off('signal');
      };
    }
  }, [roomId, file]);

  return (
    <div className="max-w-md mx-auto mt-10">
      <div
        {...getRootProps()}
        className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500">Drop the file here...</p>
        ) : (
          <p>Drag 'n' drop a file here, or click to select a file</p>
        )}
      </div>
      {file && (
        <div className="mt-4">
          <p className="font-semibold">Selected file: {file.name}</p>
        </div>
      )}
      {shareLink && (
        <div className="mt-4">
          <p className="font-semibold">Share Link:</p>
          <a href={shareLink} className="text-blue-500 break-all" target="_blank" rel="noopener noreferrer">
            {shareLink}
          </a>
          <div className="mt-2">
            <QRCode value={shareLink} />
          </div>
        </div>
      )}
    </div>
  );
};


export default FileUpload;
