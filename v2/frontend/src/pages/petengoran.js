import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Route, Routes } from 'react-router-dom';
import DashboardSect from '../components/petengoran/Dashboardsect';
import Download from '../components/petengoran/Download';
import Sidebar from '../components/petengoran/Sidebar';
import Station1 from '../components/petengoran/Station1';
import Station2 from '../components/petengoran/Station2';

const Petengoran = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Tombol Toggle Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: isSidebarOpen ? '260px' : '20px', // Posisi tombol berubah berdasarkan status sidebar
          zIndex: 1000,
          cursor: 'pointer',
          transition: '0.3s',
        }}
        onClick={toggleSidebar}
      >
        <FaBars style={{ fontSize: '24px', color: '#007bff' }} />
      </div>

      {/* Main Content */}
      <div
        style={{
          marginLeft: isSidebarOpen ? '250px' : '0', // Konten utama menyesuaikan posisi sidebar
          width: '100%',
          transition: '0.3s',
        }}
      >
        <Routes>
          {/* Petengoran Section */}
          <Route path="/" element={<DashboardSect />} />

          {/* Station 1 */}
          <Route path="/station1" element={<Station1 />} />
          {/* Station 2 */}
          <Route path="/station2" element={<Station2 />} />

          {/* Download Data */}
          <Route path="/download" element={<Download />} />
        </Routes>
      </div>
    </div>
  );
};

export default Petengoran;
