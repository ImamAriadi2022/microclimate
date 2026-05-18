import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Route, Routes } from 'react-router-dom';
import DashboardSect from '../components/kalimantan/Dashboardsect';
import Download from '../components/kalimantan/Download';
import Sidebar from '../components/kalimantan/Sidebar';
import Station1 from '../components/kalimantan/Station1';

const Kalimantan = () => {
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
          {/* Kalimantan Section */}
          <Route path="/" element={<DashboardSect />} />

          {/* Station 1 */}
          <Route path="/station1" element={<Station1 />} />

          {/* Download Data */}
          <Route path="/download" element={<Download />} />
        </Routes>
      </div>
    </div>
  );
};

export default Kalimantan;