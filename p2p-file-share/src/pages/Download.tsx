import React from 'react';
import FileDownload from '../components/FileDownload';
import { useParams } from 'react-router-dom';

const Download: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Download File</h1>
      {id && <FileDownload fileId={id} />}
    </div>
  );
};

export default Download;