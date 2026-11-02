import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Route, Routes } from 'react-router-dom';
import DashboardSect from '../components/kalimantan/Dashboardsect';
import Download from '../components/kalimantan/Download';
import Sidebar from '../components/kalimantan/Sidebar';
import Station1 from '../components/kalimantan/Station1';

const Kalimantan = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 992;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} />

      <button
        type="button"
        className={`sidebar-toggle ${isSidebarOpen ? 'sidebar-toggle--shifted' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      <div className={`app-content ${isSidebarOpen ? '' : 'app-content--collapsed'}`}>
        <Routes>
          <Route path="/" element={<DashboardSect />} />
          <Route path="/station1" element={<Station1 />} />
          <Route path="/download" element={<Download />} />
        </Routes>
      </div>
    </div>
  );
};

export default Kalimantan;
