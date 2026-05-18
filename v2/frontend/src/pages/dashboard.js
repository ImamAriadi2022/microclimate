import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Route, Routes } from 'react-router-dom';
import DashboardSect from '../components/dashboard/Dashboardsect';
import Download from '../components/dashboard/Download';
import Sidebar from '../components/dashboard/Sidebar';
import Station1 from '../components/dashboard/Station1';
import Station2 from '../components/dashboard/Station2';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 992;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* Tombol Toggle Sidebar */}
      <button
        type="button"
        className={`sidebar-toggle ${isSidebarOpen ? 'sidebar-toggle--shifted' : ''}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <FaBars />
      </button>

      {/* Main Content */}
      <div
        className={`app-content ${isSidebarOpen ? '' : 'app-content--collapsed'}`}
      >
        <Routes>
          {/* Dashboard Section */}
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

export default Dashboard;