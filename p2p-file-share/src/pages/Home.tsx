import React from 'react';
import FileUpload from '../components/FileUpload';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">P2P File Sharing</h1>
      <FileUpload />
    </div>
  );
};

export default Home;