import React, { useState, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { initiatePeerConnection, receiveFile } from '../utils/webrtc';
import socket from '../utils/socket';

interface FileDownloadProps {
  fileId: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ fileId }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [isPeerActive, setIsPeerActive] = useState(false);
  const [receivedFile, setReceivedFile] = useState<File | null>(null);

  useEffect(() => {
    const decodedFileName = atob(fileId).split(Date.now().toString())[0];
    setFileName(decodedFileName);

    console.log('Joining room:', fileId);
    socket.emit('join-room', fileId);
    const newPeer = initiatePeerConnection(false);
    setPeer(newPeer);
    setIsPeerActive(true);

    newPeer.on('signal', (data) => {
      if (isPeerActive) {
        console.log('Sending signal from downloader');
        socket.emit('signal', { to: fileId, signal: data });
      }
    });

    socket.on('joined-room', (roomId) => {
      console.log('Successfully joined room:', roomId);
    });

    socket.on('room-not-found', () => {
      console.error('Room not found');
      setError('The file is not available for download. Please check the link and try again.');
    });

    socket.on('signal', ({ from, signal }) => {
      console.log('Received signal in downloader from:', from);
      if (isPeerActive) {
        newPeer.signal(signal);
      }
    });

    newPeer.on('connect', () => {
      console.log('Peer connection established in downloader');
      console.log('Waiting for file transfer to start');
    });

    newPeer.on('data', (data) => {
      console.log('Received data in downloader');
      receiveFile(newPeer, (progress) => {
        console.log(`Download progress: ${progress}%`);
        setDownloadProgress(progress);
      }).then((file) => {
        console.log('File received:', file);
        setReceivedFile(file);
      }).catch((error) => {
        console.error('Error receiving file:', error);
        setError('Failed to download the file. Please try again.');
      });
    });

    newPeer.on('error', (err) => {
      console.error('Peer connection error:', err);
      setError('Failed to establish peer connection. Please try again.');
    });

    return () => {
      setIsPeerActive(false);
      if (newPeer) {
        newPeer.destroy();
      }
      socket.off('signal');
      socket.off('joined-room');
      socket.off('room-not-found');
    };
  }, [fileId]);

  const handleDownload = async () => {
    if (!peer) {
      console.error('Peer not initialized');
      return;
    }

    try {
      console.log('Starting file download');
      const file = await receiveFile(peer, (progress) => {
        console.log('Download progress:', progress);
        setDownloadProgress(progress);
      });
      console.log('File received:', file);
      setReceivedFile(file);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download the file. Please try again.');
    }
  };

  const triggerDownload = () => {
    if (receivedFile) {
      const url = URL.createObjectURL(receivedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'downloaded-file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Download File</h2>
      {fileName && (
        <p className="mb-4 text-gray-700">
          File: <span className="font-semibold">{fileName}</span>
        </p>
      )}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        onClick={handleDownload}
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Start Download
      </button>
      {downloadProgress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2 text-gray-600">{downloadProgress.toFixed(2)}% downloaded</p>
        </div>
      )}
      {receivedFile && (
        <button
          onClick={triggerDownload}
          className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Save File
        </button>
      )}
    </div>
  );
};

export default FileDownload;