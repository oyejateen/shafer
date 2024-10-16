import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import Download from './pages/Download';
import Background3D from './components/ThreeDBackground';

const App: React.FC = () => {
  return (
    <Router>
      <Background3D/>
      <Routes>
        <Route path="/" element={<FileUpload />} />
        <Route path="/download/:id" element={<Download />} />
      </Routes>
    </Router>
  );
};

export default App;